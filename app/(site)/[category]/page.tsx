import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/services/categories";
import { getPublishedArticles } from "@/lib/services/articles";
import { ArticleCard } from "@/components/site/ArticleCard";
import { Pagination } from "@/components/site/Pagination";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/config/site";

const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description ?? `Berita ${category.name} terbaru dari ${siteConfig.name}.`,
    alternates: { canonical: `${siteConfig.url}/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { articles, total } = await getPublishedArticles({
    categorySlug: slug,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: siteConfig.url },
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: `${siteConfig.url}/${category.slug}`,
            },
          ],
        }}
      />

      <p className="text-sm text-neutral-400">
        <Link href="/">Beranda</Link> / {category.name}
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-neutral-900">{category.name}</h1>
      {category.description && <p className="mt-1 text-neutral-500">{category.description}</p>}

      {articles.length === 0 ? (
        <p className="py-16 text-center text-neutral-400">Belum ada artikel di kategori ini.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/${slug}`} />
    </div>
  );
}
