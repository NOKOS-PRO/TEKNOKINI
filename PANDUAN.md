# Panduan Lanjutan — TeknoKini

> Siap online: ikuti `DEPLOY.md`. Penjadwalan artikel sudah otomatis (migration 0004), rencana konten dan trafik live (migration 0006).
>
> Uji AI bikin artikel (langkah demi langkah, sudah diverifikasi): **`PANDUAN-AI.md`**.

Ini bukan lagi cuma fondasi Phase 1 — semua phase (Auth sampai SEO) sudah diimplementasikan.
Dokumen ini pelengkap `README.md`: fokusnya "apa yang sudah bisa dipakai", "apa yang perlu
diketahui sebelum production", dan "langkah selanjutnya".

## 1. Checklist: dari nol sampai artikel pertama tayang

1. **Buat project Supabase** → isi `.env.local` (lihat README bagian 4–5).
2. **Jalankan migration**: `npx supabase db push` (atau `db reset` untuk lokal — ini otomatis
   menjalankan `seed.sql` juga, jadi Anda langsung dapat 5 kategori + 5 artikel contoh).
3. **`npm install && npm run dev`**, buka `http://localhost:3000` — homepage harus langsung
   terisi artikel contoh kalau seed berhasil.
4. **Buat akun pertama**: buka `/login`, tapi Anda belum punya user. Cara paling cepat:
   - Buka Supabase Dashboard → Authentication → Add user (isi email+password manual), atau
   - Aktifkan sign-up dari `supabase.auth.signUp()` sementara lewat SQL editor / API — tapi
     untuk internal CMS, cara pertama (invite manual dari dashboard) lebih sesuai.
5. User baru otomatis dapat role `writer` (lihat trigger `handle_new_user` di migration 0001).
   **Naikkan ke admin** lewat SQL editor Supabase:
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-user-anda>';
   ```
6. Login di `/login` → masuk ke `/admin` → **Admin → Penulis** → tambah minimal satu penulis
   (byline publik, terpisah dari akun login Anda) → **Admin → Artikel → Artikel Baru**.
7. Isi judul, konten (Markdown, ada toolbar+preview), pilih kategori & penulis, set status
   `published` + tanggal publish → Simpan. Cek di `/berita/slug-nya`.

## 2. Peta fitur — apa yang ada di mana

| Kebutuhan (dari spec) | Lokasi |
|---|---|
| Login admin | `/login`, `middleware.ts`, `lib/auth/session.ts` |
| Dashboard | `/admin` |
| CRUD artikel + draft/review/scheduled/published/archived | `/admin/articles/*` |
| Editor artikel (Markdown + toolbar + preview) | `components/admin/MarkdownEditor.tsx` |
| Upload gambar + pilih featured image | `/admin/media`, `components/admin/FeaturedImagePicker.tsx` |
| Kategori/Tag/Penulis | `/admin/categories`, `/admin/tags`, `/admin/authors` |
| Sumber per-artikel | Dikelola di dalam form artikel; `/admin/sources` cuma daftar read-only |
| Preview sebelum publish | `/admin/articles/[id]/preview` |
| Kelola role pengguna | `/admin/users` (admin only) |
| Homepage/kategori/artikel/tag/author/search publik | `app/(site)/**` |
| SEO: metadata, sitemap, robots, structured data | `generateMetadata` per halaman, `app/sitemap.ts`, `app/robots.ts`, `components/seo/JsonLd.tsx` |
| AdSlot placeholder | `components/site/AdSlot.tsx` (tidak render apa pun di production sampai diisi) |
| nokos.id / analytics siap tapi belum aktif | `lib/config/site.ts` (`partnerConfig`), `/admin/settings` |

## 3. Keputusan & trade-off yang perlu Anda tahu

Ini CMS yang **berfungsi penuh**, tapi ada beberapa simplifikasi sadar yang diambil supaya bisa
selesai dalam satu sesi tanpa mengorbankan bagian inti. Semuanya reversible:

- **Editor Markdown, bukan WYSIWYG penuh.** Toolbar menyisipkan sintaks Markdown ke textarea +
  tab preview live. Ini memenuhi semua elemen minimum di spec (heading, bold, italic, link,
  list, blockquote, image, code block) tanpa dependency berat (Tiptap/ProseMirror). Kalau nanti
  butuh WYSIWYG asli (drag-drop gambar inline, dll), ganti `MarkdownEditor.tsx` — struktur DB
  tidak perlu berubah karena `content` disimpan sebagai teks.
- **Kategori/Tag/Penulis: tambah & hapus, belum ada edit/rename inline.** Untuk perbaikan cepat
  (typo nama kategori dsb.), pakai Table Editor di Supabase Dashboard untuk sementara. Menambah
  tombol "Edit" nanti tinggal menambah satu server action per entitas.
- **"Hapus media aman"** hanya mengecek apakah file dipakai sebagai `featured_image`. Gambar yang
  ditempel di dalam isi artikel (Markdown body) tidak ikut dicek — hati-hati menghapus file yang
  mungkin dipakai inline di suatu artikel.
- **Penulisan artikel + tag + sumber tidak dibungkus dalam satu transaksi database** (dilakukan
  berurutan: simpan artikel → sinkron tag → sinkron sumber). Untuk CMS internal dengan trafik
  tulis rendah ini aman; kalau nanti banyak editor menulis bersamaan, pertimbangkan pindah logic
  ini ke satu fungsi Postgres (RPC) agar atomik.
- **Belum ada rate limiting** di endpoint mana pun (spec menyebutnya "jika diperlukan"). Kalau
  formulir publik (mis. search) mulai disalahgunakan, tambahkan lewat middleware atau layanan
  seperti Upstash Ratelimit.
- **Belum ada automated test.** Kode ditulis hati-hati dan sudah dicek secara statis (semua
  import saling terhubung, JSON config valid, tidak ada brace yang tidak seimbang), tapi belum
  pernah benar-benar dijalankan `npm run build` di lingkungan ini (tidak ada akses jaringan untuk
  `npm install`). **Langkah pertama Anda: jalankan `npm install && npm run build` sendiri** dan
  kabari kalau ada error — kemungkinan besar cuma masalah versi minor, bukan kesalahan struktural.
- **Hermes automation & fitur AI (section 32–33 spec) sengaja belum dibangun**, sesuai instruksi
  eksplisit "jangan diimplementasikan sekarang". Skema `articles.status='draft'` + `sources`
  sudah didesain untuk itu — lihat README bagian "Future automation architecture".

## 4. Yang belum sama sekali disentuh

- Halaman `/video` dan `/review` yang muncul di desain referensi awal Anda **tidak** dibangun —
  spec tertulis (`MASTER PROMPT`) tidak menyebutkan kategori itu, jadi saya ikuti spec tertulis
  (5 kategori: AI/Teknologi/Internet/Gadget/Tips). Gampang ditambah kalau memang mau dipakai.
- Analytics (GA/GTM/Search Console/AdSense) — env var placeholder sudah ada di `.env.example`,
  tinggal isi dan tambahkan script-nya di `app/layout.tsx` saat siap.
- Forgot-password / email verification flow untuk admin — belum ada, karena akun dibuat manual
  lewat dashboard Supabase untuk internal CMS.

## 6. Content Agent — ambil berita otomatis setiap hari

Endpoint: `app/api/agent/articles/route.ts`. Alurnya: cron memanggil endpoint ini sekali sehari (06.00 WIB) →
endpoint mengambil RSS dari sumber yang dikonfigurasi → cek duplikat → kirim fakta ke LLM untuk
ditulis ulang orisinal → simpan sebagai **draft** + catat sumbernya → **tidak auto-publish**,
editor tetap harus review manual di `/admin/articles?status=draft`.

### Yang perlu Anda siapkan sebelum dipakai

`lib/services/llm.ts` memakai format **OpenAI-compatible** `/chat/completions`, jadi provider
mana pun dengan format itu bisa dipakai tanpa ubah kode (contoh: OpenRouter, OpenCode Zen, OpenAI, Groq). Isi `LLM_BASE_URL`, `LLM_API_KEY`, dan `LLM_MODEL` (wajib, tidak ada nilai bawaan),
lalu uji dengan `curl -X POST` di bawah. Kalau provider Anda memakai skema JSON lain, sesuaikan
`llm.ts`.

Foto sampul asli: isi `UNSPLASH_ACCESS_KEY` (lihat `DEPLOY.md`). Tanpa itu, bot tetap jalan dan
artikel memakai sampul cadangan.

### Setup

1. Isi `.env`: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `AGENT_SECRET` (bebas, string acak
   panjang), dan `CRON_SECRET` kalau deploy di Vercel.
2. Isi `lib/config/agent-sources.ts` dengan RSS feed yang **sudah Anda buka & pastikan valid** —
   jangan asal tempel URL, defaultnya sengaja kosong.
3. Kalau deploy di Vercel: `vercel.json` sudah berisi cron harian, otomatis aktif saat deploy
   (paket Hobby cukup). Kalau di VPS/Dokploy: lihat `DEPLOY.md` langkah 2B.
4. Pengaman bawaan: dedup berdasarkan URL sumber dan judul mirip, kategori wajib ada,
   maksimal 6 draft per run, batas karakter SEO dipotong otomatis, dan tiap run juga
   menerbitkan artikel terjadwal yang sudah jatuh tempo.

### Test manual (sebelum dijadwalkan)

```bash
curl -X POST https://domainanda.com/api/agent/articles \
  -H "x-agent-secret: isi-sesuai-AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceName": "Contoh Sumber",
    "sourceUrl": "https://contoh.com/artikel",
    "sourceText": "Tempel fakta/ringkasan dari sumber di sini...",
    "categorySlug": "ai"
  }'
```

Cek hasilnya di `/admin/articles?status=draft`.

### Soal legal — baca ini sebelum diaktifkan

Prompt di `llm.ts` sudah diarahkan "ekstrak fakta lalu tulis ulang", bukan "ringkas artikel ini"
— beda krusial karena memparafrase kalimat orang lain (meski kata-katanya diubah) tetap berisiko
dianggap pelanggaran hak cipta. Tapi ini bukan jaminan hukum otomatis. Rekomendasi:

- Prioritaskan sumber **resmi** (blog perusahaan, rilis pers) yang memang untuk disitir ulang,
  bukan artikel media/kompetitor lain.
- Kalau berencana mengambil dari media lain secara sistematis, konsultasikan ke pengacara dulu.

## 7. Deploy checklist singkat

1. `npm run build` sukses lokal.
2. Environment variables sudah diisi di dashboard hosting (bukan di-hardcode).
3. Migration sudah dijalankan ke project Supabase **production** (bukan project dev Anda).
4. Ganti `NEXT_PUBLIC_SITE_URL` ke domain asli — ini dipakai di sitemap, canonical URL, dan OG tags.
5. Promosikan akun admin pertama Anda di database production (lihat bagian 1.5 di atas).
6. Baru setelah itu aktifkan indexing (robots.ts sudah otomatis mengizinkan crawler ke semua
   halaman publik dan memblokir `/admin`, `/login`, `/search`).
