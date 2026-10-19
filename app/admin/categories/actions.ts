"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/article";
import { createCategory, updateCategory, deleteCategory } from "@/lib/services/categories";
import { slugify } from "@/lib/utils/slug";

export interface SimpleFormState {
  error?: string;
}

export async function createCategoryAction(
  _prev: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  try {
    await createCategory(parsed.data);
  } catch {
    return { error: "Gagal menyimpan. Slug mungkin sudah dipakai." };
  }
  revalidatePath("/admin/categories");
  return {};
}

export async function deleteCategoryAction(id: string): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  try {
    await deleteCategory(id);
  } catch {
    return { error: "Tidak bisa dihapus — masih dipakai oleh artikel." };
  }
  revalidatePath("/admin/categories");
  return {};
}
