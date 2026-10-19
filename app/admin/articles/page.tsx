import Link from "next/link";
import { listArticlesAdmin } from "@/lib/services/articles";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { formatDateTime } from "@/lib/utils/format";
import type { ArticleStatus } from "@/types/database.types";

const STATUS_FILTERS: { value: ArticleStatus | ""; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const PAGE_SIZE = 20;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? "") as ArticleStatus | "";
  const search = params.q ?? "";
  const page = Number(params.page ?? "1") || 1;

  const { articles, total } = await listArticlesAdmin({
    page,
    pageSize: PAGE_SIZE,
    status: status || undefined,
    search: search || undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (search) sp.set("q", search);
    sp.set("page", String(p));
    return `/admin/articles?${sp.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-neutral-900">Artikel</h1>
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Artikel baru
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-1 min-w-[200px] gap-2" action="/admin/articles">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Cari judul…"
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500 sm:w-64"
          />
        </form>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/articles${f.value ? `?status=${f.value}` : ""}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                status === f.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-neutral-200 text-neutral-500"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Judul</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Kategori</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Diperbarui</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  Tidak ada artikel.
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="font-medium text-neutral-900 hover:text-brand-600"
                  >
                    {article.title}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-neutral-500 sm:table-cell">
                  {article.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={article.status} />
                </td>
                <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                  {formatDateTime(article.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteArticleButton id={article.id} title={article.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`rounded-lg px-3 py-1.5 ${
                p === page ? "bg-brand-600 text-white" : "border border-neutral-200 text-neutral-600"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
