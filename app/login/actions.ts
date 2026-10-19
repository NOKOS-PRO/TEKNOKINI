"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  error?: string;
}

/** Username tanpa "@" dipetakan ke domain internal akun staf. */
const INTERNAL_EMAIL_DOMAIN = "teknokini.local";

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!identifier || !password) {
    return { error: "Email/username dan password wajib diisi." };
  }

  const email = identifier.includes("@")
    ? identifier
    : `${identifier.toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email/username atau password salah." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
