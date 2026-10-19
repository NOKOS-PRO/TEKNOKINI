import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Kontak" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Kontak</h1>
      <div className="prose prose-neutral mt-4 max-w-none">
        <p>Punya tips berita, koreksi, atau ingin bekerja sama dengan {siteConfig.name}?</p>
        <ul>
          <li>Email redaksi: redaksi@teknokini.id</li>
          <li>Kerja sama &amp; iklan: partnership@teknokini.id</li>
        </ul>
        <p className="text-sm text-neutral-400">
          Ganti alamat email placeholder di atas dengan alamat resmi Anda di{" "}
          <code>app/(site)/contact/page.tsx</code>.
        </p>
      </div>
    </div>
  );
}
