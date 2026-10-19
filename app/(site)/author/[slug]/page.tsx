import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBySlug } from "@/lib/services/authors";
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
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio ?? `Artikel oleh ${author.name} di ${siteConfig.name}.`,
    alternates: { canonical: `${siteConfig.url}/author/${author.slug}` },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const { articles, total } = await getPublishedArticles({
    authorSlug: slug,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-display text-lg font-bold text-white">
          {author.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-neutral-900">{author.name}</h1>
          {author.bio && <p className="mt-0.5 max-w-lg text-sm text-neutral-500">{author.bio}</p>}
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-neutral-400">Belum ada artikel dari penulis ini.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/author/${slug}`} />
    </div>
  );
}
