import { listMedia } from "@/lib/services/media";
import { deleteMediaAction } from "@/app/admin/media/actions";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";
import { MediaGridItem } from "@/components/admin/MediaGridItem";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const media = await listMedia();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Media</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <MediaUploadForm />
      </div>

      {media.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-400">
          Belum ada file.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {media.map((item) => (
            <MediaGridItem
              key={item.id}
              item={item}
              onDelete={async () => deleteMediaAction(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
