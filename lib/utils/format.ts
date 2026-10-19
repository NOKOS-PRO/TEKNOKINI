/** Semua tanggal ditampilkan menurut WIB, apa pun zona waktu server (Vercel memakai UTC). */
const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

/** "125600" -> "125.6k" — matches the popular-article view-count style. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(
    value,
  );
}

/** ~200 words/minute average reading speed. */
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
