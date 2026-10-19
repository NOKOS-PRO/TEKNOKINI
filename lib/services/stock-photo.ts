/**
 * Foto sampul asli dari Unsplash (lisensi gratis untuk penggunaan komersial).
 * Aktif hanya bila UNSPLASH_ACCESS_KEY diisi; tanpa key, artikel memakai
 * sampul cadangan bergaya foto (components/site/CoverArt.tsx).
 *
 * Aturan API Unsplash yang dipenuhi di sini:
 *  - gambar di-hotlink dari images.unsplash.com (bukan disalin),
 *  - kredit fotografer + tautan Unsplash disimpan dan ditampilkan,
 *  - endpoint "download_location" dipanggil saat foto dipakai.
 * Daftar app: https://unsplash.com/developers (mode Demo: 50 request/jam,
 * cukup untuk bot harian).
 */

export interface StockPhoto {
  url: string;
  credit: string;
}

const FALLBACK_QUERY: Record<string, string> = {
  ai: "artificial intelligence technology",
  teknologi: "technology computer hardware",
  internet: "network internet connection",
  gadget: "smartphone gadget",
  tips: "laptop desk workspace",
};

interface UnsplashResult {
  urls?: { regular?: string };
  user?: { name?: string; links?: { html?: string } };
  links?: { download_location?: string };
}

export async function findStockPhoto(query: string | undefined, categorySlug: string): Promise<StockPhoto | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const q = (query ?? "").trim() || FALLBACK_QUERY[categorySlug] || "technology";
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };

  try {
    const search = new URL("https://api.unsplash.com/search/photos");
    search.searchParams.set("query", q);
    search.searchParams.set("orientation", "landscape");
    search.searchParams.set("content_filter", "high");
    search.searchParams.set("per_page", "5");

    const res = await fetch(search, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const { results } = (await res.json()) as { results?: UnsplashResult[] };
    const pool = (results ?? []).filter((r) => r.urls?.regular);
    if (pool.length === 0) return null;

    // Acak ringan dari 5 teratas supaya artikel serupa tidak memakai foto sama.
    const photo = pool[Math.floor(Math.random() * pool.length)];

    // Wajib menurut pedoman API: laporkan pemakaian foto.
    if (photo.links?.download_location) {
      void fetch(photo.links.download_location, { headers, signal: AbortSignal.timeout(5000) }).catch(() => {});
    }

    const name = photo.user?.name ?? "Fotografer";
    const profile = photo.user?.links?.html;
    return {
      url: photo.urls!.regular!,
      credit: profile ? `Foto: ${name} / Unsplash|${profile}` : `Foto: ${name} / Unsplash`,
    };
  } catch {
    return null;
  }
}

/** Pisahkan teks kredit dan tautan profil ("teks|url") yang disimpan di database. */
export function parseCredit(credit: string | null | undefined): { text: string; href: string | null } | null {
  if (!credit) return null;
  const [text, href] = credit.split("|");
  const safe = href && /^https:\/\/unsplash\.com\//.test(href) ? `${href}?utm_source=teknokini&utm_medium=referral` : null;
  return { text, href: safe };
}
