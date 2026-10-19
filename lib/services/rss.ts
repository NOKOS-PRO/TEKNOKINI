import Parser from "rss-parser";

const parser = new Parser({ timeout: 15000 });

export interface FeedItem {
  title: string;
  link: string;
  contentSnippet: string;
  isoDate?: string;
}

export async function fetchFeedItems(feedUrl: string, maxItems = 5): Promise<FeedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  return (feed.items ?? []).slice(0, maxItems).map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    contentSnippet: item.contentSnippet ?? item.content ?? "",
    isoDate: item.isoDate,
  }));
}
