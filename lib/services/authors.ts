import { createClient } from "@/lib/supabase/server";
import type { Author } from "@/types/database.types";

export async function listAuthors(): Promise<Author[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("authors").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("authors").select("*").eq("slug", slug).single();
  return data;
}

export async function createAuthor(input: {
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  profile_id?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("authors").insert(input);
  if (error) throw error;
}

export async function updateAuthor(
  id: string,
  input: Partial<{ name: string; slug: string; bio: string; avatar: string }>,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("authors").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteAuthor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("authors").delete().eq("id", id);
  if (error) throw error;
}
