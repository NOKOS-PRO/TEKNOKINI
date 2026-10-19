import { requireRole } from "@/lib/auth/session";
import { listPlan, PLAN_LEAD_HOURS } from "@/lib/services/content-plan";
import { listCategories } from "@/lib/services/categories";
import { listAuthors } from "@/lib/services/authors";
import { formatDateTime } from "@/lib/utils/format";
import { PlanForm } from "@/components/admin/PlanForm";
import { PlanRowActions } from "@/components/admin/PlanRowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ContentPlanStatus } from "@/types/database.types";

export const metadata = { title: "Rencana Konten" };
/** "Buat draf sekarang" memanggil LLM di dalam server action; beri waktu sampai 60 detik. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PLAN_STYLES: Record<ContentPlanStatus, string> = {
  planned: "bg-blue-50 text-blue-700",
  drafting: "bg-amber-50 text-amber-700",
  drafted: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};
const PLAN_LABELS: Record<ContentPlanStatus, string> = {
  planned: "Menunggu",
  drafting: "Sedang dibuat",
  drafted: "Draf siap",
  failed: "Gagal",
  cancelled: "Dibatalkan",
};

export default async function PlanPage() {
  await requireRole(["admin", "editor"]);

  let plan: Awaited<ReturnType<typeof listPlan>> = [];
  let loadError: string | null = null;
  try {
    plan = await listPlan();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Gagal memuat rencana.";
  }
  const [categories, authors] = await Promise.all([listCategories(), listAuthors()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Rencana Konten</h1>
        <p className="mt-1 max-w-3xl text-sm text-neutral-500">
          Tentukan topik dan jadwal tayang. Bot membuat <strong>draf</strong> sekitar 24–48 jam (maks. {PLAN_LEAD_HOURS}{" "}
          jam) sebelum jadwal, lalu draf muncul di Artikel berstatus Draft. Tinjau, lalu klik{" "}
          <strong>Setujui &amp; jadwalkan</strong>; artikel tayang otomatis tepat waktu. Jam tampil dalam WIB.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}. Pastikan migration <code>0006_content_plan_and_traffic.sql</code> sudah dijalankan.
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        {categories.length === 0 ? (
          <p className="text-sm text-neutral-500">Buat kategori dulu di menu Kategori.</p>
        ) : (
          <PlanForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            authors={authors.map((a) => ({ id: a.id, name: a.name }))}
          />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tayang</th>
                <th className="px-4 py-3 font-medium">Topik</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {plan.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-neutral-400">
                    Belum ada rencana. Tambahkan topik di atas.
                  </td>
                </tr>
              )}
              {plan.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatDateTime(item.publish_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{item.topic}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {item.category?.name ?? "Tanpa kategori"}
                      {item.auto_schedule && " · tayang otomatis tanpa review"}
                      {item.brief && ` · ${item.brief}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PLAN_STYLES[item.status]}`}>
                        {PLAN_LABELS[item.status]}
                      </span>
                    </div>
                    {item.article && (
                      <p className="mt-1.5 text-xs leading-6 text-neutral-500">
                        Artikel: <span className="text-neutral-700">{item.article.title}</span>{" "}
                        <StatusBadge status={item.article.status} />
                      </p>
                    )}
                    {item.status === "failed" && item.error && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {item.error} (percobaan {item.attempts})
                      </p>
                    )}
                    {item.ai_notes && (
                      <details className="mt-1.5 text-xs text-amber-800">
                        <summary className="cursor-pointer font-medium">Cek fakta sebelum tayang</summary>
                        <p className="mt-1 whitespace-pre-line rounded bg-amber-50 p-2">{item.ai_notes}</p>
                      </details>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_STYLES[item.status]}`}>
                      {PLAN_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PlanRowActions
                      planId={item.id}
                      status={item.status}
                      articleId={item.article_id}
                      articleStatus={item.article?.status ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
