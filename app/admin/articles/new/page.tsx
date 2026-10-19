import { ArticleForm } from "@/components/admin/ArticleForm";
import { listCategories } from "@/lib/services/categories";
import { listTags } from "@/lib/services/tags";
import { listAuthors } from "@/lib/services/authors";

export const metadata = { title: "Artikel Baru" };

export default async function NewArticlePage() {
  const [categories, tags, authors] = await Promise.all([
    listCategories(),
    listTags(),
    listAuthors(),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Artikel Baru</h1>
      {authors.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Belum ada penulis. Tambahkan minimal satu di <b>Admin → Penulis</b> sebelum membuat artikel.
        </p>
      )}
      <ArticleForm articleId={null} categories={categories} tags={tags} authors={authors} />
    </div>
  );
}
