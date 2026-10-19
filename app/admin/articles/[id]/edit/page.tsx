import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { getArticleForEdit } from "@/lib/services/articles";
import { listCategories } from "@/lib/services/categories";
import { listTags } from "@/lib/services/tags";
import { listAuthors } from "@/lib/services/authors";

export const metadata = { title: "Edit Artikel" };

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [result, categories, tags, authors] = await Promise.all([
    getArticleForEdit(id),
    listCategories(),
    listTags(),
    listAuthors(),
  ]);

  if (!result) notFound();
  const { article, tagIds, sources } = result;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-neutral-900">Edit Artikel</h1>
        <div className="flex items-center gap-4">
          <Link href={`/admin/articles/${id}/preview`} className="text-sm font-medium text-brand-600 hover:underline">
            Preview
          </Link>
          {article.status === "published" && (
            <Link
              href={`/berita/${article.slug}`}
              target="_blank"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Lihat di situs ↗
            </Link>
          )}
        </div>
      </div>

      {saved === "1" && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Artikel tersimpan.
        </p>
      )}

      <ArticleForm
        articleId={id}
        initial={{ ...article, tagIds, sources }}
        categories={categories}
        tags={tags}
        authors={authors}
      />
    </div>
  );
}
