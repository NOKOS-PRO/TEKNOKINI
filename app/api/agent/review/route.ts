import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Penanda yang ditulis ke content_plan.ai_notes setelah draf direview. */
const REVIEW_MARK = "[REVIEW CLAUDE";

/**
 * Secret KHUSUS review (REVIEW_SECRET), terpisah dari AGENT_SECRET/CRON_SECRET: pemegangnya
 * hanya bisa membaca draf dan menulis vonis — tidak bisa memicu bot atau menerbitkan artikel.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.REVIEW_SECRET;
  return Boolean(secret) && request.headers.get("x-review-secret") === secret;
}

/** Draf yang menunggu review (maks. 5 per panggilan), jadwal tayang terdekat dulu. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: plans, error } = await supabase
    .from("content_plan")
    .select("id, topic, brief, publish_at, ai_notes, article_id, articles(id, title, slug, excerpt, content, seo_title, seo_description, status)")
    .eq("status", "drafted")
    .not("article_id", "is", null)
    .order("publish_at", { ascending: true })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pending = (plans ?? [])
    .filter((p) => !(p.ai_notes ?? "").includes(REVIEW_MARK))
    .filter((p) => {
      const article = Array.isArray(p.articles) ? p.articles[0] : p.articles;
      return article && (article.status === "draft" || article.status === "scheduled");
    })
    .slice(0, 5)
    .map((p) => ({
      planId: p.id,
      topic: p.topic,
      brief: p.brief,
      publishAt: p.publish_at,
      aiNotes: p.ai_notes,
      article: Array.isArray(p.articles) ? p.articles[0] : p.articles,
    }));

  return NextResponse.json({ pending });
}

const verdictSchema = z.object({
  planId: z.string().uuid(),
  verdict: z.enum(["AMAN", "REVISI", "TOLAK"]),
  notes: z.string().min(1).max(4000),
});

/**
 * Simpan vonis review. Tidak pernah menerbitkan artikel. Kalau vonisnya REVISI/TOLAK dan
 * artikel sudah berstatus 'scheduled' (mis. "tayang otomatis"), ia dikembalikan ke 'draft'
 * supaya tidak tayang sebelum manusia memeriksanya.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = verdictSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  const { planId, verdict, notes } = parsed.data;

  const supabase = createAdminClient();
  const { data: plan } = await supabase
    .from("content_plan")
    .select("id, ai_notes, article_id")
    .eq("id", planId)
    .eq("status", "drafted")
    .maybeSingle();
  if (!plan) return NextResponse.json({ error: "Item rencana tidak ditemukan atau belum berstatus drafted." }, { status: 404 });

  const stamp = new Date().toISOString().slice(0, 10);
  const entry = `${REVIEW_MARK} ${stamp}] VERDICT: ${verdict}\n${notes.trim()}`;
  const aiNotes = plan.ai_notes ? `${plan.ai_notes}\n\n---\n${entry}` : entry;
  const { error } = await supabase.from("content_plan").update({ ai_notes: aiNotes }).eq("id", planId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let unscheduled = false;
  if (verdict !== "AMAN" && plan.article_id) {
    const { data } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", plan.article_id)
      .eq("status", "scheduled")
      .select("id");
    unscheduled = (data?.length ?? 0) > 0;
  }

  return NextResponse.json({ ok: true, verdict, unscheduled });
}
