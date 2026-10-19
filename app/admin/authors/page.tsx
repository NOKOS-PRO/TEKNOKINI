import { listAuthors } from "@/lib/services/authors";
import { deleteAuthorAction } from "@/app/admin/authors/actions";
import { AuthorAddForm } from "@/components/admin/AuthorAddForm";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

export const metadata = { title: "Penulis" };

export default async function AuthorsPage() {
  const authors = await listAuthors();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Penulis</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <AuthorAddForm />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {authors.length === 0 && <p className="text-sm text-neutral-400">Belum ada penulis.</p>}
        {authors.map((author) => (
          <div key={author.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900">{author.name}</p>
                <p className="text-xs text-neutral-400">/author/{author.slug}</p>
              </div>
              <ConfirmDeleteButton
                confirmMessage={`Hapus penulis "${author.name}"?`}
                action={() => deleteAuthorAction(author.id)}
              />
            </div>
            {author.bio && <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{author.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
