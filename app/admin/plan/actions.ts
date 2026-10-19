"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createPlanItems, deletePlanItem } from "@/lib/services/content-plan";
import { draftPlanItem } from "@/lib/services/plan-runner";
import { suggestTopics } from "@/lib/services/llm";

export interface PlanFormState {
  error?: string;
  ok?: string;
}

const MAX_ITEMS = 31;

/**
 * Satu baris = satu artikel. Format "Topik" atau "Topik | catatan untuk AI".
 * Item ke-n dijadwalkan start + n × interval hari (pada jam yang sama).
 */
export async function createPlanAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const profile = await requireRole(["admin", "editor"]);

  const lines = String(formData.get("topics") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const categoryId = String(formData.get("category_id") ?? "");
  const authorId = String(formData.get("author_id") ?? "") || null;
  const start = new Date(String(formData.get("start_iso") ?? ""));
  const interval = Math.min(Math.max(Number(formData.get("interval_days")) || 1, 1), 30);
  const autoSchedule = formData.get("auto_schedule") === "on";

  if (lines.length === 0) return { error: "Isi minimal satu topik." };
  if (lines.length > MAX_ITEMS) return { error: `Maksimal ${MAX_ITEMS} topik sekali simpan.` };
  if (!categoryId) return { error: "Pilih kategori." };
  if (Number.isNaN(start.getTime())) return { error: "Tanggal dan jam tayang tidak valid." };
  if (start.getTime() < Date.now() - 5 * 60_000) return { error: "Jadwal tayang pertama sudah lewat." };

  const items: Parameters<typeof createPlanItems>[0] = [];
  for (const [i, line] of lines.entries()) {
    const [topicRaw = "", ...rest] = line.split("|");
    const topic = topicRaw.trim();
    const brief = rest.join("|").trim();
    if (topic.length < 5 || topic.length > 300) {
      return { error: `Baris ${i + 1}: topik harus 5–300 karakter.` };
    }
    items.push({
      topic,
      brief: brief || null,
      category_id: categoryId,
      author_id: authorId,
      publish_at: new Date(start.getTime() + i * interval * 86_400_000).toISOString(),
      auto_schedule: autoSchedule,
      created_by: profile.id,
    });
  }

  try {
    await createPlanItems(items);
  } catch (err) {
    return { error: `Gagal menyimpan: ${err instanceof Error ? err.message : "kesalahan tidak dikenal"}` };
  }
  revalidatePath("/admin/plan");
  return { ok: `${items.length} topik masuk rencana. Draf dibuat otomatis 24–48 jam sebelum jadwal tayang.` };
}

export async function deletePlanAction(id: string): Promise<{ error?: string }> {
  await requireRole(["admin", "editor"]);
  try {
    await deletePlanItem(id);
  } catch {
    return { error: "Gagal menghapus item." };
  }
  revalidatePath("/admin/plan");
  return {};
}

/** Buat draf sekarang untuk satu item (tanpa menunggu bot harian). Bisa 20–60 detik. */
export async function draftNowAction(id: string): Promise<{ error?: string }> {
  await requireRole(["admin", "editor"]);
  const result = await draftPlanItem(createAdminClient(), id);
  revalidatePath("/admin/plan");
  revalidatePath("/admin/articles");
  if (result.outcome === "failed") return { error: result.error ?? "Gagal membuat draf." };
  if (result.outcome === "skipped") return { error: "Item ini sedang diproses atau sudah selesai." };
  return {};
}

/**
 * Setujui draf: jadwal masih di masa depan → 'scheduled' (tayang otomatis tepat waktu);
 * sudah lewat → langsung 'published'.
 */
export async function approveArticleAction(articleId: string): Promise<{ error?: string }> {
  await requireRole(["admin", "editor"]);
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id,status,published_at,title,content,category_id")
    .eq("id", articleId)
    .single();
  if (!article) return { error: "Artikel tidak ditemukan." };
  if (article.status !== "draft" && article.status !== "review") {
    return { error: `Artikel sudah berstatus ${article.status}.` };
  }
  if (!article.category_id) return { error: "Artikel belum punya kategori." };

  const now = new Date();
  const future = article.published_at && new Date(article.published_at) > now;
  const { error } = await supabase
    .from("articles")
    .update(
      future
        ? { status: "scheduled" }
        : { status: "published", published_at: article.published_at ?? now.toISOString() },
    )
    .eq("id", articleId);
  if (error) return { error: "Gagal menyetujui artikel." };

  revalidatePath("/admin/plan");
  revalidatePath("/admin/articles");
  revalidatePath("/");
  return {};
}

export async function suggestTopicsAction(categoryId: string): Promise<{ topics?: string[]; error?: string }> {
  await requireRole(["admin", "editor"]);
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id,name").eq("id", categoryId).single();
  if (!category) return { error: "Pilih kategori dulu." };

  const [{ data: titles }, { data: planned }] = await Promise.all([
    supabase.from("articles").select("title").eq("category_id", categoryId).order("created_at", { ascending: false }).limit(30),
    supabase.from("content_plan").select("topic").eq("category_id", categoryId).order("created_at", { ascending: false }).limit(20),
  ]);

  try {
    const topics = await suggestTopics({
      categoryName: category.name,
      existingTitles: [...(titles ?? []).map((t) => t.title), ...(planned ?? []).map((p) => p.topic)],
    });
    return topics.length > 0 ? { topics } : { error: "AI tidak mengembalikan saran. Coba lagi." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal meminta saran topik." };
  }
}
