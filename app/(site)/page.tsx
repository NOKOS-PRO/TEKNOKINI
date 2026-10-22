import Link from "next/link";
import {
  getPopularArticles,
  getPublicCountsByCategory,
  getPublishedArticles,
} from "@/lib/services/articles";
import { listCategories } from "@/lib/services/categories";
import { listTags } from "@/lib/services/tags";
import { HeroArticle } from "@/components/site/HeroArticle";
import { ArticleCard } from "@/components/site/ArticleCard";
import { PopularList } from "@/components/site/PopularList";
import { Ticker } from "@/components/site/Ticker";
import { CoverArt } from "@/components/site/CoverArt";
import { AdSlot } from "@/components/site/AdSlot";
import { getCategoryStyle } from "@/lib/config/categories";

export const revalidate = 60;

function SectionHead({ title, id }: { title: string; id?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2.5">
      <h2 id={id} className="font-display text-2xl font-extrabold tracking-tight text-ink">
        {title}
      </h2>
    </div>
  );
}

export default async function HomePage() {
  const [{ articles: latest }, popular, categories, tags, counts] = await Promise.all([
    getPublishedArticles({ pageSize: 6 }),
    getPopularArticles(5),
    listCategories(),
    listTags(),
    getPublicCountsByCategory(),
  ]);

  const [hero, ...rest] = latest;

  if (!hero) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Belum ada artikel tayang</h1>
        <p className="mt-3 text-ink-soft">
          Masuk ke{" "}
          <Link href="/admin/articles/new" className="font-semibold text-brand-600 underline">
            Admin
          </Link>{" "}
          untuk menulis atau menjadwalkan artikel pertama.
        </p>
      </div>
    );
  }

  const highlights = rest.slice(0, 3);
  const feed = rest.slice(3);

  return (
    <>
      <Ticker articles={latest} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <HeroArticle article={hero} highlights={highlights} />

        <div className="pt-10">
          <AdSlot slot="homepage-banner" />
        </div>

        <div className="grid grid-cols-1 gap-10 pt-10 pb-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="terbaru">
            <SectionHead title="Berita Terbaru" id="terbaru" />
            {feed.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {feed.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-line bg-white p-6 text-ink-soft">
                Artikel lain akan muncul di sini begitu terbit.
              </p>
            )}
          </section>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {popular.length > 0 && (
              <div>
                <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-widest text-ink-soft uppercase">
                  Populer minggu ini
                </h2>
                <PopularList articles={popular} />
              </div>
            )}
            {tags.length > 0 && (
              <div>
                <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-widest text-ink-soft uppercase">Tag</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="rounded-full border border-line bg-white px-3 py-1 text-[13px] font-medium text-ink-soft hover:border-brand-500 hover:text-brand-600"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <AdSlot slot="sidebar" />
          </aside>
        </div>

        <section className="pb-16" aria-labelledby="topik">
          <SectionHead title="Jelajahi Topik" id="topik" />
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
            {categories.map((category) => {
              const style = getCategoryStyle(category.slug);
              const n = counts[category.id] ?? 0;
              return (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className={`group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors ${style.border}`}
                >
                  <div className="aspect-[2/1] bg-ink">
                    <CoverArt seed={`topic-${category.slug}`} category={category.slug} width={400} height={200} />
                  </div>
                  <div className="grid gap-1 px-3.5 pt-3 pb-3.5">
                    <span className={`font-mono text-[11px] font-semibold ${style.text}`}>{n} artikel</span>
                    <span className="font-display text-lg font-bold tracking-tight text-ink">{category.name}</span>
                    {category.description && (
                      <span className="line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{category.description}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
