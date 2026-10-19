import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getRecentVisits, getTrafficOverview, type NamedCount } from "@/lib/services/traffic";
import { LiveTraffic } from "@/components/admin/LiveTraffic";
import { TrafficChart } from "@/components/admin/TrafficChart";
import type { LiveSnapshot } from "./actions";

export const metadata = { title: "Trafik" };
export const dynamic = "force-dynamic";

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-neutral-400">–</span>;
  if (before === 0) return <span className="text-emerald-600">baru</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return (
    <span className={pct >= 0 ? "text-emerald-600" : "text-red-600"}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% vs kemarin
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-neutral-900">{value.toLocaleString("id-ID")}</p>
      {sub && <p className="mt-1 text-xs">{sub}</p>}
    </div>
  );
}

function BarList({ title, rows, empty }: { title: string; rows: NamedCount[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-neutral-700">{r.name}</span>
                <span className="shrink-0 font-medium text-neutral-900">{r.views.toLocaleString("id-ID")}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.views / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireRole(["admin", "editor"]);
  const { days: daysParam } = await searchParams;
  const days = daysParam === "30" ? 30 : daysParam === "1" ? 1 : 7;

  const [overview, recent] = await Promise.all([getTrafficOverview(days), getRecentVisits(15)]);

  const initial: LiveSnapshot | null = overview
    ? { live: overview.live, todayViews: overview.today.views, todayVisitors: overview.today.visitors, recent }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Trafik</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Kunjungan situs publik secara real-time. Anonim, tanpa cookie, bot dan kunjungan Anda saat login tidak
            dihitung. Hari menurut WIB.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-sm">
          {[
            { v: 1, l: "Hari ini" },
            { v: 7, l: "7 hari" },
            { v: 30, l: "30 hari" },
          ].map((o) => (
            <Link
              key={o.v}
              href={`/admin/traffic?days=${o.v}`}
              className={`rounded-md px-3 py-1 font-medium ${
                days === o.v ? "bg-brand-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {o.l}
            </Link>
          ))}
        </div>
      </div>

      <LiveTraffic initial={initial} />

      {overview && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Tayangan hari ini"
              value={overview.today.views}
              sub={<Delta now={overview.today.views} before={overview.yesterday.views} />}
            />
            <Stat
              label="Pengunjung hari ini"
              value={overview.today.visitors}
              sub={<Delta now={overview.today.visitors} before={overview.yesterday.visitors} />}
            />
            <Stat label={`Tayangan ${days === 1 ? "hari ini" : `${days} hari`}`} value={overview.period_views} />
            <Stat
              label={`Pengunjung ${days === 1 ? "hari ini" : `${days} hari`}`}
              value={overview.period_visitors}
              sub={<span className="text-neutral-400">jumlah pengunjung unik per hari</span>}
            />
          </div>

          {days > 1 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-neutral-900">Tayangan per hari</h2>
              <TrafficChart daily={overview.daily} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Halaman terpopuler</h2>
              {overview.top_pages.length === 0 ? (
                <p className="text-sm text-neutral-400">Belum ada data pada periode ini.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-100">
                    {overview.top_pages.map((p) => (
                      <tr key={p.path}>
                        <td className="max-w-0 truncate py-2 pr-4 text-neutral-800">
                          <a href={p.path} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">
                            {p.title ?? (p.path === "/" ? "Beranda" : p.path)}
                          </a>
                          {p.title && <span className="ml-2 text-xs text-neutral-400">{p.path}</span>}
                        </td>
                        <td className="w-20 py-2 text-right font-medium text-neutral-900">
                          {p.views.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <BarList title="Sumber kunjungan" rows={overview.referrers} empty="Belum ada data." />
            <BarList title="Perangkat" rows={overview.devices} empty="Belum ada data." />
            <BarList title="Negara" rows={overview.countries} empty="Belum ada data (negara terbaca dari header CDN, mis. Vercel/Cloudflare)." />
          </div>
        </>
      )}
    </div>
  );
}
