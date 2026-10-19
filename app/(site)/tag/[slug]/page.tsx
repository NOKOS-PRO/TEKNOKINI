import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug } from "@/lib/services/tags";
import { getPublishedArticles } from "@/lib/services/articles";
import { ArticleCard } from "@/components/site/ArticleCard";
import { Pagination } from "@/components/site/Pagination";
import { siteConfig } from "@/lib/config/site";

const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: `#${tag.name}`,
    alternates: { canonical: `${siteConfig.url}/tag/${tag.slug}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { articles, total } = await getPublishedArticles({ tagSlug: slug, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">#{tag.name}</h1>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-neutral-400">Belum ada artikel dengan tag ini.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/tag/${slug}`} />
    </div>
  );
}
