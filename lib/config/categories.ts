/**
 * Visual identity per category. Colours come from the `--color-cat-*` tokens
 * in app/globals.css, so a category's colour is changed in one place.
 * Tailwind needs the full class names written out literally to generate them.
 */
export interface CategoryStyle {
  /** Text colour for labels and links. */
  text: string;
  /** Solid fill (dots, bars). */
  dot: string;
  /** Border colour on hover/focus for tiles. */
  border: string;
  /** Hex used by the generated cover art (SVG can't read Tailwind classes). */
  hex: string;
  /** Short code shown on topic tiles. */
  code: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  ai: { text: "text-cat-ai", dot: "bg-cat-ai", border: "hover:border-cat-ai", hex: "#7b8bff", code: "AI" },
  teknologi: {
    text: "text-cat-teknologi",
    dot: "bg-cat-teknologi",
    border: "hover:border-cat-teknologi",
    hex: "#2fd0bd",
    code: "TK",
  },
  internet: {
    text: "text-cat-internet",
    dot: "bg-cat-internet",
    border: "hover:border-cat-internet",
    hex: "#f0ad3a",
    code: "IN",
  },
  gadget: {
    text: "text-cat-gadget",
    dot: "bg-cat-gadget",
    border: "hover:border-cat-gadget",
    hex: "#ff7a9d",
    code: "GD",
  },
  tips: { text: "text-cat-tips", dot: "bg-cat-tips", border: "hover:border-cat-tips", hex: "#79d35a", code: "TP" },
};

const DEFAULT_STYLE: CategoryStyle = {
  text: "text-brand-600",
  dot: "bg-brand-600",
  border: "hover:border-brand-600",
  hex: "#9fb4ff",
  code: "TK",
};

export function getCategoryStyle(slug?: string | null): CategoryStyle {
  if (!slug) return DEFAULT_STYLE;
  return CATEGORY_STYLES[slug] ?? DEFAULT_STYLE;
}
