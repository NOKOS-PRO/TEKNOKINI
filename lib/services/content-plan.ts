import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus, ContentPlan } from "@/types/database.types";

/**
 * Draf dibuat saat jadwal tayang jatuh dalam N jam ke depan. Bot berjalan sekali
 * sehari (jeda 24 jam), jadi dengan N = 48 setiap artikel pasti sudah berupa draf
 * antara 24 dan 48 jam sebelum tayang: cukup waktu untuk direview. Ubah lewat PLAN_LEAD_HOURS.
 */
export const PLAN_LEAD_HOURS = Number(process.env.PLAN_LEAD_HOURS) || 48;

/** Maksimal percobaan otomatis sebelum item ditandai gagal permanen. */
export const PLAN_MAX_ATTEMPTS = 3;

export interface PlanRow extends ContentPlan {
  category: { name: string; slug: string } | null;
  article: { id: string; title: string; status: ArticleStatus; published_at: string | null } | null;
}

export async function listPlan(options: { includeDone?: boolean } = {}): Promise<PlanRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_plan")
    .select("*, category:categories(name,slug), article:articles(id,title,status,published_at)")
    .order("publish_at", { ascending: true })
    .limit(200);
  if (!options.includeDone) query = query.neq("status", "cancelled");
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PlanRow[];
}

export async function createPlanItems(
  items: {
    topic: string;
    brief?: string | null;
    category_id: string;
    author_id?: string | null;
    publish_at: string;
    auto_schedule?: boolean;
    created_by?: string | null;
  }[],
): Promise<void> {
  if (items.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("content_plan").insert(items);
  if (error) throw error;
}

export async function deletePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("content_plan").delete().eq("id", id);
  if (error) throw error;
}

/** Jumlah item rencana untuk kartu dashboard. Mengembalikan nol bila tabel belum ada (migration 0006 belum dijalankan). */
export async function getPlanCounts(): Promise<{ upcoming: number; failed: number; awaitingReview: number }> {
  try {
    const supabase = await createClient();
    const [upcoming, failed, drafted] = await Promise.all([
      supabase.from("content_plan").select("id", { count: "exact", head: true }).in("status", ["planned", "drafting"]),
      supabase.from("content_plan").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("content_plan").select("article_id").eq("status", "drafted").limit(200),
    ]);

    const articleIds = (drafted.data ?? []).map((r) => r.article_id).filter((id): id is string => Boolean(id));
    let awaitingReview = 0;
    if (articleIds.length > 0) {
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .in("id", articleIds)
        .in("status", ["draft", "review"]);
      awaitingReview = count ?? 0;
    }

    return { upcoming: upcoming.count ?? 0, failed: failed.count ?? 0, awaitingReview };
  } catch {
    return { upcoming: 0, failed: 0, awaitingReview: 0 };
  }
}
