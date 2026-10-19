"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { listMedia, uploadMedia, deleteMedia } from "@/lib/services/media";
import type { Media } from "@/types/database.types";

export interface UploadState {
  error?: string;
  success?: boolean;
}

export async function listMediaAction(): Promise<Media[]> {
  await requireProfile();
  return listMedia();
}

export async function uploadMediaAction(
  _prevState: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const profile = await requireProfile();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file terlebih dahulu." };
  }

  const { error } = await uploadMedia(file, profile.id);
  if (error) return { error };

  revalidatePath("/admin/media");
  return { success: true };
}

export async function deleteMediaAction(id: string): Promise<{ error?: string }> {
  await requireProfile();
  const result = await deleteMedia(id);
  if (!result.error) revalidatePath("/admin/media");
  return result;
}
