-- ============================================================================
-- TeknoKini — 0002_rls_policies.sql
-- Permission model:
--   admin   — full control over everything, including hard delete.
--   editor  — manage taxonomy, authors, and any article; can publish.
--   writer  — manage only their own byline's articles, and only while
--             those articles are in draft/review (publishing requires
--             an editor or admin — this is what the "review" status is for).
--   public  — read published articles and public taxonomy only.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.authors enable row level security;
alter table public.articles enable row level security;
alter table public.article_tags enable row level security;
alter table public.sources enable row level security;

-- ── Helper functions ────────────────────────────────────────────────────
-- SECURITY DEFINER (dengan search_path terkunci) wajib di sini: policy pada
-- profiles/authors/articles memanggil fungsi-fungsi ini, dan kalau fungsinya
-- sendiri tunduk pada RLS tabel yang sama, hasilnya rekursi tak terbatas
-- ("stack depth limit exceeded"). Fungsi hanya membaca baris milik auth.uid().

create function public.current_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_staff()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'editor'), false);
$$;

create function public.owns_author(p_author_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.authors a
    where a.id = p_author_id and a.profile_id = auth.uid()
  );
$$;

create function public.can_manage_article(p_article_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.is_staff() or exists (
    select 1 from public.articles ar
    where ar.id = p_article_id and public.owns_author(ar.author_id)
  );
$$;

-- ── profiles ────────────────────────────────────────────────────────────

create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "staff read all profiles" on public.profiles
  for select using (public.is_staff());

create policy "update own profile (not role)" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());

-- NOTE: with check must stay conditioned on admin (not "true") — Postgres
-- OR-combines WITH CHECK expressions across all permissive policies for the
-- same command, so an unconditional check here would also apply to the
-- "update own profile" policy above and let any user grant themselves the
-- admin role.
create policy "admin manage all profiles" on public.profiles
  for update using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "admin delete profiles" on public.profiles
  for delete using (public.current_role() = 'admin');

-- ── categories ──────────────────────────────────────────────────────────

create policy "public read categories" on public.categories
  for select using (true);

create policy "staff write categories" on public.categories
  for insert with check (public.is_staff());
create policy "staff update categories" on public.categories
  for update using (public.is_staff()) with check (public.is_staff());
create policy "staff delete categories" on public.categories
  for delete using (public.is_staff());

-- ── tags ────────────────────────────────────────────────────────────────

create policy "public read tags" on public.tags
  for select using (true);

create policy "staff write tags" on public.tags
  for insert with check (public.is_staff());
create policy "staff update tags" on public.tags
  for update using (public.is_staff()) with check (public.is_staff());
create policy "staff delete tags" on public.tags
  for delete using (public.is_staff());

-- ── authors ─────────────────────────────────────────────────────────────

create policy "public read authors" on public.authors
  for select using (true);

create policy "staff write authors" on public.authors
  for insert with check (public.is_staff());
create policy "staff update authors" on public.authors
  for update using (public.is_staff()) with check (public.is_staff());
create policy "staff delete authors" on public.authors
  for delete using (public.is_staff());

-- ── articles ────────────────────────────────────────────────────────────

create policy "public read published articles" on public.articles
  for select using (status = 'published' and published_at <= now());

create policy "staff read all articles" on public.articles
  for select using (public.is_staff());

create policy "writer read own articles" on public.articles
  for select using (public.owns_author(author_id));

create policy "staff insert articles" on public.articles
  for insert with check (public.is_staff());

create policy "writer insert own draft" on public.articles
  for insert with check (
    public.current_role() = 'writer'
    and public.owns_author(author_id)
    and status in ('draft', 'review')
  );

create policy "staff update articles" on public.articles
  for update using (public.is_staff()) with check (public.is_staff());

create policy "writer update own draft" on public.articles
  for update
  using (public.owns_author(author_id) and status in ('draft', 'review'))
  with check (public.owns_author(author_id) and status in ('draft', 'review'));

create policy "admin delete articles" on public.articles
  for delete using (public.current_role() = 'admin');

-- ── article_tags ────────────────────────────────────────────────────────

create policy "public read tags of published articles" on public.article_tags
  for select using (
    exists (
      select 1 from public.articles ar
      where ar.id = article_tags.article_id and ar.status = 'published'
    )
  );

create policy "manage own article tags" on public.article_tags
  for all
  using (public.can_manage_article(article_id))
  with check (public.can_manage_article(article_id));

-- ── sources ─────────────────────────────────────────────────────────────

create policy "public read sources of published articles" on public.sources
  for select using (
    exists (
      select 1 from public.articles ar
      where ar.id = sources.article_id and ar.status = 'published'
    )
  );

create policy "manage own article sources" on public.sources
  for all
  using (public.can_manage_article(article_id))
  with check (public.can_manage_article(article_id));
