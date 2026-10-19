import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Use inside Server Components, Server Actions, and Route Handlers.
 * Still runs under the anon key + RLS — this is NOT the admin client.
 *
 * Server Components can't write cookies, so the setAll() call is wrapped
 * in a try/catch: it will throw when called from a plain Server Component,
 * which is fine as long as session refresh also happens in middleware
 * (added in the Authentication phase).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // session refresh is handled by middleware.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for privileged server-only operations (e.g. deleting
 * orphaned Storage objects, the future Hermes automation endpoint).
 *
 * NEVER import this from a Client Component and never let the key reach
 * the browser bundle — it bypasses Row Level Security entirely.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never be called from the browser.");
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
