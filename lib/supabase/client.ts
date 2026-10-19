import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Use inside Client Components only ("use client"). Reads the public
 * anon key, so it relies entirely on Row Level Security to keep data safe —
 * never use this client for anything that assumes elevated privileges.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
