-- ============================================================================
-- TeknoKini — 0006_content_plan_and_traffic.sql
--  1. content_plan : rencana konten. Bot membuat draf H-1 sebelum jadwal tayang.
--  2. page_views   : penghitung trafik anonim (tanpa cookie, tanpa IP mentah).
--  3. traffic_overview() / purge_old_page_views() untuk panel admin.
-- ============================================================================

-- ── 0. Perbaikan rekursi RLS ─────────────────────────────────────────────
-- Versi awal fungsi helper (0002) tunduk pada RLS dan rekursif tak terbatas.
-- Aman dijalankan ulang; proyek yang sudah memakai 0002 versi baru tidak berubah.
create or replace function public.current_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'editor'), false);
$$;

create or replace function public.owns_author(p_author_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.authors a
    where a.id = p_author_id and a.profile_id = auth.uid()
  );
$$;

create or replace function public.can_manage_article(p_article_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select public.is_staff() or exists (
    select 1 from public.articles ar
    where ar.id = p_article_id and public.owns_author(ar.author_id)
  );
$$;

-- ── 1. Rencana konten ───────────────────────────────────────────────────
create table public.content_plan (
  id            uuid primary key default gen_random_uuid(),
  topic         text not null check (char_length(topic) between 5 and 300),
  brief         text,
  category_id   uuid not null references public.categories(id) on delete cascade,
  author_id     uuid references public.authors(id) on delete set null,
  -- Waktu tayang yang diinginkan. Draf dibuat sekitar 1 hari sebelumnya.
  publish_at    timestamptz not null,
  -- true = draf langsung berstatus 'scheduled' (tayang tanpa review). Default false.
  auto_schedule boolean not null default false,
  status        text not null default 'planned'
                check (status in ('planned', 'drafting', 'drafted', 'failed', 'cancelled')),
  attempts      int not null default 0,
  article_id    uuid references public.articles(id) on delete set null,
  error         text,
  -- Catatan AI: klaim yang perlu dicek faktanya sebelum tayang.
  ai_notes      text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_content_plan_queue on public.content_plan (status, publish_at);

create trigger set_updated_at before update on public.content_plan
  for each row execute function public.set_updated_at();

alter table public.content_plan enable row level security;

create policy "staff manage content plan" on public.content_plan
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ── 2. Penghitung trafik ────────────────────────────────────────────────
-- Hanya diisi lewat /api/track dengan service role. visitor_hash adalah hash
-- (IP + user-agent + tanggal + garam rahasia): berubah tiap hari, tidak bisa
-- dibalik, dan tidak melacak orang lintas hari.
create table public.page_views (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  path          text not null,
  visitor_hash  text not null,
  referrer_host text,
  device        text,
  country       text
);

create index idx_page_views_created on public.page_views (created_at desc);
create index idx_page_views_path on public.page_views (path, created_at desc);
create index idx_page_views_visitor on public.page_views (visitor_hash, created_at desc);

alter table public.page_views enable row level security;

create policy "staff read page views" on public.page_views
  for select to authenticated
  using (public.is_staff());

-- ── 3. Ringkasan trafik untuk dashboard ─────────────────────────────────
-- Hari dihitung menurut WIB (Asia/Jakarta). "Pengunjung unik" dihitung per hari;
-- total periode = jumlah pengunjung unik harian. SECURITY INVOKER: RLS di atas
-- berlaku, jadi hanya admin/editor yang melihat angka sebenarnya.
create or replace function public.traffic_overview(p_days int default 7)
returns jsonb
language sql stable
as $$
  with params as (
    select greatest(1, least(coalesce(p_days, 7), 90)) as days,
           (now() at time zone 'Asia/Jakarta')::date as today
  ),
  v as (
    select pv.path, pv.visitor_hash, pv.referrer_host, pv.device, pv.country,
           (pv.created_at at time zone 'Asia/Jakarta')::date as d
    from public.page_views pv, params p
    where pv.created_at >=
          ((p.today - (greatest(p.days, 2) - 1))::timestamp at time zone 'Asia/Jakarta')
  ),
  per_day as (
    select d, count(*) as views, count(distinct visitor_hash) as visitors
    from v group by d
  ),
  series as (
    select (p.today - n) as d from params p, generate_series(0, p.days - 1) as n
  )
  select jsonb_build_object(
    'live', (
      select count(distinct visitor_hash)
      from public.page_views
      where created_at > now() - interval '5 minutes'
    ),
    'today', coalesce(
      (select jsonb_build_object('views', pd.views, 'visitors', pd.visitors)
         from per_day pd, params p where pd.d = p.today),
      jsonb_build_object('views', 0, 'visitors', 0)
    ),
    'yesterday', coalesce(
      (select jsonb_build_object('views', pd.views, 'visitors', pd.visitors)
         from per_day pd, params p where pd.d = p.today - 1),
      jsonb_build_object('views', 0, 'visitors', 0)
    ),
    'period_views', (
      select coalesce(sum(pd.views), 0) from per_day pd, params p where pd.d > p.today - p.days
    ),
    'period_visitors', (
      select coalesce(sum(pd.visitors), 0) from per_day pd, params p where pd.d > p.today - p.days
    ),
    'daily', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('day', s.d, 'views', coalesce(pd.views, 0), 'visitors', coalesce(pd.visitors, 0))
          order by s.d
        ),
        '[]'::jsonb
      )
      from series s left join per_day pd on pd.d = s.d
    ),
    'top_pages', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select v.path, a.title, count(*) as views
        from v
        join params p on true
        left join public.articles a on v.path = '/berita/' || a.slug
        where v.d > p.today - p.days
        group by v.path, a.title
        order by count(*) desc
        limit 10
      ) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(v.referrer_host, '(langsung)') as name, count(*) as views
        from v join params p on true
        where v.d > p.today - p.days
        group by coalesce(v.referrer_host, '(langsung)')
        order by count(*) desc
        limit 8
      ) t
    ),
    'devices', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(v.device, 'lainnya') as name, count(*) as views
        from v join params p on true
        where v.d > p.today - p.days
        group by coalesce(v.device, 'lainnya')
        order by count(*) desc
      ) t
    ),
    'countries', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(v.country, '??') as name, count(*) as views
        from v join params p on true
        where v.d > p.today - p.days
        group by coalesce(v.country, '??')
        order by count(*) desc
        limit 8
      ) t
    )
  );
$$;

revoke execute on function public.traffic_overview(int) from public, anon;
grant execute on function public.traffic_overview(int) to authenticated, service_role;

-- Hapus data trafik lama (dipanggil bot harian). Default simpan 90 hari.
create or replace function public.purge_old_page_views(p_days int default 90)
returns int
language sql
as $$
  with d as (
    delete from public.page_views
    where created_at < now() - make_interval(days => greatest(p_days, 7))
    returning 1
  )
  select count(*)::int from d;
$$;

revoke execute on function public.purge_old_page_views(int) from public, anon, authenticated;
grant execute on function public.purge_old_page_views(int) to service_role;
