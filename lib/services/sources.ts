import { createClient } from "@/lib/supabase/server";

export interface SourceRow {
  id: string;
  source_name: string;
  source_url: string;
  source_published_at: string | null;
  article: { id: string; title: string; slug: string } | null;
}

export async function listAllSources(): Promise<SourceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id,source_name,source_url,source_published_at,article:articles(id,title,slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as SourceRow[];
}
