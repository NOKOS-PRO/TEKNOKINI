"use client";

import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import type { Media } from "@/types/database.types";

export function MediaGridItem({
  item,
  onDelete,
}: {
  item: Media;
  onDelete: () => Promise<{ error?: string } | void>;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.file_name} className="aspect-square w-full object-cover" />
      <div className="flex items-center justify-between gap-1 border-t border-neutral-100 px-2 py-1.5">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(item.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-[11px] font-medium text-neutral-500 hover:text-brand-600"
        >
          {copied ? "Tersalin!" : "Salin URL"}
        </button>
        <ConfirmDeleteButton confirmMessage={`Hapus "${item.file_name}"?`} action={onDelete} />
      </div>
    </div>
  );
}
