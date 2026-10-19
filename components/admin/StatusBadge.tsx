import type { ArticleStatus } from "@/types/database.types";

const STYLES: Record<ArticleStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  review: "bg-amber-50 text-amber-700",
  scheduled: "bg-blue-50 text-blue-700",
  published: "bg-emerald-50 text-emerald-700",
  archived: "bg-neutral-100 text-neutral-500",
};

const LABELS: Record<ArticleStatus, string> = {
  draft: "Draft",
  review: "Review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
