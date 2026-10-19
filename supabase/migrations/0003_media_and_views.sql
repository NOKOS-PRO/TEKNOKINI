-- ============================================================================
-- TeknoKini — 0003_media_and_views.sql
-- Additions needed once we build Media Upload (Storage-backed library) and
-- the public Article Detail page (atomic view counter).
-- ============================================================================

-- ── media ─────────────────────────────────────────────────────────────────
-- Files live in the Supabase Storage "media" bucket; this table is just
-- metadata so the admin Media page can list/search without repeated Storage
-- API calls, and so "delete if safe" can check featured_image usage in SQL.

create table public.media (
  id uuid primary key default gen_random_uuid(),
  file_path text not null unique,
  url text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "staff read media" on public.media for select using (public.is_staff());
create policy "staff insert media" on public.media for insert with check (public.is_staff());
create policy "staff delete media" on public.media for delete using (public.is_staff());

-- ── Storage bucket + policies ──────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media objects" on storage.objects
  for select using (bucket_id = 'media');

create policy "staff upload media objects" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());

create policy "staff delete media objects" on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());

-- ── Atomic view counter ─────────────────────────────────────────────────
-- A plain client-side `update` can't express "views + 1" safely under
-- concurrent requests, so this runs the increment inside Postgres. Callable
-- by anon/authenticated since it's how the public article page tracks reads.

create function public.increment_article_views(p_article_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.articles
  set views = views + 1
  where id = p_article_id and status = 'published';
$$;

grant execute on function public.increment_article_views(uuid) to anon, authenticated;
