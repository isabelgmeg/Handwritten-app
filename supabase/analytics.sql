-- Run this once in the Supabase Studio SQL Editor (Project → SQL Editor → New query).
-- Creates the events table used by src/lib/analytics.ts, locks it down with RLS
-- (anonymous clients may insert, nobody can read except via the service role /
-- SQL Editor, which bypasses RLS), and defines aggregate views for the four
-- UX metric categories: page views, feature usage, the draw→download funnel,
-- and community engagement.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_name text not null,
  props jsonb not null default '{}'::jsonb,
  app text not null default 'font-creator',
  created_at timestamptz not null default now()
);

create index if not exists events_event_name_idx on public.events (event_name);
create index if not exists events_session_id_idx on public.events (session_id);
create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_app_created_at_idx on public.events (app, created_at);

alter table public.events enable row level security;

-- The table is shared with art-ripple and the portfolio, told apart by `app`.
-- Inserts are limited to known apps, short event names and small props.

drop policy if exists "Allow anonymous inserts" on public.events;
create policy "Allow anonymous inserts"
  on public.events
  for insert
  to anon
  with check (
    app in ('font-creator', 'art-ripple', 'portfolio')
    and char_length(event_name) between 1 and 64
    and pg_column_size(props) <= 2048
  );

-- Deliberately no SELECT policy: anon/authenticated clients cannot read events
-- back. You view aggregates below via Studio's SQL Editor / Table Editor,
-- which run as the service role and bypass RLS.

-- ── Views ────────────────────────────────────────────────────────────────────
-- Each view reads only this app's rows. security_invoker makes them respect RLS,
-- and the revoke at the end keeps them out of the public REST API.

-- Daily active (anonymous, per-tab) sessions.
create or replace view public.analytics_daily_sessions with (security_invoker = true) as
select
  date_trunc('day', created_at) as day,
  count(distinct session_id) as sessions
from public.events
where app = 'font-creator' and event_name = 'session_start'
group by 1
order by 1 desc;

-- Page views by route, per day.
create or replace view public.analytics_page_views with (security_invoker = true) as
select
  date_trunc('day', created_at) as day,
  props ->> 'path' as path,
  count(*) as views
from public.events
where app = 'font-creator' and event_name = 'page_view'
group by 1, 2
order by 1 desc, 3 desc;

-- Feature usage: how often each instrumented action fires, and by how many
-- distinct sessions (a rough "how many people touched this" signal).
create or replace view public.analytics_feature_usage with (security_invoker = true) as
select
  event_name,
  count(*) as events,
  count(distinct session_id) as sessions
from public.events
where app = 'font-creator' and event_name not in ('session_start', 'page_view')
group by 1
order by 2 desc;

-- Draw → download funnel, computed per session so it reflects real
-- conversion rather than independent event totals.
create or replace view public.analytics_download_funnel with (security_invoker = true) as
with per_session as (
  select
    session_id,
    bool_or(event_name = 'session_start') as started,
    bool_or(event_name = 'glyph_stroke_added') as drew,
    bool_or(event_name = 'download_dialog_opened') as opened_download,
    bool_or(event_name = 'font_download_succeeded') as downloaded
  from public.events
  where app = 'font-creator'
  group by session_id
)
select
  count(*) filter (where started) as total_sessions,
  count(*) filter (where drew) as sessions_that_drew,
  count(*) filter (where opened_download) as sessions_that_opened_download,
  count(*) filter (where downloaded) as sessions_that_downloaded,
  round(100.0 * count(*) filter (where drew) / nullif(count(*) filter (where started), 0), 1) as pct_started_to_drew,
  round(100.0 * count(*) filter (where downloaded) / nullif(count(*) filter (where drew), 0), 1) as pct_drew_to_downloaded
from per_session;

-- Community feature engagement, per day.
create or replace view public.analytics_community_engagement with (security_invoker = true) as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_name = 'community_page_viewed') as page_views,
  count(*) filter (where event_name = 'share_dialog_opened') as share_dialog_opens,
  count(*) filter (where event_name = 'note_submitted') as notes_submitted
from public.events
where app = 'font-creator'
  and event_name in ('community_page_viewed', 'share_dialog_opened', 'note_submitted')
group by 1
order by 1 desc;

revoke all on
  public.analytics_daily_sessions,
  public.analytics_page_views,
  public.analytics_feature_usage,
  public.analytics_download_funnel,
  public.analytics_community_engagement
from anon, authenticated;
