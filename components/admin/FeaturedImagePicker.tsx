"use client";

import { useState, useTransition } from "react";
import { listMediaAction } from "@/app/admin/media/actions";
import type { Media } from "@/types/database.types";

export function FeaturedImagePicker({
  name,
  defaultValue = "",
  creditName,
  defaultCredit = "",
}: {
  name: string;
  defaultValue?: string;
  /** Hidden field that carries the photo credit; cleared when the image is changed. */
  creditName?: string;
  defaultCredit?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[] | null>(null);
  const [pending, startTransition] = useTransition();

  function openPicker() {
    setOpen(true);
    if (!media) {
      startTransition(async () => {
        setMedia(await listMediaAction());
      });
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      {creditName && <input type="hidden" name={creditName} value={value === defaultValue ? defaultCredit : ""} />}
      {creditName && value && value === defaultValue && defaultCredit && (
        <p className="mb-2 text-xs text-neutral-500">{defaultCredit.split("|")[0]}</p>
      )}

      {value ? (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-24 rounded-md border border-neutral-200 object-cover" />
          <div className="min-w-0 flex-1 truncate text-xs text-neutral-400">{value}</div>
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Hapus
          </button>
        </div>
      ) : (
        <p className="mb-2 text-xs text-neutral-400">Belum ada featured image.</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={openPicker}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Pilih dari Media
        </button>
        <input
          type="url"
          placeholder="atau tempel URL gambar…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-neutral-600">Pilih dari Media Library</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-neutral-400">
              Tutup
            </button>
          </div>
          {pending && <p className="py-4 text-center text-xs text-neutral-400">Memuat…</p>}
          {!pending && media && media.length === 0 && (
            <p className="py-4 text-center text-xs text-neutral-400">
              Belum ada file. Upload dulu di halaman Media.
            </p>
          )}
          {!pending && media && media.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setValue(item.url);
                    setOpen(false);
                  }}
                  className="aspect-square overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-brand-500"
                  title={item.file_name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.file_name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
