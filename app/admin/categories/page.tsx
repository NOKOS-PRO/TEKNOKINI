import { listCategories } from "@/lib/services/categories";
import { deleteCategoryAction } from "@/app/admin/categories/actions";
import { CategoryAddForm } from "@/components/admin/CategoryAddForm";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

export const metadata = { title: "Kategori" };

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Kategori</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <CategoryAddForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Deskripsi</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Belum ada kategori.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                <td className="px-4 py-3 text-neutral-500">/{c.slug}</td>
                <td className="hidden px-4 py-3 text-neutral-500 sm:table-cell">{c.description}</td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDeleteButton
                    confirmMessage={`Hapus kategori "${c.name}"?`}
                    action={() => deleteCategoryAction(c.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
