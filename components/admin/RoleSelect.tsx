"use client";

import { useTransition } from "react";
import { updateRoleAction } from "@/app/admin/users/actions";
import type { UserRole } from "@/types/database.types";

const ROLES: UserRole[] = ["admin", "editor", "writer"];

export function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentRole}
      disabled={disabled || pending}
      onChange={(e) => {
        const role = e.target.value as UserRole;
        startTransition(async () => {
          const result = await updateRoleAction(userId, role);
          if (result.error) alert(result.error);
        });
      }}
      className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 disabled:bg-neutral-100 disabled:text-neutral-400"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
