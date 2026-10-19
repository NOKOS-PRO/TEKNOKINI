import Link from "next/link";
import { listAllSources } from "@/lib/services/sources";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Sumber" };

export default async function SourcesPage() {
  const sources = await listAllSources();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Sumber</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Daftar semua sumber yang dikutip di seluruh artikel. Untuk menambah/menghapus sumber,
          buka artikelnya lewat tombol di bawah — sumber dikelola di dalam form artikel, bukan di
          sini.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Sumber</th>
              <th className="px-4 py-3 font-medium">Artikel</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Tanggal sumber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sources.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                  Belum ada sumber tercatat.
                </td>
              </tr>
            )}
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-900 hover:text-brand-600"
                  >
                    {s.source_name}
                  </a>
                </td>
                <td className="px-4 py-3">
                  {s.article ? (
                    <Link
                      href={`/admin/articles/${s.article.id}/edit`}
                      className="text-brand-600 hover:underline"
                    >
                      {s.article.title}
                    </Link>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-neutral-500 sm:table-cell">
                  {s.source_published_at ? formatDate(s.source_published_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
