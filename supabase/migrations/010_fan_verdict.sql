-- ═══════════════════════════════════════════════════════════════════
-- FanGlobe — Migration 010: Fan Verdict
-- Live, incident-anchored fan verdicts on referee decisions.
--
-- New tables only. Nothing from the World Cup era is dropped here, so this
-- can run against the live database without touching existing data.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Matches ──────────────────────────────────────────────────────────────────
-- id is a readable slug (e.g. "epl-arsenal-chelsea-2026-11-29") or
-- "af-<fixture id>" when synced from API-Football.
create table if not exists matches (
  id            text primary key,
  provider_id   text unique,
  sport_id      text not null default 'soccer',
  competition   text,
  home_team     text not null check (char_length(home_team) <= 60),
  away_team     text not null check (char_length(away_team) <= 60),
  home_short    text check (char_length(home_short) <= 5),
  away_short    text check (char_length(away_short) <= 5),
  home_color    text,
  away_color    text,
  home_logo     text,
  away_logo     text,
  venue         text,
  kickoff_at    timestamptz not null,
  status        text not null default 'upcoming'
                check (status in ('upcoming', 'live', 'finished', 'postponed')),
  minute        int,
  home_score    int,
  away_score    int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_matches_kickoff on matches(kickoff_at desc);
create index if not exists idx_matches_status  on matches(status);

-- ── Incidents ────────────────────────────────────────────────────────────────
-- One refereeing decision fans can rule on.
create table if not exists incidents (
  id             uuid primary key default gen_random_uuid(),
  short_id       text unique not null default substr(md5(gen_random_uuid()::text), 1, 8),
  match_id       text not null references matches(id) on delete cascade,
  minute         int,
  kind           text not null default 'other'
                 check (kind in ('penalty', 'red_card', 'goal', 'offside', 'handball',
                                 'foul', 'var_review', 'other')),
  title          text not null check (char_length(title) <= 120),
  ref_call       text not null check (char_length(ref_call) <= 120),
  -- which side the referee's call helped (drives "even X% of <team> fans..." headline)
  favoured_side  text check (favoured_side in ('home', 'away')),
  source         text not null default 'admin' check (source in ('feed', 'admin', 'crowd')),
  provider_key   text unique,
  status         text not null default 'open' check (status in ('open', 'closed', 'hidden')),
  created_at     timestamptz not null default now(),
  closed_at      timestamptz
);

create index if not exists idx_incidents_match on incidents(match_id, created_at desc);

-- ── Which side a fan is on, per match ────────────────────────────────────────
create table if not exists match_sides (
  match_id    text not null references matches(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  side        text not null check (side in ('home', 'away', 'neutral')),
  created_at  timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ── Verdict votes (one per fan per incident, final) ──────────────────────────
create table if not exists verdict_votes (
  incident_id  uuid not null references incidents(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  side         text not null check (side in ('home', 'away', 'neutral')),
  verdict      text not null check (verdict in ('right', 'wrong')),
  anger        smallint not null check (anger between 1 and 5),
  created_at   timestamptz not null default now(),
  primary key (incident_id, user_id)
);

create index if not exists idx_verdict_votes_incident on verdict_votes(incident_id);

-- ── Vents (short free-text reactions, moderated) ─────────────────────────────
create table if not exists vents (
  id           uuid primary key default gen_random_uuid(),
  match_id     text not null references matches(id) on delete cascade,
  incident_id  uuid references incidents(id) on delete set null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  side         text not null check (side in ('home', 'away', 'neutral')),
  text         text not null check (char_length(text) between 1 and 200),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index if not exists idx_vents_match on vents(match_id, created_at desc);

-- ── Reaction timeseries (10-second buckets of "bad call!" taps) ──────────────
-- Redis holds the live buckets; the cron persists them here for history.
create table if not exists reaction_buckets (
  match_id   text not null references matches(id) on delete cascade,
  bucket_at  timestamptz not null,
  taps       int not null default 0,
  primary key (match_id, bucket_at)
);

-- ── Rebuild an incident's tally from Postgres (used when Redis is cold) ─────
create or replace function incident_tally(p_incident_id uuid)
returns table (side text, verdict text, votes bigint, anger_sum bigint) as $$
  select side, verdict, count(*)::bigint, sum(anger)::bigint
  from verdict_votes
  where incident_id = p_incident_id
  group by side, verdict;
$$ language sql stable;

-- ── Row level security ───────────────────────────────────────────────────────
-- All writes go through API routes with the service role. The public can read
-- matches, visible incidents and approved vents; individual votes stay private.
alter table matches          enable row level security;
alter table incidents        enable row level security;
alter table match_sides      enable row level security;
alter table verdict_votes    enable row level security;
alter table vents            enable row level security;
alter table reaction_buckets enable row level security;

drop policy if exists "Public read matches" on matches;
create policy "Public read matches" on matches for select using (true);

drop policy if exists "Public read incidents" on incidents;
create policy "Public read incidents" on incidents for select using (status <> 'hidden');

drop policy if exists "Public read approved vents" on vents;
create policy "Public read approved vents" on vents for select using (status = 'approved');

drop policy if exists "Public read reaction buckets" on reaction_buckets;
create policy "Public read reaction buckets" on reaction_buckets for select using (true);

drop policy if exists "Own side read" on match_sides;
create policy "Own side read" on match_sides for select using (auth.uid() = user_id);

drop policy if exists "Own votes read" on verdict_votes;
create policy "Own votes read" on verdict_votes for select using (auth.uid() = user_id);
