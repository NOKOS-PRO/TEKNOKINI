const LABELS: Record<string, string> = {
  "homepage-banner": "Homepage Banner",
  "article-top": "Article Top",
  "article-middle": "Article Middle",
  sidebar: "Sidebar",
  footer: "Footer",
};

/**
 * Renders nothing in production until real ad units are wired in — per spec,
 * ads aren't turned on yet, but layouts already reserve the space so adding
 * them later doesn't reshuffle pages (and doesn't hurt Core Web Vitals via
 * layout shift).
 */
export function AdSlot({ slot }: { slot: string }) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs font-medium text-neutral-400">
      Ad slot — {LABELS[slot] ?? slot}
    </div>
  );
}
