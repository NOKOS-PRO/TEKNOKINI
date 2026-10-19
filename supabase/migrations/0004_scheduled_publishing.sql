-- ─────────────────────────────────────────────────────────────────────────
-- 0004 — Scheduled articles go live automatically
--
-- Before this migration, an article with status 'scheduled' was never shown
-- publicly: every public policy required status = 'published', and nothing
-- ever flipped 'scheduled' to 'published'.
--
-- Fix, in two layers:
--   1. Visibility: public policies accept 'published' OR 'scheduled' as long
--      as published_at <= now(). A scheduled article appears the moment its
--      time passes, with no job required. (lib/services/articles.ts uses the
--      same rule via PUBLIC_STATUSES.)
--   2. Housekeeping: publish_due_articles() flips due 'scheduled' rows to
--      'published' so the admin list shows the real state. It runs from
--      pg_cron every 5 minutes when that extension is available, and the
--      content agent also calls it on each run.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Visibility ----------------------------------------------------------

drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles" on public.articles
  for select using (
    status in ('published', 'scheduled')
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists "public read tags of published articles" on public.article_tags;
create policy "public read tags of published articles" on public.article_tags
  for select using (
    exists (
      select 1 from public.articles ar
      where ar.id = article_tags.article_id
        and ar.status in ('published', 'scheduled')
        and ar.published_at <= now()
    )
  );

drop policy if exists "public read sources of published articles" on public.sources;
create policy "public read sources of published articles" on public.sources
  for select using (
    exists (
      select 1 from public.articles ar
      where ar.id = sources.article_id
        and ar.status in ('published', 'scheduled')
        and ar.published_at <= now()
    )
  );

create or replace function public.increment_article_views(p_article_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.articles
  set views = views + 1
  where id = p_article_id
    and status in ('published', 'scheduled')
    and published_at <= now();
$$;

-- Index for the public listing query (status filter + newest first).
create index if not exists idx_articles_public_listing
  on public.articles (published_at desc)
  where status in ('published', 'scheduled');

-- 2. Housekeeping --------------------------------------------------------

create or replace function public.publish_due_articles()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  n integer;
begin
  update public.articles
  set status = 'published'
  where status = 'scheduled'
    and published_at is not null
    and published_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.publish_due_articles() from public, anon, authenticated;
grant execute on function public.publish_due_articles() to service_role;

-- Schedule it with pg_cron if the extension can be enabled on this project.
-- On Supabase: Dashboard → Database → Extensions → pg_cron (free plan included).
do $$
begin
  create extension if not exists pg_cron;
  if not exists (select 1 from cron.job where jobname = 'publish-due-articles') then
    perform cron.schedule('publish-due-articles', '*/5 * * * *', 'select public.publish_due_articles();');
  end if;
exception when others then
  raise notice 'pg_cron not available (%). Scheduled articles still go live via the visibility rule above.', sqlerrm;
end;
$$;
