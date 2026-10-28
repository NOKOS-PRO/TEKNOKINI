"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { articleSchema } from "@/lib/validation/article";
import { createArticle, updateArticle, deleteArticle, isSlugTaken } from "@/lib/services/articles";
import { slugify, withUniqueSuffix } from "@/lib/utils/slug";

export interface ArticleFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseFormData(formData: FormData) {
  const tagIds = formData.getAll("tag_ids").map(String);

  const sourceNames = formData.getAll("source_name").map(String);
  const sourceUrls = formData.getAll("source_url").map(String);
  const sourceDates = formData.getAll("source_published_at").map(String);
  const sources = sourceNames
    .map((name, i) => ({
      source_name: name,
      source_url: sourceUrls[i] ?? "",
      source_published_at: sourceDates[i] ?? "",
    }))
    .filter((s) => s.source_name.trim() && s.source_url.trim());

  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    featured_image: String(formData.get("featured_image") ?? ""),
    featured_image_credit: String(formData.get("featured_image_credit") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
    author_id: String(formData.get("author_id") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    published_at: String(formData.get("published_at") ?? ""),
    seo_title: String(formData.get("seo_title") ?? ""),
    seo_description: String(formData.get("seo_description") ?? ""),
    tag_ids: tagIds,
    sources,
  };
}

/** Bind the first arg (articleId, or null for create) when wiring this into useActionState. */
export async function saveArticleAction(
  articleId: string | null,
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireProfile();

  const raw = parseFormData(formData);
  let slug = slugify(raw.slug || raw.title);
  if (await isSlugTaken(slug, articleId ?? undefined)) {
    slug = withUniqueSuffix(slug);
  }

  const parsed = articleSchema.safeParse({ ...raw, slug });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }

  let savedId: string;
  try {
    if (articleId) {
      await updateArticle(articleId, parsed.data);
      savedId = articleId;
    } else {
      savedId = await createArticle(parsed.data);
    }
  } catch {
    return { error: "Gagal menyimpan. Anda mungkin tidak punya izin untuk aksi/status ini." };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/articles/${savedId}/edit?saved=1`);
}

export async function deleteArticleAction(id: string) {
  await requireProfile();
  await deleteArticle(id);
  revalidatePath("/admin/articles");
  revalidatePath("/sitemap.xml");
  redirect("/admin/articles");
}
