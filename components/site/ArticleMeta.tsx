import { formatCompactNumber, formatDate } from "@/lib/utils/format";

/** Mono metadata row: date · views. Every datum on the site uses this one style. */
export function ArticleMeta({
  publishedAt,
  views,
  extra,
  className = "",
}: {
  publishedAt?: string | null;
  views?: number;
  extra?: string;
  className?: string;
}) {
  const parts = [
    publishedAt ? formatDate(publishedAt) : null,
    extra ?? null,
    typeof views === "number" && views > 0 ? `${formatCompactNumber(views)} dilihat` : null,
  ].filter(Boolean) as string[];
  if (parts.length === 0) return null;

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] text-ink-soft ${className}`}>
      {parts.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && <span className="text-line" aria-hidden>·</span>}
          {p}
        </span>
      ))}
    </p>
  );
}
