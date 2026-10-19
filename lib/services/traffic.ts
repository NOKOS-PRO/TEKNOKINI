import { createClient } from "@/lib/supabase/server";

export interface Counter {
  views: number;
  visitors: number;
}
export interface NamedCount {
  name: string;
  views: number;
}
export interface TrafficOverview {
  live: number;
  today: Counter;
  yesterday: Counter;
  period_views: number;
  period_visitors: number;
  daily: { day: string; views: number; visitors: number }[];
  top_pages: { path: string; title: string | null; views: number }[];
  referrers: NamedCount[];
  devices: NamedCount[];
  countries: NamedCount[];
}

export interface RecentVisit {
  id: number;
  created_at: string;
  path: string;
  title: string | null;
  referrer_host: string | null;
  device: string | null;
  country: string | null;
}

/** Ringkasan trafik. Null bila migration 0006 belum jalan atau pengguna bukan staf. */
export async function getTrafficOverview(days = 7): Promise<TrafficOverview | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("traffic_overview", { p_days: days });
    if (error || !data) return null;
    return data as unknown as TrafficOverview;
  } catch {
    return null;
  }
}

/** Kunjungan terbaru, lengkap dengan judul artikel bila path-nya /berita/<slug>. */
export async function getRecentVisits(limit = 15): Promise<RecentVisit[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("page_views")
      .select("id,created_at,path,referrer_host,device,country")
      .order("id", { ascending: false })
      .limit(limit);
    if (error || !data) return [];

    const slugs = [...new Set(data.filter((r) => r.path.startsWith("/berita/")).map((r) => r.path.slice("/berita/".length)))];
    const titles = new Map<string, string>();
    if (slugs.length > 0) {
      const { data: arts } = await supabase.from("articles").select("slug,title").in("slug", slugs);
      for (const a of arts ?? []) titles.set(a.slug, a.title);
    }
    return data.map((r) => ({
      ...r,
      title: r.path.startsWith("/berita/") ? (titles.get(r.path.slice("/berita/".length)) ?? null) : null,
    }));
  } catch {
    return [];
  }
}
