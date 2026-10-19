"use client";

import { useTransition } from "react";
import { deleteArticleAction } from "@/app/admin/articles/actions";

export function DeleteArticleButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Hapus artikel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) {
          startTransition(() => deleteArticleAction(id));
        }
      }}
      className="text-xs font-medium text-neutral-400 hover:text-red-600 disabled:opacity-50"
    >
      Hapus
    </button>
  );
}
