"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-lg font-bold text-neutral-900">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Aksi tidak berhasil. Kemungkinan Anda tidak punya izin, atau ada masalah koneksi ke Supabase.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Coba lagi
      </button>
    </div>
  );
}
