import Link from "next/link";
import { getDashboardStats, getRecentArticlesAdmin } from "@/lib/services/articles";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/utils/format";
import { getPlanCounts } from "@/lib/services/content-plan";
import { getTrafficOverview } from "@/lib/services/traffic";

export default async function AdminDashboardPage() {
  const [stats, recent, plan, traffic] = await Promise.all([
    getDashboardStats(),
    getRecentArticlesAdmin(6),
    getPlanCounts(),
    getTrafficOverview(1), // null untuk writer (RLS) atau bila migration 0006 belum jalan
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Ringkasan konten TeknoKini.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total" value={stats.total} tone="brand" />
        <StatCard label="Draft" value={stats.draft} />
        <StatCard label="Review" value={stats.review} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Archived" value={stats.archived} />
        <StatCard label="Hari ini" value={stats.today} />
      </div>

      {traffic && (
        <Link
          href="/admin/traffic"
          className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 hover:border-brand-500"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                  traffic.live > 0 ? "animate-ping opacity-75" : "opacity-0"
                }`}
              />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${traffic.live > 0 ? "bg-emerald-500" : "bg-neutral-300"}`} />
            </span>
            <div>
              <p className="text-xl font-bold leading-none text-neutral-900">{traffic.live}</p>
              <p className="mt-1 text-xs text-neutral-500">pengunjung aktif</p>
            </div>
          </div>
          <div>
            <p className="text-xl font-bold leading-none text-neutral-900">{traffic.today.views.toLocaleString("id-ID")}</p>
            <p className="mt-1 text-xs text-neutral-500">tayangan hari ini</p>
          </div>
          <div>
            <p className="text-xl font-bold leading-none text-neutral-900">{traffic.today.visitors.toLocaleString("id-ID")}</p>
            <p className="mt-1 text-xs text-neutral-500">pengunjung hari ini</p>
          </div>
          <span className="ml-auto text-sm font-medium text-brand-600">Buka trafik live →</span>
        </Link>
      )}

      {(plan.awaitingReview > 0 || plan.upcoming > 0 || plan.failed > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/admin/articles?status=draft" className="rounded-xl border border-amber-200 bg-amber-50 p-4 hover:border-amber-400">
            <p className="text-2xl font-bold text-amber-900">{plan.awaitingReview}</p>
            <p className="mt-1 text-xs text-amber-800">draf AI menunggu review Anda</p>
          </Link>
          <Link href="/admin/plan" className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-brand-500">
            <p className="text-2xl font-bold text-neutral-900">{plan.upcoming}</p>
            <p className="mt-1 text-xs text-neutral-500">topik di rencana (belum dibuat)</p>
          </Link>
          <Link
            href="/admin/plan"
            className={`rounded-xl border p-4 ${plan.failed > 0 ? "border-red-200 bg-red-50 hover:border-red-400" : "border-neutral-200 bg-white hover:border-brand-500"}`}
          >
            <p className={`text-2xl font-bold ${plan.failed > 0 ? "text-red-700" : "text-neutral-900"}`}>{plan.failed}</p>
            <p className={`mt-1 text-xs ${plan.failed > 0 ? "text-red-700" : "text-neutral-500"}`}>pembuatan draf gagal</p>
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">Artikel terbaru</h2>
          <Link href="/admin/articles" className="text-sm font-medium text-brand-600">
            Lihat semua →
          </Link>
        </div>
        <ul className="divide-y divide-neutral-100">
          {recent.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-neutral-400">
              Belum ada artikel. <Link href="/admin/articles/new" className="text-brand-600">Buat yang pertama →</Link>
            </li>
          )}
          {recent.map((article) => (
            <li key={article.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="block truncate text-sm font-medium text-neutral-900 hover:text-brand-600"
                >
                  {article.title}
                </Link>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {article.category?.name ?? "Tanpa kategori"} · Diperbarui {formatDateTime(article.updated_at)}
                </p>
              </div>
              <StatusBadge status={article.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
