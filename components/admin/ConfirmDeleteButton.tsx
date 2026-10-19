"use client";

import { useTransition } from "react";

export function ConfirmDeleteButton({
  confirmMessage,
  action,
}: {
  confirmMessage: string;
  action: () => Promise<{ error?: string } | void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(async () => {
            const result = await action();
            if (result?.error) alert(result.error);
          });
        }
      }}
      className="text-xs font-medium text-neutral-400 hover:text-red-600 disabled:opacity-50"
    >
      Hapus
    </button>
  );
}
