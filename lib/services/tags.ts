import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/types/database.types";

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").eq("slug", slug).single();
  return data;
}

export async function createTag(input: { name: string; slug: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").insert(input);
  if (error) throw error;
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}
