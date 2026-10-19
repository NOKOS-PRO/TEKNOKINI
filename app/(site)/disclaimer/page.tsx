import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Disclaimer</h1>
      <div className="prose prose-neutral mt-4 max-w-none">
        <p>
          Informasi di {siteConfig.name} disusun dengan hati-hati, namun kami tidak menjamin
          keakuratan, kelengkapan, atau kemutakhiran 100% setiap saat — terutama untuk berita yang
          berkembang cepat.
        </p>
        <p>
          Artikel yang mencantumkan sumber (mis. rilis resmi perusahaan) merujuk pada sumber
          tersebut untuk fakta, namun narasinya ditulis ulang secara orisinal oleh redaksi.
        </p>
        <p className="text-sm text-neutral-400">Teks template — sesuaikan sebelum publikasi.</p>
      </div>
    </div>
  );
}
