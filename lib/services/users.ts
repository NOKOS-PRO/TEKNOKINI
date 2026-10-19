import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database.types";

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateProfileRole(id: string, role: UserRole): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}
