import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import { siteConfig } from "@/lib/config/site";
import { PUBLIC_STATUSES } from "@/lib/services/articles";

/**
 * Diperlakukan sebagai halaman statis: dirender sekali saat build, lalu
 * disajikan sebagai file dari SELURUH POP CDN (bukan dirender per permintaan
 * di region tertentu). Ini yang penting untuk Googlebot — cache Vercel itu
 * per lokasi, jadi route dinamis bisa "dingin" di POP yang dipakai Google
 * (query Supabase 3-26 detik) dan fetcher GSC menyerah.
 *
 * revalidate 6 jam: file di-regenerasi di latar belakang, pengunjung selalu
 * dapat salinan cepat. Artikel baru ikut masuk maksimal 6 jam setelah tayang
 * (dan setiap kali deploy ulang).
 */
export const dynamic = "force-static";
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
