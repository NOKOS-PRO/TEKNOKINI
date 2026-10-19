export interface AgentSource {
  name: string;
  feedUrl: string;
  /** Category the generated draft gets filed under. Must match an existing category slug. */
  categorySlug: string;
}

/**
 * Empty by default on purpose — fill this in with RSS feeds you've actually
 * verified (open each feedUrl in a browser first; a wrong URL just means
 * that source silently returns zero items, not an error). Prefer official
 * company blogs / press-release feeds over general news aggregators —
 * see PANDUAN.md for why that matters for originality/copyright.
 *
 * Kandidat sumber resmi (buka tiap URL di browser dulu, pastikan isinya XML
 * feed yang valid, baru hapus tanda komentar):
 *
 *   { name: "Google AI Blog", feedUrl: "https://blog.google/technology/ai/rss/", categorySlug: "ai" },
 *   { name: "OpenAI News", feedUrl: "https://openai.com/news/rss.xml", categorySlug: "ai" },
 *   { name: "Hugging Face Blog", feedUrl: "https://huggingface.co/blog/feed.xml", categorySlug: "ai" },
 *
 * Bot berjalan sekali sehari (vercel.json: 23.00 UTC = 06.00 WIB / 07.00 WITA),
 * membuat maksimal 6 draft per run, dan tidak pernah auto-publish.
 */
export const AGENT_SOURCES: AgentSource[] = [
  // { name: "Google AI Blog", feedUrl: "https://blog.google/technology/ai/rss/", categorySlug: "ai" },
];
