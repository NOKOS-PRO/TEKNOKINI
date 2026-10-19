import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import { ArticleCover } from "./ArticleCover";
import { MarkdownContent } from "./MarkdownContent";
import { ShareButtons } from "./ShareButtons";
import { ArticleCard } from "./ArticleCard";
import { AdSlot } from "./AdSlot";
import { formatDate, estimateReadingTime } from "@/lib/utils/format";
import { siteConfig } from "@/lib/config/site";
import { parseCredit } from "@/lib/services/stock-photo";
import type { ArticleCard as ArticleCardType, ArticleDetail } from "@/types/content";

export function ArticleView({
  article,
  related = [],
  isPreview = false,
}: {
  article: ArticleDetail;
  related?: ArticleCardType[];
  isPreview?: boolean;
}) {
  const url = `${siteConfig.url}/berita/${article.slug}`;
  const credit = parseCredit(article.featured_image_credit);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {isPreview && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Preview — status artikel: <strong>{article.status}</strong>. Halaman ini tidak publik.
        </div>
      )}

      <p className="text-sm text-neutral-400">
        <Link href="/" className="hover:text-brand-600">Beranda</Link>
        {article.category && (
          <>
            {" / "}
            <Link href={`/${article.category.slug}`} className="hover:text-brand-600">
              {article.category.name}
            </Link>
          </>
        )}
      </p>

      {article.category && (
        <div className="mt-3">
          <CategoryBadge name={article.category.name} slug={article.category.slug} />
        </div>
      )}

      <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[40px]">
        {article.title}
      </h1>
      {article.excerpt && <p className="mt-3 text-lg text-neutral-600">{article.excerpt}</p>}

      <div className="mt-4 flex items-center gap-3">
        {article.author && (
          <Link
            href={`/author/${article.author.slug}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
          >
            {article.author.name.slice(0, 2).toUpperCase()}
          </Link>
        )}
        <div className="text-xs text-neutral-400">
          {article.author && (
            <Link
              href={`/author/${article.author.slug}`}
              className="font-semibold text-neutral-700 hover:text-brand-600"
            >
              {article.author.name}
            </Link>
          )}
          {article.published_at && <> · {formatDate(article.published_at)}</>}
          {" · "}
          {estimateReadingTime(article.content)} menit baca
        </div>
      </div>

      <figure className="mt-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-ink">
          <ArticleCover
            src={article.featured_image}
            alt={article.title}
            seed={article.slug}
            category={article.category?.slug}
            sizes="(min-width: 768px) 720px, 100vw"
            priority
            artWidth={800}
            artHeight={450}
          />
        </div>
        {article.featured_image && credit && (
          <figcaption className="mt-1.5 text-right text-[11px] text-ink-soft">
            {credit.href ? (
              <a href={credit.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 hover:underline">
                {credit.text}
              </a>
            ) : (
              credit.text
            )}
          </figcaption>
        )}
      </figure>

      <div className="mt-6">
        <AdSlot slot="article-top" />
      </div>

      <div className="mt-6">
        <MarkdownContent content={article.content} />
      </div>

      <div className="my-6">
        <AdSlot slot="article-middle" />
      </div>

      {article.sources.length > 0 && (
        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Sumber</p>
          <ul className="space-y-1">
            {article.sources.map((s) => (
              <li key={s.id}>
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline"
                >
                  {s.source_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-brand-500 hover:text-brand-600"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-neutral-100 pt-6">
        <ShareButtons url={url} title={article.title} />
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-lg font-bold text-neutral-900">Artikel Terkait</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
