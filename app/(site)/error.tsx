"use client";

import { useEffect } from "react";

export default function SiteError({
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
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-neutral-900">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-neutral-500">
        Silakan coba lagi. Jika masalah berlanjut, hubungi tim redaksi.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Coba lagi
      </button>
    </div>
  );
}
