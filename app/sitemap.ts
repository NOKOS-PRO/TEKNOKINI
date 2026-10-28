import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import { siteConfig } from "@/lib/config/site";
import { PUBLIC_STATUSES } from "@/lib/services/articles";

// Cache 6 jam di edge CDN. Tanpa ini sitemap di-render ulang per permintaan
// (query Supabase bisa 10-26 detik saat dingin) dan Google gagal mengambilnya.
// 6 jam = jendela render dingin hanya ~4x sehari, sisanya respons HIT cepat.
export const revalidate = 21600;

/**
 * Sitemap tidak boleh memakai createClient() dari lib/supabase/server karena
 * fungsi itu memanggil cookies() (API request-time) — itu membuat route
 * dinamis dan Next menolak men-cache-nya. Klien anonim tanpa cookie cukup,
 * karena yang dibaca hanya artikel publik dan kategori (RLS tetap berlaku).
 */
function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, updated_at")
      .in("status", PUBLIC_STATUSES)
      .lte("published_at", new Date().toISOString())
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase.from("categories").select("slug"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${siteConfig.url}/${c.slug}`,
    lastModified: new Date(),
  }));

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${siteConfig.url}/berita/${a.slug}`,
    lastModified: new Date(a.updated_at),
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
