import { createClient } from "@/lib/supabase/server";
import type { Media } from "@/types/database.types";

const BUCKET = "media";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — keep uploads light for Core Web Vitals
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function listMedia(): Promise<Media[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadMedia(
  file: File,
  uploadedBy: string,
): Promise<{ media?: Media; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Ukuran file maksimal 5MB." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${uploadedBy}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("media")
    .insert({
      file_path: path,
      url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploadedBy,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { media: data };
}

/**
 * Refuses to delete if the file is currently set as an article's
 * featured_image. Note: this does NOT check whether the image is embedded
 * inside an article's Markdown body — only the featured_image column is
 * tracked. Treat "safe to delete" as a best-effort check, not a guarantee.
 */
export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: media } = await supabase.from("media").select("*").eq("id", id).single();
  if (!media) return { error: "File tidak ditemukan." };

  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("featured_image", media.url);

  if (count && count > 0) {
    return { error: `Masih dipakai sebagai featured image di ${count} artikel.` };
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([media.file_path]);
  if (storageError) return { error: storageError.message };

  const { error: dbError } = await supabase.from("media").delete().eq("id", id);
  if (dbError) return { error: dbError.message };

  return {};
}
