-- Kredit foto untuk featured image (mis. fotografer Unsplash yang dipilih bot).
alter table public.articles
  add column if not exists featured_image_credit text;

comment on column public.articles.featured_image_credit is
  'Teks kredit foto, contoh: "Foto: Nama Fotografer / Unsplash". Ditampilkan di bawah gambar utama.';
