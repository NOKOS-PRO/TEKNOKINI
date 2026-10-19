import Link from "next/link";
import { getCategoryStyle } from "@/lib/config/categories";
import type { ArticleCard } from "@/types/content";

/** Scrolling strip of the latest headlines. Pure CSS; pauses on hover, static with reduced motion. */
export function Ticker({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null;
  const items = articles.slice(0, 8);
  const row = (copy: number) =>
    items.map((a) => {
      const style = getCategoryStyle(a.category?.slug);
      return (
        <Link
          key={`${copy}-${a.id}`}
          href={`/berita/${a.slug}`}
          tabIndex={copy === 0 ? undefined : -1}
          aria-hidden={copy === 0 ? undefined : true}
          className="text-[13px] whitespace-nowrap text-ink-soft hover:text-ink"
        >
          {a.category && (
            <b className={`mr-2 font-mono text-[11px] font-medium uppercase ${style.text}`}>{a.category.name}</b>
          )}
          {a.title}
        </Link>
      );
    });

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <span className="shrink-0 rounded bg-brand-600 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white">
          TERBARU
        </span>
        <div className="group min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_24px,#000_calc(100%-24px),transparent)]">
          <div className="inline-flex animate-ticker gap-9 pl-6 group-hover:[animation-play-state:paused]">
            {row(0)}
            {row(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
