import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_STATUSES } from "@/lib/services/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

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
