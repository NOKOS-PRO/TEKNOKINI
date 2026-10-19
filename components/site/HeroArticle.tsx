import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { ArticleCover } from "./ArticleCover";
import { ArticleMeta } from "./ArticleMeta";
import type { ArticleCard } from "@/types/content";

/**
 * Homepage opener: the newest story large on the left, the next three as a
 * compact "Sorotan" column on the right. Stacks to one column on phones.
 */
export function HeroArticle({ article, highlights = [] }: { article: ArticleCard; highlights?: ArticleCard[] }) {
  const href = `/berita/${article.slug}`;

  return (
    <section className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
      <article className="group relative">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink">
          <ArticleCover
            src={article.featured_image}
            alt={article.title}
            seed={article.slug}
            category={article.category?.slug}
            sizes="(min-width: 1024px) 720px, 100vw"
            priority
            artWidth={800}
            artHeight={450}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-brand-600 uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
            </span>
            Update terkini
          </span>
          {article.category && <CategoryBadge name={article.category.name} slug={article.category.slug} />}
        </div>
        <h1 className="mt-3 font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-[44px]">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-brand-600">
            {article.title}
          </Link>
        </h1>
        {article.excerpt && <p className="mt-3 max-w-[58ch] text-[17px] leading-relaxed text-ink-soft">{article.excerpt}</p>}
        <ArticleMeta
          className="mt-4"
          publishedAt={article.published_at}
          views={article.views}
          extra={article.author?.name}
        />
      </article>

      {highlights.length > 0 && (
        <aside aria-label="Sorotan redaksi" className="border-t-2 border-ink">
          <p className="py-3 font-mono text-[11px] font-semibold tracking-widest text-ink-soft uppercase">
            Sorotan redaksi
          </p>
          <ul>
            {highlights.map((a) => (
              <li key={a.id} className="group relative grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-t border-line py-4 sm:grid-cols-[104px_minmax(0,1fr)]">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-ink">
                  <ArticleCover
                    src={a.featured_image}
                    alt=""
                    seed={a.slug}
                    category={a.category?.slug}
                    sizes="104px"
                    artWidth={200}
                    artHeight={200}
                  />
                </div>
                <div className="min-w-0">
                  {a.category && <CategoryBadge name={a.category.name} slug={a.category.slug} />}
                  <h2 className="mt-1 mb-1.5 font-display text-[17px] leading-tight font-bold tracking-tight text-ink">
                    <Link href={`/berita/${a.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-600">
                      {a.title}
                    </Link>
                  </h2>
                  <ArticleMeta publishedAt={a.published_at} />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
