# Deploy TeknoKini ke production

Ada dua jalur. Pilih salah satu.

| | Vercel | VPS + Dokploy |
|---|---|---|
| Biaya hosting | Gratis (Hobby) untuk mulai | Sewa VPS yang sudah ada |
| Bot harian | Otomatis lewat `vercel.json` | Scheduled job / cron di VPS |
| Setup | Paling cepat | Pakai `Dockerfile` di repo ini |

Kedua jalur memakai Supabase yang sama untuk database, login, dan gambar.

---

## Langkah 0: Cek build di laptop

```bash
npm install
cp .env.example .env.local   # isi nilainya
npm run typecheck
npm run build
```

Kalau `npm run build` sukses di laptop, proyek siap di-deploy. Commit file
`package-lock.json` yang terbentuk agar versi dependensi di server sama persis.

## Langkah 1: Supabase production

1. Buat project baru di supabase.com (region Singapore paling dekat ke Indonesia).
2. Hubungkan dan jalankan semua migration:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
   Ini menjalankan `0001` sampai `0006`: jadwal terbit, kredit foto, rencana konten, penghitung trafik, dan perbaikan aturan RLS (`is_staff` dkk., wajib agar panel admin bisa dipakai).
3. Isi kategori awal: buka **SQL Editor**, jalankan bagian `insert into public.categories`
   dan `insert into public.authors` dari `supabase/seed.sql`. Artikel contoh di file itu
   tidak perlu ikut di production.
4. (Opsional) **Database → Extensions → pg_cron** → aktifkan, lalu jalankan ulang isi
   `0004_scheduled_publishing.sql` bagian paling bawah. Tanpa pg_cron, artikel terjadwal
   tetap tayang tepat waktu; pg_cron hanya merapikan status di daftar admin.
5. **Authentication → URL Configuration**: isi *Site URL* dengan domain final
   (misal `https://teknokini.id`) dan tambahkan `https://teknokini.id/**` ke Redirect URLs.
6. Buat akun admin pertama: **Authentication → Users → Add user**, lalu di SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-user>';
   ```

## Langkah 2A: Deploy ke Vercel

1. Push repo ke GitHub, lalu **Vercel → Add New → Project → import repo**.
2. **Settings → Environment Variables**: isi semua variabel dari `.env.example`
   (`NEXT_PUBLIC_SITE_URL` = domain final, `CRON_SECRET` = string acak panjang).
3. Deploy. Setelah sukses, **Settings → Domains** → tambahkan domain dan ikuti instruksi DNS.
4. Dua bot harian otomatis aktif dari `vercel.json` (paket Hobby: maksimal 2 cron, masing-masing sekali sehari):
   - `22.00 UTC` (05.00 WIB / 06.00 WITA) `/api/agent/plan`: membuat draf dari Rencana Konten.
   - `23.00 UTC` (06.00 WIB / 07.00 WITA) `/api/agent/articles`: draf dari feed RSS.

## Langkah 2B: Deploy ke VPS dengan Dokploy

1. Dokploy → **Create Application** → sumber GitHub repo ini → Build Type: **Dockerfile**.
2. **Build-time Arguments** (wajib, karena di-bake ke bundle):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=https://teknokini.id
   ```
3. **Environment** (runtime): semua variabel lain dari `.env.example`
   (`SUPABASE_SERVICE_ROLE_KEY`, `LLM_*`, `CRON_SECRET`, `AGENT_SECRET`) plus tiga
   variabel `NEXT_PUBLIC_*` di atas.
4. **Domains** → tambahkan domain, port container `3000`, aktifkan HTTPS (Let's Encrypt).
5. Bot harian: buat dua **Schedule** di Dokploy (atau crontab di VPS):
   ```bash
   # 05.00 WIB: draf dari Rencana Konten (jadwal 0 22 * * * UTC)
   curl -fsS -X POST https://teknokini.id/api/agent/plan -H "x-agent-secret: $AGENT_SECRET"
   # 06.00 WIB: draf dari RSS (jadwal 0 23 * * * UTC)
   curl -fsS https://teknokini.id/api/agent/articles -H "Authorization: Bearer $CRON_SECRET"
   ```

## Langkah 3: Aktifkan bot

1. Buka tiap URL feed di `lib/config/agent-sources.ts` di browser. Pastikan isinya XML
   feed, lalu hapus tanda komentar pada baris sumber yang valid. Commit dan deploy ulang.
2. Uji sekali secara manual:
   ```bash
   curl -X POST https://teknokini.id/api/agent/articles -H "x-agent-secret: <AGENT_SECRET>"
   ```
3. Draft baru muncul di `/admin/articles?status=draft`. Bot tidak pernah auto-publish.

### Rencana Konten: draf AI H-1 sebelum tayang

1. Buka **Admin → Rencana Konten**. Tulis topik (satu baris satu artikel, boleh banyak sekaligus,
   atau klik *Saran topik dari AI*), pilih kategori, jam tayang pertama, dan jarak antar artikel.
2. Bot harian membuat **draf** untuk item yang jadwal tayangnya dalam 48 jam ke depan, jadi draf
   selalu siap 24–48 jam sebelum tayang (ubah lewat `PLAN_LEAD_HOURS`). Draf muncul di
   **Artikel** berstatus *Draft*, lengkap dengan catatan "Cek fakta sebelum tayang".
3. Tinjau dan edit, lalu klik **Setujui & jadwalkan**. Status berubah ke *Scheduled* dan artikel
   tayang otomatis tepat pada jam yang dijadwalkan (tanpa cron tambahan).
4. Mau tanpa review? Centang *Tayang otomatis tanpa review* saat membuat rencana (tidak disarankan).
5. Tombol **Buat draf sekarang** membuat draf seketika untuk satu item (20–60 detik).
6. Item yang gagal dicoba ulang otomatis sampai 3 kali; tombol *Coba lagi* tersedia.

### Penghitung trafik

- Pelacak anonim `/api/track` otomatis aktif di semua halaman publik (tanpa cookie, bot dan staf yang
  sedang login tidak dihitung, Do Not Track dihormati). Lihat hasilnya di **Admin → Trafik**:
  pengunjung aktif 5 menit terakhir, kunjungan terbaru (diperbarui tiap 10 detik, ada sorotan "baru",
  judul tab berubah saat tab tidak aktif, dan opsi bunyi), grafik harian, halaman terpopuler,
  sumber kunjungan, perangkat, dan negara.
- Isi `TRAFFIC_SALT` dengan string acak. Data trafik dihapus otomatis setelah 90 hari.
- Negara hanya terisi bila CDN mengirim header negara (Vercel dan Cloudflare melakukannya).

### Foto sampul otomatis (opsional)

1. Daftar app gratis di https://unsplash.com/developers, salin **Access Key**.
2. Isi `UNSPLASH_ACCESS_KEY` di environment. Bot lalu memilih foto landscape yang relevan
   untuk tiap draft (kata kunci dibuat LLM) dan menyimpan kredit fotografer, yang tampil
   di bawah gambar artikel.
3. Tanpa key, artikel memakai sampul cadangan bergaya foto. Foto bisa diganti kapan saja
   dari editor artikel (Pilih dari Media atau tempel URL).
4. App Unsplash mode Demo dibatasi 50 request/jam, cukup untuk bot harian.

### Model LLM

`LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL` harus diisi (tidak ada nilai bawaan untuk model).
Contoh OpenRouter: `LLM_BASE_URL=https://openrouter.ai/api/v1`; pilih id model di
https://openrouter.ai/models (model gratis berakhiran `:free`).

## Checklist go-live

- [ ] `npm run build` sukses di laptop
- [ ] Migration 0001–0006 sudah jalan di Supabase production
- [ ] Kategori + minimal 1 penulis sudah ada
- [ ] Akun admin sudah dipromosikan
- [ ] `NEXT_PUBLIC_SITE_URL` = domain final (tanpa `/` di akhir)
- [ ] Supabase Auth Site URL + Redirect URL = domain final
- [ ] Domain + HTTPS aktif
- [ ] Login `/login` berhasil, bisa buat dan jadwalkan artikel
- [ ] `https://domain/sitemap.xml` dan `/robots.txt` terbuka
- [ ] Daftarkan sitemap di Google Search Console
- [ ] Halaman Kebijakan Privasi, Ketentuan, Disclaimer sudah disesuaikan (masih teks template)
- [ ] Bot: minimal satu feed aktif dan uji manual sukses (atau gunakan Rencana Konten)
- [ ] `LLM_*`, `UNSPLASH_ACCESS_KEY`, `TRAFFIC_SALT` terisi (cek panel *Status sistem* di Admin → Pengaturan)
- [ ] Rencana Konten: tambah 3–7 topik, jalankan *Buat draf sekarang* sekali, dan pastikan draf muncul
- [ ] Admin → Trafik: buka situs di jendela privat (tanpa login) dan pastikan kunjungan muncul
