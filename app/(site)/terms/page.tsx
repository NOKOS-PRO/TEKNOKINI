import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Ketentuan Layanan" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Ketentuan Layanan</h1>
      <div className="prose prose-neutral mt-4 max-w-none">
        <p>Dengan mengakses {siteConfig.name}, Anda menyetujui ketentuan berikut:</p>
        <ul>
          <li>Konten disediakan untuk tujuan informasi dan dapat berubah sewaktu-waktu.</li>
          <li>
            Dilarang menyalin ulang artikel secara utuh tanpa izin tertulis; kutipan wajar dengan
            tautan balik dipersilakan.
          </li>
          <li>{siteConfig.name} tidak bertanggung jawab atas kerugian akibat penggunaan informasi di situs ini.</li>
        </ul>
        <p className="text-sm text-neutral-400">
          Ini teks template — sesuaikan dengan kebijakan editorial dan hukum yang berlaku sebelum
          publikasi.
        </p>
      </div>
    </div>
  );
}
