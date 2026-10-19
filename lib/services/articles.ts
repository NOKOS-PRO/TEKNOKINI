import { createClient } from "@/lib/supabase/server";
import type { Article, ArticleStatus } from "@/types/database.types";
import type { ArticleAdminRow, ArticleCard, ArticleDetail, DashboardStats } from "@/types/content";
import type { ArticleFormValues } from "@/lib/validation/article";

/**
 * A scheduled article goes live by itself once published_at passes: public
 * reads accept both statuses and the time filter decides visibility, so no
 * cron job is needed to flip the status (migration 0004 mirrors this in RLS).
 */
export const PUBLIC_STATUSES: ArticleStatus[] = ["published", "scheduled"];

const CARD_SELECT =
  "id,title,slug,excerpt,featured_image,published_at,views,category:categories(id,name,slug),author:authors(id,name,slug,avatar)";

// ── Public reads ────────────────────────────────────────────────────────

export async function getPublishedArticles(
  options: {
    page?: number;
    pageSize?: number;
    categorySlug?: string;
    tagSlug?: string;
    authorSlug?: string;
    excludeId?: string;
  } = {},
): Promise<{ articles: ArticleCard[]; total: number }> {
  const { page = 1, pageSize = 9, categorySlug, tagSlug, authorSlug, excludeId } = options;
  const supabase = await createClient();

  let categoryId: string | undefined;
  if (categorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (!data) return { articles: [], total: 0 };
    categoryId = data.id;
  }

  let authorId: string | undefined;
  if (authorSlug) {
    const { data } = await supabase.from("authors").select("id").eq("slug", authorSlug).single();
    if (!data) return { articles: [], total: 0 };
    authorId = data.id;
  }

  let tagArticleIds: string[] | undefined;
  if (tagSlug) {
    const { data: tag } = await supabase.from("tags").select("id").eq("slug", tagSlug).single();
    if (!tag) return { articles: [], total: 0 };
    const { data: rows } = await supabase
      .from("article_tags")
      .select("article_id")
      .eq("tag_id", tag.id);
    tagArticleIds = (rows ?? []).map((r) => r.article_id);
    if (tagArticleIds.length === 0) return { articles: [], total: 0 };
  }

  let query = supabase
    .from("articles")
    .select(CARD_SELECT, { count: "exact" })
    .in("status", PUBLIC_STATUSES)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (authorId) query = query.eq("author_id", authorId);
  if (tagArticleIds) query = query.in("id", tagArticleIds);
  if (excludeId) query = query.neq("id", excludeId);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  return { articles: (data ?? []) as unknown as ArticleCard[], total: count ?? 0 };
}

export async function getPopularArticles(limit = 5): Promise<ArticleCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(CARD_SELECT)
    .in("status", PUBLIC_STATUSES)
    .lte("published_at", new Date().toISOString())
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ArticleCard[];
}

/** Staff-only: fetches by id regardless of status, for the /admin preview page. RLS still applies. */
export async function getArticleForPreview(id: string): Promise<ArticleDetail | null> {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*, category:categories(*), author:authors(*)")
    .eq("id", id)
    .single();

  if (error || !article) return null;

  const [{ data: tagRows }, { data: sources }] = await Promise.all([
    supabase.from("article_tags").select("tag:tags(*)").eq("article_id", article.id),
    supabase.from("sources").select("*").eq("article_id", article.id).order("created_at"),
  ]);

  const tags = (tagRows ?? [])
    .map((r) => (r as unknown as { tag: ArticleDetail["tags"][number] }).tag)
    .filter(Boolean);

  return { ...(article as unknown as ArticleDetail), tags, sources: sources ?? [] };
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*, category:categories(*), author:authors(*)")
    .eq("slug", slug)
    .in("status", PUBLIC_STATUSES)
    .lte("published_at", new Date().toISOString())
    .single();

  if (error || !article) return null;

  const [{ data: tagRows }, { data: sources }] = await Promise.all([
    supabase.from("article_tags").select("tag:tags(*)").eq("article_id", article.id),
    supabase.from("sources").select("*").eq("article_id", article.id).order("created_at"),
  ]);

  const tags = (tagRows ?? [])
    .map((r) => (r as unknown as { tag: ArticleDetail["tags"][number] }).tag)
    .filter(Boolean);

  return { ...(article as unknown as ArticleDetail), tags, sources: sources ?? [] };
}

/** Fire-and-forget: call from the article page, don't await in the render path. */
export async function incrementViews(articleId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_article_views", { p_article_id: articleId });
}

export async function searchArticles(
  query: string,
  page = 1,
  pageSize = 9,
): Promise<{ articles: ArticleCard[]; total: number }> {
  if (!query.trim()) return { articles: [], total: 0 };
  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("articles")
    .select(CARD_SELECT, { count: "exact" })
    .in("status", PUBLIC_STATUSES)
    .lte("published_at", new Date().toISOString())
    .textSearch("search_vector", query, { type: "websearch", config: "indonesian" })
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;
  return { articles: (data ?? []) as unknown as ArticleCard[], total: count ?? 0 };
}

// ── Admin ────────────────────────────────────────────────────────────────

export async function listArticlesAdmin(
  options: { page?: number; pageSize?: number; status?: ArticleStatus; search?: string } = {},
): Promise<{ articles: ArticleAdminRow[]; total: number }> {
  const { page = 1, pageSize = 20, status, search } = options;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("articles")
    .select("*, category:categories(name,slug), author:authors(name,slug)", { count: "exact" })
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { articles: (data ?? []) as unknown as ArticleAdminRow[], total: count ?? 0 };
}

export async function getArticleForEdit(id: string) {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !article) return null;

  const [{ data: tagRows }, { data: sources }] = await Promise.all([
    supabase.from("article_tags").select("tag_id").eq("article_id", id),
    supabase.from("sources").select("*").eq("article_id", id).order("created_at"),
  ]);

  return {
    article: article as Article,
    tagIds: (tagRows ?? []).map((r) => r.tag_id),
    sources: sources ?? [],
  };
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("articles").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function syncTags(articleId: string, tagIds: string[]) {
  const supabase = await createClient();
  await supabase.from("article_tags").delete().eq("article_id", articleId);
  if (tagIds.length > 0) {
    await supabase
      .from("article_tags")
      .insert(tagIds.map((tag_id) => ({ article_id: articleId, tag_id })));
  }
}

async function syncSources(articleId: string, sources: ArticleFormValues["sources"]) {
  const supabase = await createClient();
  await supabase.from("sources").delete().eq("article_id", articleId);
  if (sources.length > 0) {
    await supabase.from("sources").insert(
      sources.map((s) => ({
        article_id: articleId,
        source_name: s.source_name,
        source_url: s.source_url,
        source_published_at: s.source_published_at || null,
      })),
    );
  }
}

/**
 * Insert + attach tags/sources aren't wrapped in a DB transaction (supabase-js
 * doesn't expose one for multi-statement writes) — acceptable for a
 * low-concurrency admin CMS, but a candidate to move into a Postgres RPC
 * function later if that ever becomes a problem.
 */
export async function createArticle(values: ArticleFormValues): Promise<string> {
  const supabase = await createClient();
  const { tag_ids, sources, published_at, ...rest } = values;

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...rest, published_at: published_at || null })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Gagal membuat artikel");

  await syncTags(data.id, tag_ids);
  await syncSources(data.id, sources);

  return data.id;
}

export async function updateArticle(id: string, values: ArticleFormValues): Promise<void> {
  const supabase = await createClient();
  const { tag_ids, sources, published_at, ...rest } = values;

  const { error } = await supabase
    .from("articles")
    .update({ ...rest, published_at: published_at || null })
    .eq("id", id);

  if (error) throw error;

  await syncTags(id, tag_ids);
  await syncSources(id, sources);
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, draft, review, scheduled, published, archived, today] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "review"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "archived"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
  ]);

  return {
    total: total.count ?? 0,
    draft: draft.count ?? 0,
    review: review.count ?? 0,
    scheduled: scheduled.count ?? 0,
    published: published.count ?? 0,
    archived: archived.count ?? 0,
    today: today.count ?? 0,
  };
}

export async function getRecentArticlesAdmin(limit = 5): Promise<ArticleAdminRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(name,slug), author:authors(name,slug)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ArticleAdminRow[];
}

/** Number of publicly visible articles per category id, for the homepage topic tiles. */
export async function getPublicCountsByCategory(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("category_id")
    .in("status", PUBLIC_STATUSES)
    .lte("published_at", new Date().toISOString())
    .limit(5000);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}
