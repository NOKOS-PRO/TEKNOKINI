/**
 * Single source of truth for site identity and structural config.
 *
 * Nothing in components/ or app/ should hard-code the site name, tagline,
 * nav items, or external domains — import them from here instead. This is
 * what makes "rename the site" or "point nokos.id CTAs somewhere else" a
 * one-file change instead of a grep-and-replace across the codebase.
 */

export const siteConfig = {
  name: "TeknoKini",
  tagline: "Update Teknologi Hari Ini. Cepat, Ringkas, Terpercaya.",
  description:
    "Portal berita teknologi Indonesia: AI, teknologi, internet, gadget, dan tips terbaru.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "id_ID",
  defaultOgImage: "/og-default.png",
} as const;

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "AI", href: "/ai" },
  { label: "Teknologi", href: "/teknologi" },
  { label: "Internet", href: "/internet" },
  { label: "Gadget", href: "/gadget" },
  { label: "Tips", href: "/tips" },
] as const;

export const footerNav = [
  { label: "Tentang", href: "/about" },
  { label: "Kontak", href: "/contact" },
  { label: "Kebijakan Privasi", href: "/privacy-policy" },
  { label: "Ketentuan Layanan", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
] as const;

/**
 * Kept isolated so future nokos.id cross-promotion (banners, CTAs,
 * affiliate links) is a config change, not a new hard-coded URL scattered
 * through article/sidebar components. Empty/disabled until that phase.
 */
export const partnerConfig = {
  nokos: {
    enabled: false,
    domain: "https://nokos.id",
  },
} as const;

/**
 * Ad placement keys consumed by <AdSlot slot="..." />. Centralized so the
 * component only ever needs a slot id, not a wall of if/else.
 */
export const adSlots = {
  homepageBanner: "homepage-banner",
  articleTop: "article-top",
  articleMiddle: "article-middle",
  sidebar: "sidebar",
  footer: "footer",
} as const;
