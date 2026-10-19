"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { authorSchema } from "@/lib/validation/article";
import { createAuthor, deleteAuthor } from "@/lib/services/authors";
import { slugify } from "@/lib/utils/slug";

export interface SimpleFormState {
  error?: string;
}

export async function createAuthorAction(
  _prev: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  const parsed = authorSchema.safeParse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
    bio: formData.get("bio") ?? "",
    avatar: formData.get("avatar") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  try {
    await createAuthor(parsed.data);
  } catch {
    return { error: "Gagal menyimpan. Slug mungkin sudah dipakai." };
  }
  revalidatePath("/admin/authors");
  return {};
}

export async function deleteAuthorAction(id: string): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  try {
    await deleteAuthor(id);
  } catch {
    return { error: "Tidak bisa dihapus — masih dipakai oleh artikel." };
  }
  revalidatePath("/admin/authors");
  return {};
}
