-- ═══════════════════════════════════════════════════════════════════
-- kickoff.world — Database Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements";

-- ── Checkins ─────────────────────────────────────────────────────────────────
create table if not exists checkins (
  id          uuid primary key default uuid_generate_v4(),
  match_id    text not null,
  lat         float8 not null,
  lng         float8 not null,
  country     text,
  city        text,
  session_id  text not null,
  created_at  timestamptz not null default now()
);

create index idx_checkins_match_id   on checkins(match_id);
create index idx_checkins_created_at on checkins(created_at desc);
create index idx_checkins_session    on checkins(session_id);

-- ── Pulse votes ───────────────────────────────────────────────────────────────
create type vibe_type as enum ('fire', 'ecstatic', 'nervous', 'crushed');

create table if not exists pulse_votes (
  id          uuid primary key default uuid_generate_v4(),
  match_id    text not null,
  session_id  text not null,
  vibe        vibe_type not null,
  replaced    vibe_type,
  created_at  timestamptz not null default now(),
  -- one active vote per session per match (upsert)
  unique(match_id, session_id)
);

create index idx_pulse_match on pulse_votes(match_id);

-- ── Cheers ────────────────────────────────────────────────────────────────────
create table if not exists cheers (
  id          uuid primary key default uuid_generate_v4(),
  match_id    text not null,
  city        text not null,
  country     text,
  flag        text not null,
  text        text not null check (char_length(text) <= 160),
  vibe        vibe_type,
  source      text not null default 'ai', -- 'ai' | 'user'
  session_id  text,
  moderated   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_cheers_match_id   on cheers(match_id);
create index idx_cheers_created_at on cheers(created_at desc);

-- ── Snapshots (materialised per match per minute for analytics) ───────────────
create table if not exists snapshots (
  id          uuid primary key default uuid_generate_v4(),
  match_id    text not null,
  total       int8 not null default 0,
  pulse_fire      int8 not null default 0,
  pulse_ecstatic  int8 not null default 0,
  pulse_nervous   int8 not null default 0,
  pulse_crushed   int8 not null default 0,
  city_counts jsonb not null default '{}',
  snapped_at  timestamptz not null default now()
);

create index idx_snapshots_match on snapshots(match_id, snapped_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table checkins    enable row level security;
alter table pulse_votes enable row level security;
alter table cheers      enable row level security;
alter table snapshots   enable row level security;

-- Public reads
create policy "Public read checkins"    on checkins    for select using (true);
create policy "Public read pulse_votes" on pulse_votes for select using (true);
create policy "Public read cheers"      on cheers      for select using (moderated = true);
create policy "Public read snapshots"   on snapshots   for select using (true);

-- Anon inserts (via service role in API routes — not direct from client)
-- API routes use service role key, so these are backup policies
create policy "Anon insert checkins"    on checkins    for insert with check (true);
create policy "Anon insert pulse_votes" on pulse_votes for insert with check (true);
create policy "Anon insert cheers"      on cheers      for insert with check (true);
create policy "Anon upsert pulse_votes" on pulse_votes for update using (true);

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Enable realtime for cheers (low-volume, high-impact)
alter publication supabase_realtime add table cheers;
alter publication supabase_realtime add table snapshots;

-- ── Helper functions ──────────────────────────────────────────────────────────
-- Get city counts for a match (called by snapshot cron)
create or replace function get_city_counts(p_match_id text)
returns jsonb as $$
  select coalesce(jsonb_object_agg(city, cnt), '{}')
  from (
    select city, count(*) as cnt
    from checkins
    where match_id = p_match_id and city is not null
    group by city
    order by cnt desc
    limit 20
  ) t;
$$ language sql stable;

-- Get pulse totals for a match
create or replace function get_pulse_totals(p_match_id text)
returns jsonb as $$
  select jsonb_build_object(
    'fire',     coalesce(sum(case when vibe = 'fire' then 1 else 0 end), 0),
    'ecstatic', coalesce(sum(case when vibe = 'ecstatic' then 1 else 0 end), 0),
    'nervous',  coalesce(sum(case when vibe = 'nervous' then 1 else 0 end), 0),
    'crushed',  coalesce(sum(case when vibe = 'crushed' then 1 else 0 end), 0)
  )
  from pulse_votes
  where match_id = p_match_id;
$$ language sql stable;
