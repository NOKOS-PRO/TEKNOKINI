# TeknoKini

> Update Teknologi Hari Ini. Cepat, Ringkas, Terpercaya.

Portal berita teknologi Indonesia (AI, Teknologi, Internet, Gadget, Tips) — **lengkap**: public
site, admin CMS, auth, media upload, search, dan SEO teknis sudah diimplementasikan.

👉 **Baca `PANDUAN.md` dulu** — checklist dari nol sampai artikel pertama tayang, peta fitur, dan
daftar trade-off yang sengaja diambil selama pembangunan.

## 1. Project overview

- Nama & tagline situs, warna brand, dan domain partner (nokos.id) sengaja
  dipusatkan di `lib/config/site.ts` dan `app/globals.css` (`@theme`) —
  bukan hard-coded di banyak komponen — supaya mudah diganti.
- Artikel disimpan di database (Postgres via Supabase), **bukan** sebagai
  file HTML statis, sehingga bisa ditambahkan sepenuhnya lewat Admin Panel
  tanpa menyentuh source code.

## 2. Tech stack

| Layer      | Choice                                                  |
| ---------- | -------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components, Turbopack)    |
| Language   | TypeScript (strict)                                       |
| Styling    | Tailwind CSS v4 (CSS-first `@theme` config)                |
| Database   | Supabase (PostgreSQL + Row Level Security)                |
| Auth       | Supabase Auth (`@supabase/ssr`)                            |
| Storage    | Supabase Storage (article images)                          |
| Lint/format| ESLint 9 (flat config) + Prettier + `prettier-plugin-tailwindcss` |

Why this stack: Server Components keep public pages fast and SEO-friendly by
default; Supabase gives Postgres + Auth + Storage + RLS in one place without
standing up separate services; Tailwind v4's CSS-first theme is what makes
"change the brand color in one place" actually true.

## 3. Installation

Requires **Node.js 20.9+** and a Supabase project (free tier is fine to start).

```bash
npm install
cp .env.example .env.local
```

## 4. Environment variables

Fill in `.env.local` (never commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=         # Project Settings → API (server-only, see warning below)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It must never be
prefixed with `NEXT_PUBLIC_` and must never be imported into a Client
Component — see the guard in `lib/supabase/server.ts`.

## 5. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Install the CLI: `npm install -g supabase` (or use `npx supabase`).
3. Link your local repo to the project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```

## 6. Database migration

Migrations live in `supabase/migrations/` and are applied in filename order:

- `0001_init_schema.sql` — enums, tables, indexes, `updated_at` triggers,
  full-text search column.
- `0002_rls_policies.sql` — Row Level Security policies for the
  admin/editor/writer permission model.
- `0003_media_and_views.sql` — media library table, Storage bucket + policies,
  atomic view-counter function.
- `0004_scheduled_publishing.sql` — artikel `scheduled` tayang otomatis saat
  `published_at` lewat (aturan RLS + fungsi `publish_due_articles()` + job
  pg_cron jika tersedia).
- `0005_featured_image_credit.sql` — kolom `featured_image_credit` untuk kredit foto
  (Unsplash) yang tampil di bawah gambar artikel.
- `0006_content_plan_and_traffic.sql` — tabel `content_plan` (rencana konten + draf AI H-1),
  `page_views` + fungsi `traffic_overview()` (trafik anonim untuk panel admin), dan perbaikan
  rekursi RLS pada fungsi helper (`current_role`, `is_staff`, dst.).

Apply them to your linked project:

```bash
npx supabase db push
```

For local development with the Supabase CLI's local Postgres + Studio:

```bash
npx supabase start
npx supabase db reset   # applies migrations AND runs seed.sql
```

After migrations run against a real project, regenerate types from the live
schema instead of hand-editing `types/database.types.ts`:

```bash
npx supabase gen types typescript --linked > types/database.types.ts
```

## 7. Seed data

`supabase/seed.sql` seeds the five initial categories (AI, Teknologi,
Internet, Gadget, Tips) so the CMS and nav aren't empty. It runs
automatically with `supabase db reset` locally, or manually against a linked
project:

```bash
npx supabase db execute -f supabase/seed.sql
```

Dummy articles for testing homepage/pagination/search are added in a later
phase, clearly marked as development-only data.

## 8. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 9. Production build

```bash
npm run build
npm run start
```

Also available: `npm run lint`, `npm run typecheck`, `npm run format`.

## 10. Deployment

👉 Langkah lengkap ada di **`DEPLOY.md`** (Vercel atau VPS/Dokploy, domain,
Supabase production, bot harian, checklist go-live).

This app uses Next.js features (Server Components, dynamic rendering,
Image Optimization) that require a **Node.js runtime** — a plain shared/cPanel
host that only serves static files **cannot** run it. Deploy to a host with
first-class Next.js support instead, for example:

- **Vercel** (built by the Next.js team; zero-config for this repo).
- Any Node-capable host that can run `npm run build && npm run start`
  (Railway, Render, Fly.io, a self-managed VPS behind a reverse proxy, etc.),
  as long as it supports the Node.js version in `package.json#engines`.

Whichever host you pick, set the same environment variables from step 4 in
its dashboard/secrets manager — don't bake them into the build.

## 11. Admin setup

Auth and the `/admin` CMS are built in later phases. Once they exist, the
first admin account still has to be promoted manually (no one is admin by
default — `handle_new_user()` gives every new signup the `writer` role):

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
```

## 12. Future automation architecture

Not implemented yet, on purpose (see the master spec's rules on not
implementing Hermes/AI features early). What the schema and RLS already
support without changes:

- **Hermes agent** publishing via a future `/api/agent/articles` endpoint:
  writes land as `status = 'draft'` through the `service_role` key (or a
  scoped API key checked against `is_staff()`-equivalent logic), then go
  through the same human review/publish flow as any writer's draft.
- **AI assistance in the editor** (title suggestions, SEO suggestions,
  auto-tagging, duplicate detection): all operate on existing `articles` /
  `tags` columns — no schema changes needed, just editor UI wiring later.
- **Source-backed originality**: the `sources` table already records
  attribution (`source_name`, `source_url`, `source_published_at`)
  independently of authorship, so AI-assisted drafts can cite sources from
  day one without implying the content was copied from them.

## Development phases

Built phase by phase; all phases below are now implemented (see `PANDUAN.md`
for what's simplified vs. the original spec, and what's intentionally still
off — ads, analytics, nokos.id integration, Hermes automation):

1. Project setup ✅
2. Supabase + database ✅
3. Authentication ✅
4. Admin dashboard ✅
5. CMS artikel ✅
6. Media upload ✅
7. Public homepage ✅
8. Category pages ✅
9. Article detail ✅
10. Search ✅
11. SEO ✅
12. Performance optimization ✅ (Server Components, Next/Image, pagination, ISR via `revalidate`)
13. Security review ✅ (RLS everywhere, server-only service key, zod validation, sanitized Markdown — see `PANDUAN.md` for what's *not* covered, e.g. rate limiting)
14. Production deployment — see the Deployment section above; run it yourself against your Supabase project
