import { listTags } from "@/lib/services/tags";
import { deleteTagAction } from "@/app/admin/tags/actions";
import { TagAddForm } from "@/components/admin/TagAddForm";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

export const metadata = { title: "Tag" };

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Tag</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <TagAddForm />
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-neutral-400">Belum ada tag.</p>}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm"
          >
            #{tag.name}
            <ConfirmDeleteButton
              confirmMessage={`Hapus tag "${tag.name}"?`}
              action={deleteTagAction.bind(null, tag.id)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
