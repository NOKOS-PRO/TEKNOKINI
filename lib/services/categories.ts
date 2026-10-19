import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database.types";

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).single();
  return data;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; slug: string; description: string }>,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
