import Link from "next/link";
import { formatCompactNumber } from "@/lib/utils/format";
import type { ArticleCard } from "@/types/content";

/** Ranked by views; the bar shows each article's views relative to #1. */
export function PopularList({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null;
  const max = Math.max(...articles.map((a) => a.views), 1);

  return (
    <ol className="rounded-xl border border-line bg-white p-4">
      {articles.map((article, i) => (
        <li key={article.id} className="border-t border-line py-3 first:border-0 first:pt-0 last:pb-0">
          <Link href={`/berita/${article.slug}`} className="group grid grid-cols-[26px_minmax(0,1fr)] gap-3">
            <span className="font-display text-2xl leading-none font-extrabold tracking-tighter text-brand-600 tabular-nums">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm leading-snug font-semibold text-ink group-hover:text-brand-600">
                {article.title}
              </span>
              <span className="mt-1 block font-mono text-[11px] text-ink-soft">
                {formatCompactNumber(article.views)} dilihat
              </span>
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-paper" aria-hidden>
                <span className="block h-full rounded-full bg-brand-600" style={{ width: `${Math.round((article.views / max) * 100)}%` }} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
