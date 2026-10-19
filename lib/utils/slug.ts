/** Turns "OpenAI Luncurkan Fitur AI Terbaru!" into "openai-luncurkan-fitur-ai-terbaru". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Appends a short random suffix — used when a slug collision is detected. */
export function withUniqueSuffix(slug: string): string {
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}
