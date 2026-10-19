import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Kebijakan Privasi</h1>
      <div className="prose prose-neutral mt-4 max-w-none">
        <p>
          {siteConfig.name} menghargai privasi pengunjung. Halaman ini menjelaskan secara umum data
          apa yang kami kumpulkan dan bagaimana data tersebut digunakan.
        </p>
        <h2>Data yang dikumpulkan</h2>
        <p>
          Kami menghitung kunjungan secara anonim untuk memahami artikel mana yang paling banyak
          dibaca. Yang dicatat hanya halaman yang dibuka, situs asal kunjungan (referrer), jenis
          perangkat, negara, dan kode pengunjung acak yang dibuat dari hash satu arah (IP, perangkat,
          tanggal) dan berganti setiap hari. Alamat IP mentah tidak disimpan, dan Anda tidak dilacak
          antarhari maupun antarsitus. Pengaturan <em>Do Not Track</em> di browser Anda dihormati.
          Data trafik dihapus otomatis setelah 90 hari.
        </p>
        <h2>Cookie</h2>
        <p>
          Penghitung kunjungan kami tidak memakai cookie. Cookie hanya dipakai untuk keperluan
          fungsional (sesi login admin). Bila kami mengaktifkan iklan atau analitik pihak ketiga di
          masa depan, halaman ini akan diperbarui lebih dulu.
        </p>
        <p className="text-sm text-neutral-400">
          <strong>Catatan:</strong> ini adalah teks template, bukan nasihat hukum. Sesuaikan dengan
          praktik data Anda yang sebenarnya dan konsultasikan dengan penasihat hukum sebelum
          publikasi, terutama terkait kepatuhan UU PDP.
        </p>
      </div>
    </div>
  );
}
