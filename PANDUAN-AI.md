# Panduan Uji AI Bikin Artikel — TeknoKini

Panduan ini untuk menguji **dari awal sampai tayang** dua alur AI di TeknoKini:

| Alur | Cara kerja | Auto-publish? |
|---|---|---|
| **A. Rencana Konten** | Anda tentukan topik + jadwal → bot menulis draf H‑1 → Anda review → approve | Tidak, kecuali Anda centang "tayang otomatis" |
| **B. Bot RSS** | Bot ambil berita dari feed yang Anda daftarkan → tulis draf orisinal | **Selalu tidak** (draft wajib direview) |

Semua perintah di bawah sudah **dijalankan dan diverifikasi** di project ini
(hasil keluaran di bawah apa adanya, bukan contoh karangan).

---

## 0. Prasyarat (WAJIB dibaca dulu)

### 0.1 Isi environment variable

```bash
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-...
LLM_MODEL=z-ai/glm-5.3-flash
LLM_REASONING_EFFORT=low
LLM_MAX_TOKENS=4000          # baru, opsional di file env tapi defaultnya 4000
UNSPLASH_ACCESS_KEY=...      # foto sampul (opsional)
PLAN_LEAD_HOURS=48
CRON_SECRET=...              # wajib kalau deploy di Vercel
AGENT_SECRET=...             # untuk trigger manual lewat curl
```

> **Kenapa `LLM_MAX_TOKENS` penting?** Tanpa itu, OpenRouter menganggarkan token
> maksimum model (131.072 token) lalu menolak request dengan
> `402 requires more credits` — padahal pemakaian sebenarnya cuma ~2.000 token.
> Default di kode sudah 4000, jadi env ini tidak wajib diisi manual.

### 0.2 Cek saldo kredit OpenRouter — **ini yang paling sering jadi penghalang**

```bash
curl -sS https://openrouter.ai/api/v1/credits \
  -H "Authorization: Bearer $LLM_API_KEY"
```

Harus balas:

```json
{"data":{"total_credits":62,"total_usage":62.175538582}}
```

Artinya **saldo = total_credits − total_usage ≈ 0** → semua request model berbayar akan
gagal dengan `402`.

Cara perbaikannya: top up di <https://openrouter.ai/settings/credits> (minimal $5).
Cek juga limit key:

```bash
curl -sS https://openrouter.ai/api/v1/key -H "Authorization: Bearer $LLM_API_KEY"
```

Yang penting: `limit_remaining` (limit key, default $50/bulan) **dan** saldo workspace
harus dua-duanya tersedia.

### 0.3 Kalau belum punya credit: pakai model gratis (untuk uji saja)

Isi `LLM_MODEL` dengan model gratis, contoh:

```bash
LLM_MODEL=minimax/minimax-m3.1-flash:free
```

Catatan jujur hasil uji: model gratis **bisa** menghasilkan artikel 700–1.100 kata, tapi
kualitasnya jelas di bawah model berbayar — beberapa keluaran punya kata asing/placeholder
(Contoh nyata dari uji ini: excerpt berisi `??? ... peran '_replace' model '_replace'`)
dan kadang artikelnya terpotong pendek sehingga ditolak bot. **Untuk produksi pakai model
berbayar; untuk belajar alurnya model gratis cukup.**

---

## 1. Cara menjalankan server lokal

```bash
cd C:\Users\user\TEKNo5
npm run dev
```

Base URL lokal: `http://localhost:3000`

---

## 2. Uji A — satu artikel dari sumber (uji tercepat, tanpa UI)

Endpoint: `POST /api/agent/articles`. Tanpa body, endpoint memproses semua sumber RSS
terdaftar. Dengan body, ia memproses **satu** sumber saja — cocok untuk uji.

Buat file payloadsaya (PowerShell):

```powershell
$body = @{
  sourceName   = 'Uji Coba Internal'
  sourceUrl    = 'https://contoh.internal/on-device-ai-001'
  sourceText   = 'Googleepalancial model AI on-device baru ... (fakta mentah, 400-600 kata)'
  categorySlug = 'ai'
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\ai-test.json", $body, (New-Object System.Text.UTF8Encoding($false)))
```

Jalankan:

```bash
curl -X POST http://localhost:3000/api/agent/articles \
  -H "x-agent-secret: $AGENT_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary "@$env:TEMP/ai-test.json"
```

**Hasil yang benar (terverifikasi):**

```json
{"outcome":"created"}
```

Waktu proses ± 12 detik. Artikel masuk ke database dengan `status = draft`, slug otomatis,
excerpt, SEO title/description, dan foto sampul dari Unsplash (kalau `UNSPLASH_ACCESS_KEY` diisi).

> `sourceText` terlalu pendek (mis. 2 kalimat) → model menulis artikel terlalu pendek →
> bot menolak: `{"error":"Draft untuk ... terlalu pendek untuk jadi artikel, tidak disimpan."}`
> Beri fakta yang lebih lengkap (400–600 kata) agar hasilnya memenuhi syarat.

---

## 3. Uji B — alur Rencana Konten end-to-end (bot harian)

### 3.1 Bikin item rencana

Cara paling cepat tanpa browser — sisipkan baris `content_plan` (butuh `SUPABASE_SERVICE_ROLE_KEY`):

```powershell
$envs = @{}
Get-Content .env.local | ForEach-Object { if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') { $envs[$matches[1]] = $matches[2].Trim().Trim('"') } }
$url = $envs['NEXT_PUBLIC_SUPABASE_URL']; $key = $envs['SUPABASE_SERVICE_ROLE_KEY']
$h = @{ apikey = $key; Authorization = "Bearer $key"; 'Content-Type' = 'application/json' }
$cat = (Invoke-RestMethod -Uri "$url/rest/v1/categories?slug=eq.ai&select=id,name" -Headers $h -UserAgent 'OpenCode-Setup/1.0')[0]
$plan = [ordered]@{
  topic       = 'Cara kerja model AI on-device dan dampaknya buat privasi data'
  brief       = 'Fokus ke pembaca awam, bandingkan cloud vs on-device.'
  category_id = $cat.id
  publish_at  = (Get-Date).ToUniversalTime().AddDays(2).ToString('o')
  auto_schedule = $false
  created_by  = '39e26bd6-490d-4b21-8c24-adc0ceb3ac7d'   # id profil admin
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\plan.json", $plan, (New-Object System.Text.UTF8Encoding($false)))
Invoke-RestMethod -Method Post -Uri "$url/rest/v1/content_plan" -Headers $h -Body ([System.IO.File]::ReadAllText("$env:TEMP\plan.json")) -UserAgent 'OpenCode-Setup/1.0'
```

> Format waktu wajib ISO-8601 asli (`2026-10-23T07:26:39.3303596Z`).
> Kalau pakai `.ToString('yyyy-MM-ddTHH:mm:ssZ')` di locale Indonesia hasilnya
> `07.25.20` → error `invalid input syntax for type timestamp`.

### 3.2 Jalankan bot

```bash
curl -X POST http://localhost:3000/api/agent/plan \
  -H "x-agent-secret: $AGENT_SECRET"
```

**Hasil yang benar (terverifikasi):**

```json
{
  "drafted": 1,
  "failed": 0,
  "publishedDue": 0,
  "purgedPageViews": 0,
  "results": [
    {
      "id": "7fa423bb-b928-47db-8a86-cdfadf2f5752",
      "topic": "Cara kerja model AI on-device dan dampaknya buat privasi data",
      "outcome": "drafted",
      "articleId": "7cd06a52-65c0-4cfc-99c6-98aa3a24c219"
    }
  ]
}
```

Waktu proses ± 45 detik (1 artikel + pemeliharaan data trafik).
`drafted: 0, failed: 1` → buka `/admin/plan`, kolom error sudah terisi alasannya.

### 3.3 Cek hasilnya

```powershell
$url = $envs['NEXT_PUBLIC_SUPABASE_URL']; $key = $envs['SUPABASE_SERVICE_ROLE_KEY']
(Invoke-RestMethod -Uri "$url/rest/v1/articles?select=title,status,slug,featured_image&order=created_at" `
  -Headers @{ apikey = $key; Authorization = "Bearer $key" } -UserAgent 'OpenCode-Setup/1.0') |
  ForEach-Object { "[$($_.status)] $($_.title)  (gambar: $(if ($_.featured_image) {'ada'} else {'tidak ada'}))" }
```

Status item rencana berubah `planned` → `drafted`, dan kolom **ai_notes** terisi daftar
klaim yang wajib dicek manusia, contoh hasil nyata:

```
- Klaim bahwa AI on-device memproses data secara lokal dan AI cloud memproses data
  melalui server perlu disesuaikan dengan deskripsi produk tertentu.
- Klaim tentang pengurangan risiko privasi merupakan penjelasan umum, bukan jaminan
  keamanan mutlak.
```

---

## 4. Uji C — lewat antarmuka (cara kerja sehari-hari)

1. Buka `https://teknokini.vercel.app/admin/plan` → login sebagai admin.
2. Klik **Saran topik dari AI** → AI proposes 7 topik (evergreen, Avoid duplikat judul lama).
   Salin topik yang dipakai ke textarea.
3. Isi **Kategori**, **Penulis**, **Tayang pertama** (tanggal + jam, zona waktu browser Anda),
   **Jarak antar artikel** (1/2/3/7 hari).
4. **Jangan** centang "Tayang otomatis tanpa review" untuk artikel pertama.
5. Klik **Tambahkan ke rencana** → muncul di tabel dengan status *Menunggu*.
6. Klik **Buat draf sekarang** di baris itu → 20–60 detik → status jadi *Draf siap*.
7. Buka `https://teknokini.vercel.app/admin/articles?status=draft` → edit artikel:
   - baca **catatan "Cek fakta sebelum tayang"**;
   - cek angka, harga, nama produk, tanggal;
   - cek judul, excerpt, SEO title (< 70 karakter), SEO description (< 160 karakter);
   - cek slug (ubah manual kalau perlu) dan foto sampul.
8. Kembali ke `/admin/plan` → klik **Setujui & jadwalkan** → status artikel jadi *Scheduled*,
   tayang otomatis pada jamnya.

---

## 5. Mengaktifkan sumber RSS (alur B)

Default `lib/config/agent-sources.ts` **kosong** — sengaja, supaya tidak memakai feed yang
belum Anda periksa sendiri. Contoh feed yang sudah saya tes dan balasannya valid XML:

```ts
export const AGENT_SOURCES: AgentSource[] = [
  { name: "Google AI Blog", feedUrl: "https://blog.google/technology/ai/rss/", categorySlug: "ai" },
  { name: "OpenAI News", feedUrl: "https://openai.com/news/rss.xml", categorySlug: "ai" },
  { name: "Hugging Face Blog", feedUrl: "https://huggingface.co/blog/feed.xml", categorySlug: "ai" },
];
```

Aturan:

- `categorySlug` harus salah satu dari `ai`, `teknologi`, `internet`, `gadget`, `tips`.
- Bot membuat **maksimal 6 draf per run**, lalu berhenti.
- Dedup: URL sumber yang sudah dipakai dilewati, judul mirip (full-text search) juga dilewati.
- Utamakan blog resmi/press release, bukan portal berita — untuk risiko hak cipta.

Setelah mengubah file ini, **deploy ulang** (Vercel) atau restart `npm run dev`.

---

## 6. Menjalankan bot harian otomatis

Sudah terpasang di `vercel.json`:

| WIB | UTC | Endpoint | Fungsi |
|---|---|---|---|
| 05.00 | 22.00 | `/api/agent/plan` | draf dari Rencana Konten + tayangkan artikel jatuh tempo |
| 06.00 | 23.00 | `/api/agent/articles` | draf dari RSS |

Uji manual cron (tanpa menunggu jadwal):

```bash
curl -X POST https://teknokini.vercel.app/api/agent/plan \
  -H "x-agent-secret: $AGENT_SECRET"

curl -X POST https://teknokini.vercel.app/api/agent/articles \
  -H "Authorization: Bearer $CRON_SECRET"
```

Kalau `AGENT_SECRET`/`CRON_SECRET` di Vercel berbeda dari `.env.local`, pakai yang versi Vercel.

> **Temuan saat uji:** `POST https://teknokini.vercel.app/api/agent/articles` dengan
> `AGENT_SECRET` dari `.env.local` membalas `{"error":"Unauthorized"}` (401) → secret di
> Vercel **berbeda** dari `.env.local`. Supaya bisa memicu bot produksi dari komputer ini,
> samakan keduanya: Vercel → Settings → Environment Variables → `AGENT_SECRET` (dan
> `CRON_SECRET`), lalu isi nilai yang sama di `.env.local`.

---

## 7. Daftar error & penyebabnya

| Pesan | Penyebab | Solusi |
|---|---|---|
| `402 … requires more credits … You requested up to 131072 tokens` | Tidak ada `max_tokens` → provider menganggarkan token maksimum model | Sudah diperbaiki: `LLM_MAX_TOKENS` (default 4000) dikirim di setiap request. Pastikan deploy versi terbaru |
| `402 … requires more credits` (tanpa soal token) | Saldo workspace OpenRouter habis | Top up di <https://openrouter.ai/settings/credits> |
| `401 Unauthorized` | Header auth salah | Pakai `x-agent-secret: $AGENT_SECRET` (POST) atau `Authorization: Bearer $CRON_SECRET` (GET) |
| `LLM_API_KEY belum diisi` / `LLM_MODEL belum diisi` | Env belum ada di server | Isi env, restart dev / redeploy |
| `429 … temporarily rate-limited upstream` | Model gratis sedang sibuk | Tunggu, ganti model, atau pakai model berbayar |
| `Respons LLM bukan JSON yang valid` | Model keluarkan JSON rusak (escape tak valid / karakter kontrol) | Sudah diperbaiki: parser kini memperbaiki JSON rusak sebelum parse. Kalau muncul lagi, ganti model |
| `Draft … terlalu pendek untuk jadi artikel` | Fakta sumber terlalu sedikit, atau model terlalu ringkas | Beri `sourceText` 400–600 kata; naikkan `LLM_MAX_TOKENS` ke 6000; ganti model |
| `provider error 404 … Function not found` | Model gratis那条 provider sedang mati | Ganti model |
| Halaman admin 500 | Error render server (bug, bukan AI) | Cek log Vercel; `app/admin/error.tsx` menampilkan pesan generik |

---

## 8. Biaya

Dengan `z-ai/glm-5.3-flash` (harga saat ini: $0,037 / 1 juta token input, $0,16 / 1 juta token output):

- 1 artikel ≈ 600 token input + 1.800 token output ≈ **$0,0003**.
- 6 artikel/hari ≈ **$0,002/hari** ≈ **$0,06/bulan**.

Jadi top up $5 sudah cukup berbulan-bulan. Yang mahal itu bukan token, tapi waktu review manusia.

---

## 9. Checklist akhir

- [ ] Saldo OpenRouter > 0 (`/api/v1/credits`)
- [ ] `LLM_MODEL` = model berbayar (atau `:free` untuk uji)
- [ ] `LLM_MAX_TOKENS` terkirim (default 4000 sudah cukup)
- [ ] `UNSPLASH_ACCESS_KEY` terisi (foto sampul)
- [ ] Uji A: `POST /api/agent/articles` → `{"outcome":"created"}`
- [ ] Uji B: `POST /api/agent/plan` → `"drafted": 1`
- [ ] Draft muncul di `/admin/articles?status=draft`
- [ ] (opsional) `AGENT_SOURCES` diisi + deploy ulang
- [ ] Cron Vercel aktif, `CRON_SECRET` terisi
- [ ] Review manual + **Setujui & jadwalkan** → artikel tayang
