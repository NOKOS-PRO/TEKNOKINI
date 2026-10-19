import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config/site";

/**
 * Penghitung kunjungan anonim (dipanggil components/site/Tracker.tsx).
 * Tanpa cookie. Yang disimpan: path, hash pengunjung harian (IP + user-agent +
 * tanggal WIB + garam rahasia, tidak bisa dibalik), host referrer, jenis perangkat,
 * dan negara (dari header CDN bila ada). IP mentah tidak pernah disimpan.
 */
export const dynamic = "force-dynamic";

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|axios|go-http|java\/|scrapy|ahrefs|semrush|mj12/i;
const SKIP_PREFIXES = ["/admin", "/login", "/api", "/_next"];

const noContent = () => new NextResponse(null, { status: 204 });

function wibDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

function hostOf(url: string | undefined, ownHosts: Set<string>): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host && !ownHosts.has(host) ? host.slice(0, 100) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA.test(ua)) return noContent();

    // Staf yang sedang login (cookie sesi Supabase) tidak dihitung sebagai trafik.
    const cookie = request.headers.get("cookie") ?? "";
    if (/sb-[^=;]+-auth-token/.test(cookie)) return noContent();

    const raw = await request.text();
    if (raw.length > 2000) return noContent();
    const body = JSON.parse(raw) as { path?: unknown; referrer?: unknown };

    let path = typeof body.path === "string" ? body.path.split(/[?#]/)[0] : "";
    if (!path.startsWith("/") || path.length > 200) return noContent();
    if (path.length > 1) path = path.replace(/\/+$/, "");
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return noContent();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "0.0.0.0";
    const salt = process.env.TRAFFIC_SALT || process.env.CRON_SECRET || "teknokini";
    const visitor = createHash("sha256").update(`${salt}|${wibDate()}|${ip}|${ua}`).digest("hex").slice(0, 32);

    const ownHosts = new Set<string>([new URL(siteConfig.url).hostname.replace(/^www\./, "")]);
    const reqHost = request.headers.get("host");
    if (reqHost) ownHosts.add(reqHost.split(":")[0].replace(/^www\./, ""));

    const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "")
      .toUpperCase()
      .slice(0, 2);

    const supabase = createAdminClient();

    // Muat ulang cepat (refresh/double-fire) dalam 30 detik tidak dihitung dua kali.
    const { data: dup } = await supabase
      .from("page_views")
      .select("id")
      .eq("visitor_hash", visitor)
      .eq("path", path)
      .gt("created_at", new Date(Date.now() - 30_000).toISOString())
      .limit(1);
    if (dup && dup.length > 0) return noContent();

    await supabase.from("page_views").insert({
      path,
      visitor_hash: visitor,
      referrer_host: hostOf(typeof body.referrer === "string" ? body.referrer : undefined, ownHosts),
      device: deviceOf(ua),
      country: /^[A-Z]{2}$/.test(country) ? country : null,
    });
  } catch {
    // Pencatatan trafik tidak boleh mengganggu pengunjung.
  }
  return noContent();
}
