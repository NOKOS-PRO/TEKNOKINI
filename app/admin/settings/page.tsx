import { siteConfig, adSlots, partnerConfig } from "@/lib/config/site";
import { AGENT_SOURCES } from "@/lib/config/agent-sources";
import { PLAN_LEAD_HOURS } from "@/lib/services/content-plan";

export const metadata = { title: "Pengaturan" };

/** Hanya menampilkan ADA/TIDAK ADA; nilai rahasia tidak pernah dikirim ke browser. */
function systemChecks() {
  const has = (name: string) => Boolean(process.env[name]);
  const siteUrlOk = Boolean(process.env.NEXT_PUBLIC_SITE_URL) && !/localhost/.test(siteConfig.url);
  return [
    { label: "Supabase URL + anon key", ok: has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY"), hint: "Wajib" },
    { label: "Service role key", ok: has("SUPABASE_SERVICE_ROLE_KEY"), hint: "Wajib untuk bot, penghitung trafik, dan draf otomatis" },
    { label: "NEXT_PUBLIC_SITE_URL = domain final", ok: siteUrlOk, hint: `Sekarang: ${siteConfig.url}` },
    { label: "CRON_SECRET / AGENT_SECRET", ok: has("CRON_SECRET") || has("AGENT_SECRET"), hint: "Mengamankan endpoint bot" },
    { label: "LLM (base URL, key, model)", ok: has("LLM_API_KEY") && has("LLM_MODEL"), hint: "Wajib untuk draf otomatis dan saran topik" },
    { label: "Foto otomatis Unsplash", ok: has("UNSPLASH_ACCESS_KEY"), hint: "Opsional; tanpa ini sampul cadangan dipakai" },
    { label: "Sumber RSS aktif", ok: AGENT_SOURCES.length > 0, hint: `${AGENT_SOURCES.length} sumber (opsional bila hanya memakai Rencana Konten)` },
  ];
}

export default function SettingsPage() {
  const checks = systemChecks();
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Nama situs, tagline, dan konfigurasi struktural sengaja disimpan di kode
          (<code className="rounded bg-neutral-100 px-1">lib/config/site.ts</code>), bukan di
          database — ini keputusan arsitektur dari Phase 1 supaya nilai-nilai ini konsisten dipakai
          di server components, metadata, dan sitemap tanpa query tambahan. Mengubahnya berarti
          edit file itu lalu deploy ulang.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">Status sistem</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Draf Rencana Konten dibuat {PLAN_LEAD_HOURS} jam sebelum jadwal tayang (ubah lewat{" "}
          <code className="rounded bg-neutral-100 px-1">PLAN_LEAD_HOURS</code>).
        </p>
        <ul className="space-y-2 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                  c.ok ? "bg-emerald-500" : "bg-amber-500"
                }`}
                aria-label={c.ok ? "OK" : "Belum"}
              >
                {c.ok ? "✓" : "!"}
              </span>
              <span>
                <span className="font-medium text-neutral-900">{c.label}</span>
                <span className="block text-xs text-neutral-500">{c.hint}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Identitas situs</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Nama</dt>
            <dd className="font-medium text-neutral-900">{siteConfig.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Tagline</dt>
            <dd className="text-right font-medium text-neutral-900">{siteConfig.tagline}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">URL</dt>
            <dd className="font-medium text-neutral-900">{siteConfig.url}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Ad slots (placeholder)</h2>
        <p className="mb-2 text-xs text-neutral-500">
          Belum ada iklan aktif — komponen <code className="rounded bg-neutral-100 px-1">AdSlot</code>{" "}
          hanya menampilkan placeholder di development sesuai spesifikasi.
        </p>
        <ul className="flex flex-wrap gap-1.5 text-xs text-neutral-600">
          {Object.values(adSlots).map((slot) => (
            <li key={slot} className="rounded-full bg-neutral-100 px-2.5 py-1">
              {slot}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Integrasi nokos.id</h2>
        <p className="text-xs text-neutral-500">
          Status:{" "}
          <span className="font-medium">
            {partnerConfig.nokos.enabled ? "Aktif" : "Belum aktif (sesuai spesifikasi tahap ini)"}
          </span>
          . Domain sudah dikonfigurasi di <code className="rounded bg-neutral-100 px-1">lib/config/site.ts</code>{" "}
          agar siap dipakai untuk banner/CTA di masa depan tanpa hard-code di komponen.
        </p>
      </div>
    </div>
  );
}
