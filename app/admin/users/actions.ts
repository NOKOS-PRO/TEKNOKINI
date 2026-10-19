"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireProfile } from "@/lib/auth/session";
import { updateProfileRole } from "@/lib/services/users";
import type { UserRole } from "@/types/database.types";

export async function updateRoleAction(
  targetId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  const me = await requireRole(["admin"]);

  if (me.id === targetId) {
    return { error: "Anda tidak bisa mengubah role akun sendiri." };
  }

  const result = await updateProfileRole(targetId, role);
  if (!result.error) revalidatePath("/admin/users");
  return result;
}

export async function currentProfileId(): Promise<string> {
  const me = await requireProfile();
  return me.id;
}
