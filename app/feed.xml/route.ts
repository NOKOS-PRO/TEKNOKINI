import { getPublishedArticles } from "@/lib/services/articles";
import { siteConfig } from "@/lib/config/site";

export const revalidate = 600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RSS 2.0 untuk 30 artikel terbaru, dipakai pembaca feed dan agregator. */
export async function GET() {
  const { articles } = await getPublishedArticles({ pageSize: 30 });
  const base = siteConfig.url.replace(/\/$/, "");

  const items = articles
    .map((a) => {
      const url = `${base}/berita/${a.slug}`;
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${a.published_at ? `<pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : ""}
      ${a.category ? `<category>${esc(a.category.name)}</category>` : ""}
      <description>${esc(a.excerpt ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${base}</link>
    <description>${esc(siteConfig.description)}</description>
    <language>id-ID</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}
