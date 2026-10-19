-- ============================================================================
-- TeknoKini — 0001_init_schema.sql
-- Core tables for the news portal: taxonomy, authorship, articles, sources.
-- RLS policies live in 0002_rls_policies.sql (kept separate so schema and
-- access-control can be reviewed/changed independently).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────

create type public.user_role as enum ('admin', 'editor', 'writer');

create type public.article_status as enum (
  'draft',
  'review',
  'scheduled',
  'published',
  'archived'
);

-- ── profiles ──────────────────────────────────────────────────────────────
-- One row per Supabase Auth user. Holds the CMS role used by RLS policies.
-- Distinct from `authors`: a profile is a login/permissions identity, an
-- author is the public byline shown on the site. A profile can be linked to
-- an author (see authors.profile_id) but doesn't have to be — lets an
-- editorial team byline ("TeknoKini Team") stay stable even as the people
-- behind it change.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'writer',
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-provision a profile row whenever a new Supabase Auth user is created,
-- so admins never have to manually insert one before assigning a role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── categories ────────────────────────────────────────────────────────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── tags ──────────────────────────────────────────────────────────────────

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ── authors ───────────────────────────────────────────────────────────────

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  avatar text,
  -- Optional link to the login identity that writes under this byline.
  -- Nullable: house/team bylines don't need to map to one account.
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── articles ──────────────────────────────────────────────────────────────

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  featured_image text,
  category_id uuid references public.categories (id) on delete restrict,
  author_id uuid references public.authors (id) on delete restrict,
  status public.article_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A scheduled article must carry the timestamp it's scheduled for;
  -- a draft/review article shouldn't already have a publish date.
  constraint scheduled_requires_published_at
    check (status <> 'scheduled' or published_at is not null)
);

comment on column public.articles.content is
  'Rich text stored as editor JSON (or sanitized HTML) — never a raw file on disk.';

-- ── article_tags (many-to-many) ──────────────────────────────────────────

create table public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ── sources ───────────────────────────────────────────────────────────────
-- Attribution only — storing a source never implies the article content was
-- copied from it. Editorial originality is a content-policy rule, not
-- something the schema can enforce.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  source_name text not null,
  source_url text not null,
  source_published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────

create index idx_articles_published_at on public.articles (published_at desc)
  where status = 'published';
create index idx_articles_category_id on public.articles (category_id);
create index idx_articles_status on public.articles (status);
create index idx_articles_author_id on public.articles (author_id);

create index idx_article_tags_tag_id on public.article_tags (tag_id);
create index idx_sources_article_id on public.sources (article_id);
create index idx_authors_profile_id on public.authors (profile_id);

-- Basic full-text search over title/excerpt/content, backing /search until
-- the app outgrows Postgres search (see SKILL/README notes on that path).
alter table public.articles
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('indonesian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('indonesian', coalesce(content, '')), 'C')
  ) stored;

create index idx_articles_search_vector on public.articles using gin (search_vector);

-- ── updated_at maintenance ──────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.authors
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.articles
  for each row execute function public.set_updated_at();
