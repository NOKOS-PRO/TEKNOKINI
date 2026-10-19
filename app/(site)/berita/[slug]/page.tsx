import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles, incrementViews } from "@/lib/services/articles";
import { ArticleView } from "@/components/site/ArticleView";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  const url = `${siteConfig.url}/berita/${article.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: article.featured_image ? [article.featured_image] : undefined,
      publishedTime: article.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.featured_image ? [article.featured_image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  await incrementViews(article.id);

  const { articles: related } = await getPublishedArticles({
    categorySlug: article.category?.slug,
    excludeId: article.id,
    pageSize: 3,
  });

  const url = `${siteConfig.url}/berita/${article.slug}`;
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Beranda", item: siteConfig.url },
    ...(article.category
      ? [
          {
            "@type": "ListItem",
            position: 2,
            name: article.category.name,
            item: `${siteConfig.url}/${article.category.slug}`,
          },
        ]
      : []),
    { "@type": "ListItem", position: article.category ? 3 : 2, name: article.title, item: url },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description: article.excerpt ?? undefined,
          image: article.featured_image ? [article.featured_image] : undefined,
          datePublished: article.published_at ?? undefined,
          dateModified: article.updated_at,
          author: article.author ? { "@type": "Person", name: article.author.name } : undefined,
          publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          mainEntityOfPage: url,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        }}
      />
      <ArticleView article={article} related={related} />
    </>
  );
}
