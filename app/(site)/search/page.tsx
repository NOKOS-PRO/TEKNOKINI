import type { Metadata } from "next";
import { searchArticles } from "@/lib/services/articles";
import { ArticleCard } from "@/components/site/ArticleCard";
import { Pagination } from "@/components/site/Pagination";

export const metadata: Metadata = { title: "Cari", robots: { index: false, follow: true } };

const PAGE_SIZE = 9;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;

  const { articles, total } = q
    ? await searchArticles(q, page, PAGE_SIZE)
    : { articles: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Cari Artikel</h1>
      <form action="/search" className="mt-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Ketik kata kunci…"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Cari
        </button>
      </form>

      {q && (
        <p className="mt-4 text-sm text-neutral-500">
          {total} hasil untuk &ldquo;{q}&rdquo;
        </p>
      )}

      {q && articles.length === 0 && (
        <p className="py-16 text-center text-neutral-400">
          Tidak ada hasil untuk &ldquo;{q}&rdquo;.
        </p>
      )}

      {articles.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/search" extraParams={{ q }} />
    </div>
  );
}
