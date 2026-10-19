import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Tentang Kami" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Tentang {siteConfig.name}</h1>
      <div className="prose prose-neutral mt-4 max-w-none">
        <p>
          {siteConfig.name} adalah portal berita teknologi yang menyajikan kabar seputar AI,
          teknologi, internet, gadget, dan tips praktis untuk pembaca Indonesia — {siteConfig.tagline.toLowerCase()}
        </p>
        <p>
          Setiap artikel ditulis secara orisinal oleh tim redaksi. Ketika sebuah kabar berasal dari
          rilis resmi atau laporan pihak lain, sumbernya dicantumkan langsung di bagian bawah
          artikel.
        </p>
        <p className="text-sm text-neutral-400">
          Ini halaman template — ganti isinya sesuai profil redaksi Anda yang sebenarnya di{" "}
          <code>app/(site)/about/page.tsx</code>.
        </p>
      </div>
    </div>
  );
}
