import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold text-neutral-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-neutral-500">
        Artikel atau halaman yang Anda cari mungkin sudah dipindahkan atau dihapus.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
