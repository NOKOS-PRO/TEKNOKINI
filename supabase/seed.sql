-- ============================================================================
-- TeknoKini — seed.sql
-- Run after migrations (`supabase db reset` runs this automatically in local
-- dev). Seeds the five initial categories so the CMS and nav aren't empty
-- on first run. Dummy articles for testing homepage/category/search/pagination
-- are intentionally left for a later phase — this file stays production-safe.
-- ============================================================================

insert into public.categories (name, slug, description) values
  ('AI', 'ai', 'Berita dan perkembangan kecerdasan buatan.'),
  ('Teknologi', 'teknologi', 'Update terbaru seputar teknologi.'),
  ('Internet', 'internet', 'Informasi dunia internet dan digital.'),
  ('Gadget', 'gadget', 'Review dan berita gadget terbaru.'),
  ('Tips', 'tips', 'Tips & trik seputar teknologi.')
on conflict (slug) do nothing;

-- ── Dev-only content below this line ───────────────────────────────────────
-- Fictional placeholder data so the homepage/category/article/search pages
-- aren't empty during local development. Safe to skip in a real production
-- seed — nothing here is real news.

insert into public.authors (name, slug, bio) values
  ('TeknoKini Team', 'teknokini-team', 'Tim redaksi TeknoKini.')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('startup', 'startup'),
  ('keamanan', 'keamanan'),
  ('ulasan', 'ulasan')
on conflict (slug) do nothing;

with new_article as (
  insert into public.articles
    (title, slug, excerpt, content, category_id, author_id, status, published_at, views)
  values (
    'Model AI Baru Diklaim Lebih Efisien untuk Perangkat Mobile',
    'model-ai-baru-diklaim-lebih-efisien-untuk-perangkat-mobile',
    'Pendekatan arsitektur baru memungkinkan model berjalan langsung di perangkat tanpa mengorbankan kualitas jawaban.',
    E'## Ringkasan\n\nSebuah tim riset independen memperkenalkan pendekatan baru untuk memampatkan model bahasa besar agar dapat berjalan langsung di perangkat mobile kelas menengah.\n\n### Mengapa ini penting\n\n- Latensi lebih rendah karena tidak perlu koneksi ke server\n- Privasi lebih baik karena data tidak meninggalkan perangkat\n- Biaya operasional lebih murah untuk pengembang aplikasi\n\n> Ini bukan tentang model yang lebih besar, tapi model yang lebih pintar memakai sumber daya.\n\n*Konten contoh untuk pengujian tampilan situs.*',
    (select id from public.categories where slug = 'ai'),
    (select id from public.authors where slug = 'teknokini-team'),
    'published',
    now() - interval '1 day',
    125600
  )
  returning id
)
insert into public.article_tags (article_id, tag_id)
select new_article.id, tags.id from new_article, public.tags where tags.slug = 'startup';

with new_article as (
  insert into public.articles
    (title, slug, excerpt, content, category_id, author_id, status, published_at, views)
  values (
    'Chip Lokal Generasi Baru Diklaim Hemat Daya 30%',
    'chip-lokal-generasi-baru-diklaim-hemat-daya-30-persen',
    'Produsen menyebut efisiensi baterai jadi fokus utama untuk pasar perangkat entry-level.',
    E'Produsen chip menyatakan generasi terbaru mereka berfokus pada efisiensi daya, bukan hanya performa mentah.\n\n### Spesifikasi kunci\n\n1. Proses fabrikasi lebih kecil\n2. Manajemen daya adaptif per-aplikasi\n3. Dukungan AI on-device untuk kamera\n\n*Konten contoh untuk pengujian tampilan situs.*',
    (select id from public.categories where slug = 'teknologi'),
    (select id from public.authors where slug = 'teknokini-team'),
    'published',
    now() - interval '2 day',
    98300
  )
  returning id
)
insert into public.article_tags (article_id, tag_id)
select new_article.id, tags.id from new_article, public.tags where tags.slug = 'startup';

insert into public.articles
  (title, slug, excerpt, content, category_id, author_id, status, published_at, views)
values (
  'Kecepatan Internet Rata-Rata Indonesia Naik di Kuartal Ini',
  'kecepatan-internet-rata-rata-indonesia-naik-kuartal-ini',
  'Laporan terbaru menunjukkan perbaikan latensi di sejumlah kota besar.',
  E'Sejumlah penyedia layanan internet melaporkan peningkatan kecepatan rata-rata dibanding kuartal sebelumnya, didorong oleh perluasan infrastruktur fiber optik.\n\n*Konten contoh untuk pengujian tampilan situs.*',
  (select id from public.categories where slug = 'internet'),
  (select id from public.authors where slug = 'teknokini-team'),
  'published',
  now() - interval '2 day',
  75900
);

insert into public.articles
  (title, slug, excerpt, content, category_id, author_id, status, published_at, views)
values (
  'Bocoran Desain Kamera Belakang Flagship Terbaru',
  'bocoran-desain-kamera-belakang-flagship-terbaru',
  'Perubahan tata letak lensa jadi sorotan utama dari render yang beredar.',
  E'Render yang beredar di kalangan tipster menunjukkan perubahan signifikan pada modul kamera belakang, termasuk penataan ulang sensor utama dan sensor ultra-wide.\n\n*Konten contoh untuk pengujian tampilan situs.*',
  (select id from public.categories where slug = 'gadget'),
  (select id from public.authors where slug = 'teknokini-team'),
  'published',
  now() - interval '3 day',
  63400
);

with new_article as (
  insert into public.articles
    (title, slug, excerpt, content, category_id, author_id, status, published_at, views)
  values (
    '5 Pengaturan HP yang Wajib Diaktifkan untuk Hemat Baterai',
    '5-pengaturan-hp-wajib-diaktifkan-hemat-baterai',
    'Trik sederhana yang sering terlewat tapi berdampak besar ke daya tahan baterai harian.',
    E'### Daftar pengaturan\n\n1. Batasi refresh rate layar saat baterai rendah\n2. Matikan sinkronisasi latar belakang aplikasi yang jarang dipakai\n3. Gunakan mode gelap pada layar OLED\n4. Nonaktifkan lokasi presisi tinggi jika tidak diperlukan\n5. Perbarui aplikasi secara berkala — banyak update menyertakan perbaikan efisiensi daya\n\n*Konten contoh untuk pengujian tampilan situs.*',
    (select id from public.categories where slug = 'tips'),
    (select id from public.authors where slug = 'teknokini-team'),
    'published',
    now() - interval '3 day',
    52100
  )
  returning id
)
insert into public.article_tags (article_id, tag_id)
select new_article.id, tags.id from new_article, public.tags where tags.slug = 'keamanan';
