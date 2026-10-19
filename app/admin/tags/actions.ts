"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { tagSchema } from "@/lib/validation/article";
import { createTag, deleteTag } from "@/lib/services/tags";
import { slugify } from "@/lib/utils/slug";

export interface SimpleFormState {
  error?: string;
}

export async function createTagAction(
  _prev: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  const parsed = tagSchema.safeParse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  try {
    await createTag(parsed.data);
  } catch {
    return { error: "Gagal menyimpan. Slug mungkin sudah dipakai." };
  }
  revalidatePath("/admin/tags");
  return {};
}

export async function deleteTagAction(id: string): Promise<SimpleFormState> {
  await requireRole(["admin", "editor"]);
  await deleteTag(id);
  revalidatePath("/admin/tags");
  return {};
}
