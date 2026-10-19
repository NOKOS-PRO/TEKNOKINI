import { createAdminClient } from "@/lib/supabase/server";
import { generateTopicArticle } from "@/lib/services/llm";
import { findStockPhoto } from "@/lib/services/stock-photo";
import { PLAN_LEAD_HOURS, PLAN_MAX_ATTEMPTS } from "@/lib/services/content-plan";
import { slugify, withUniqueSuffix } from "@/lib/utils/slug";

type Supabase = ReturnType<typeof createAdminClient>;

export interface PlanRunItem {
  id: string;
  topic: string;
  outcome: "drafted" | "failed" | "skipped";
  articleId?: string;
  error?: string;
}

const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/**
 * Buat draf untuk SATU item rencana. Aman dipanggil dari cron maupun tombol admin:
 * item "dikunci" dulu (status → drafting) supaya dua pemanggilan bersamaan tidak
 * menghasilkan dua artikel.
 */
export async function draftPlanItem(supabase: Supabase, planId: string): Promise<PlanRunItem> {
  const { data: claimed } = await supabase
    .from("content_plan")
    .select("*")
    .eq("id", planId)
    .in("status", ["planned", "failed"])
    .maybeSingle();
  if (!claimed) return { id: planId, topic: "", outcome: "skipped" };

  const { data: lock } = await supabase
    .from("content_plan")
    .update({ status: "drafting", attempts: claimed.attempts + 1, error: null })
    .eq("id", planId)
    .in("status", ["planned", "failed"])
    .select("id")
    .maybeSingle();
  if (!lock) return { id: planId, topic: claimed.topic, outcome: "skipped" };

  try {
    const [{ data: category }, { data: author }] = await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("id", claimed.category_id).single(),
      claimed.author_id
        ? supabase.from("authors").select("id").eq("id", claimed.author_id).maybeSingle()
        : supabase.from("authors").select("id").order("created_at").limit(1).maybeSingle(),
    ]);
    if (!category) throw new Error("Kategori untuk item ini sudah dihapus.");

    const draft = await generateTopicArticle({
      topic: claimed.topic,
      brief: claimed.brief,
      categoryName: category.name,
    });
    const content = draft.content.trim();
    if (content.split(/\n\s*\n/).filter(Boolean).length < 3) {
      throw new Error("Draf kurang dari 3 paragraf, tidak disimpan.");
    }

    let slug = slugify(draft.title);
    const { data: slugTaken } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
    if (slugTaken) slug = withUniqueSuffix(slug);

    const photo = await findStockPhoto(draft.image_query, category.slug);

    // Jadwal tayang disimpan di published_at. Status 'draft' tidak pernah tampil
    // publik; editor menyetujuinya (→ 'scheduled') dari /admin/plan atau editor artikel.
    const status = claimed.auto_schedule && new Date(claimed.publish_at) > new Date() ? "scheduled" : "draft";

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        title: cut(draft.title.trim(), 200),
        slug,
        excerpt: cut(draft.excerpt.trim(), 300),
        content,
        seo_title: cut(draft.seo_title.trim(), 70),
        seo_description: cut(draft.seo_description.trim(), 160),
        featured_image: photo?.url ?? null,
        featured_image_credit: photo?.credit ?? null,
        category_id: category.id,
        author_id: author?.id ?? null,
        status,
        published_at: claimed.publish_at,
      })
      .select("id")
      .single();
    if (error || !article) throw new Error(error?.message ?? "Gagal menyimpan draf.");

    await supabase
      .from("content_plan")
      .update({ status: "drafted", article_id: article.id, ai_notes: draft.fact_check || null, error: null })
      .eq("id", planId);

    return { id: planId, topic: claimed.topic, outcome: "drafted", articleId: article.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("content_plan").update({ status: "failed", error: cut(message, 500) }).eq("id", planId);
    return { id: planId, topic: claimed.topic, outcome: "failed", error: message };
  }
}

/**
 * Proses antrean: semua item yang jadwal tayangnya dalam PLAN_LEAD_HOURS ke depan
 * (termasuk yang sudah lewat), terdekat dulu. Berhenti bila waktu hampir habis
 * (batas fungsi serverless) — sisanya diambil pada run berikutnya.
 */
export async function runContentPlan(options: { budgetMs?: number } = {}): Promise<PlanRunItem[]> {
  const supabase = createAdminClient();
  const started = Date.now();
  const budgetMs = options.budgetMs ?? 45_000;

  const horizon = new Date(Date.now() + PLAN_LEAD_HOURS * 3_600_000).toISOString();
  const { data: due } = await supabase
    .from("content_plan")
    .select("id")
    .in("status", ["planned", "failed"])
    .lt("attempts", PLAN_MAX_ATTEMPTS)
    .lte("publish_at", horizon)
    .order("publish_at", { ascending: true })
    .limit(10);

  // Item 'drafting' yang tersangkut > 10 menit (fungsi mati di tengah jalan) dilepas lagi.
  await supabase
    .from("content_plan")
    .update({ status: "failed", error: "Proses terhenti sebelum selesai (timeout). Akan dicoba lagi." })
    .eq("status", "drafting")
    .lt("updated_at", new Date(Date.now() - 10 * 60_000).toISOString());

  const results: PlanRunItem[] = [];
  for (const row of due ?? []) {
    if (Date.now() - started > budgetMs) break;
    results.push(await draftPlanItem(supabase, row.id));
  }
  return results;
}
