import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { ArticleCover } from "./ArticleCover";
import { ArticleMeta } from "./ArticleMeta";
import type { ArticleCard as ArticleCardType } from "@/types/content";

export function ArticleCard({ article }: { article: ArticleCardType }) {
  const href = `/berita/${article.slug}`;
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-xl border border-line bg-white p-2.5 pb-4 transition-colors hover:border-brand-300">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ink">
        <ArticleCover
          src={article.featured_image}
          alt={article.title}
          seed={article.slug}
          category={article.category?.slug}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5">
        {article.category && <CategoryBadge name={article.category.name} slug={article.category.slug} />}
        <h3 className="font-display text-[19px] leading-[1.18] font-bold tracking-tight text-ink">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-brand-600">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && <p className="line-clamp-2 flex-1 text-sm text-ink-soft">{article.excerpt}</p>}
        <ArticleMeta publishedAt={article.published_at} views={article.views} />
      </div>
    </article>
  );
}
