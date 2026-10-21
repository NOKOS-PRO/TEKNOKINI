import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateArticleDraft, isUsableDraft, type GeneratedDraft } from "@/lib/services/llm";
import { fetchFeedItems } from "@/lib/services/rss";
import { findStockPhoto } from "@/lib/services/stock-photo";
import { AGENT_SOURCES } from "@/lib/config/agent-sources";
import { slugify, withUniqueSuffix } from "@/lib/utils/slug";

/** Vercel: allow up to 60 s (the Hobby-plan ceiling) for LLM calls. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Feed items read per source each run. */
const ITEMS_PER_SOURCE = 5;
/** Drafts created per run across all sources — keeps LLM cost and review load bounded. */
const MAX_DRAFTS_PER_RUN = 6;

type Supabase = ReturnType<typeof createAdminClient>;

interface RunResult {
  source: string;
  created: number;
  skipped: number;
  errors: string[];
}

function isAuthorized(request: Request): boolean {
  const bearer = request.headers.get("authorization");
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const shared = request.headers.get("x-agent-secret");
  return Boolean(process.env.AGENT_SECRET && shared === process.env.AGENT_SECRET);
}

/** Enforce the same limits the admin form validates, so drafts never get stuck on save. */
function fitDraft(draft: GeneratedDraft): GeneratedDraft {
  const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
  return {
    title: cut(draft.title.trim(), 200),
    excerpt: cut(draft.excerpt.trim(), 300),
    content: draft.content.trim(),
    seo_title: cut(draft.seo_title.trim(), 70),
    seo_description: cut(draft.seo_description.trim(), 160),
    image_query: draft.image_query?.trim(),
  };
}

async function processOneItem(params: {
  supabase: Supabase;
  title: string;
  link: string;
  text: string;
  sourceName: string;
  categoryId: string;
  categorySlug: string;
  authorId: string | null;
}): Promise<"created" | "skipped"> {
  const { supabase, title, link, text, sourceName, categoryId, categorySlug, authorId } = params;
  if (!title.trim() || !text.trim() || !link.trim()) return "skipped";

  // 1. Same source URL already used for any article → skip (cheap, exact).
  const { data: sameUrl } = await supabase
    .from("sources")
    .select("id")
    .eq("source_url", link)
    .limit(1);
  if (sameUrl && sameUrl.length > 0) return "skipped";

  // 2. Very similar title already in the database → skip (fuzzy).
  const { data: similar } = await supabase
    .from("articles")
    .select("id")
    .textSearch("search_vector", title, { type: "websearch", config: "indonesian" })
    .limit(1);
  if (similar && similar.length > 0) return "skipped";

  const draft = fitDraft(
    await generateArticleDraft({ sourceName, sourceUrl: link, sourceText: text, categoryHint: categorySlug }),
  );
  if (!isUsableDraft(draft.content)) {
    throw new Error(`Draft untuk "${title}" terlalu pendek untuk jadi artikel, tidak disimpan.`);
  }

  let slug = slugify(draft.title);
  const { data: slugTaken } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
  if (slugTaken) slug = withUniqueSuffix(slug);

  // Foto sampul asli (Unsplash) bila UNSPLASH_ACCESS_KEY diisi; jika tidak, null.
  const photo = await findStockPhoto(draft.image_query, categorySlug);

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      featured_image: photo?.url ?? null,
      featured_image_credit: photo?.credit ?? null,
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.content,
      seo_title: draft.seo_title,
      seo_description: draft.seo_description,
      category_id: categoryId,
      author_id: authorId,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !article) throw new Error(error?.message ?? "Gagal menyimpan draft");

  await supabase.from("sources").insert({ article_id: article.id, source_name: sourceName, source_url: link });
  return "created";
}

async function lookups(supabase: Supabase) {
  const [{ data: categories }, { data: author }] = await Promise.all([
    supabase.from("categories").select("id,slug"),
    supabase.from("authors").select("id").order("created_at").limit(1).maybeSingle(),
  ]);
  const bySlug = new Map((categories ?? []).map((c) => [c.slug, c.id] as const));
  return { bySlug, authorId: author?.id ?? null };
}

async function runAgent() {
  const supabase = createAdminClient();
  const results: RunResult[] = [];
  const { bySlug, authorId } = await lookups(supabase);
  let budget = MAX_DRAFTS_PER_RUN;

  // Flip any due scheduled articles to 'published' (see migration 0004).
  const { data: published } = await supabase.rpc("publish_due_articles");

  for (const source of AGENT_SOURCES) {
    const result: RunResult = { source: source.name, created: 0, skipped: 0, errors: [] };
    results.push(result);

    const categoryId = bySlug.get(source.categorySlug);
    if (!categoryId) {
      result.errors.push(`Kategori "${source.categorySlug}" tidak ada di database. Sumber dilewati.`);
      continue;
    }

    let items: Awaited<ReturnType<typeof fetchFeedItems>>;
    try {
      items = await fetchFeedItems(source.feedUrl, ITEMS_PER_SOURCE);
    } catch (err) {
      result.errors.push(`Gagal ambil feed: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    for (const item of items) {
      if (budget <= 0) break;
      try {
        const outcome = await processOneItem({
          supabase,
          title: item.title,
          link: item.link,
          text: item.contentSnippet,
          sourceName: source.name,
          categoryId,
          categorySlug: source.categorySlug,
          authorId,
        });
        if (outcome === "created") {
          result.created += 1;
          budget -= 1;
        } else result.skipped += 1;
      } catch (err) {
        result.errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  return { publishedDue: published ?? 0, results };
}

/** Called by Vercel Cron (Authorization: Bearer $CRON_SECRET) once a day — see vercel.json. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (AGENT_SOURCES.length === 0) {
    return NextResponse.json({
      message: "AGENT_SOURCES kosong. Isi lib/config/agent-sources.ts dengan feed yang sudah diverifikasi.",
      results: [],
    });
  }
  return NextResponse.json(await runAgent());
}

/**
 * Manual trigger. With a body {title?, sourceName, sourceUrl, sourceText, categorySlug}
 * it processes that one item; with no body it runs every configured source.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, string | undefined>;
  const { title, sourceName, sourceUrl, sourceText, categorySlug } = body;

  if (sourceName && sourceUrl && sourceText && categorySlug) {
    const supabase = createAdminClient();
    const { bySlug, authorId } = await lookups(supabase);
    const categoryId = bySlug.get(categorySlug);
    if (!categoryId) {
      return NextResponse.json({ error: `Kategori "${categorySlug}" tidak ditemukan.` }, { status: 400 });
    }
    try {
      const outcome = await processOneItem({
        supabase,
        title: title || sourceText.split(/[.!?]/)[0] || sourceName,
        link: sourceUrl,
        text: sourceText,
        sourceName,
        categoryId,
        categorySlug,
        authorId,
      });
      return NextResponse.json({ outcome });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  return NextResponse.json(await runAgent());
}
