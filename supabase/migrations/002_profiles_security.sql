-- ═══════════════════════════════════════════════════════════════════
-- kickoff.world — Migration 002: User profiles + security
-- ═══════════════════════════════════════════════════════════════════

-- ── User profiles ─────────────────────────────────────────────────────────────
-- One row per Supabase auth.uid() — works for anon and registered users
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text check (char_length(display_name) <= 40),
  favourite_team  text check (char_length(favourite_team) <= 60),
  country         text,
  country_flag    text,
  email           text,                          -- only if user voluntarily adds it
  email_updates   boolean not null default false,
  avatar_seed     text,                          -- for deterministic avatar generation
  is_anonymous    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── Update checkins to use auth uid instead of session_id ─────────────────────
alter table checkins    add column if not exists user_id uuid references auth.users(id);
alter table pulse_votes add column if not exists user_id uuid references auth.users(id);
alter table cheers      add column if not exists user_id uuid references auth.users(id);

create index idx_checkins_user    on checkins(user_id);
create index idx_pulse_votes_user on pulse_votes(user_id);

-- ── RLS: profiles ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;

-- Users can read any profile (for leaderboard display names)
create policy "Public read profiles"
  on profiles for select using (true);

-- Users can only insert/update their own profile
create policy "Own profile insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Own profile update"
  on profiles for update
  using (auth.uid() = id);

-- ── RLS: tighten checkins to user_id ──────────────────────────────────────────
drop policy if exists "Anon insert checkins" on checkins;
create policy "Auth insert checkins"
  on checkins for insert
  with check (auth.uid() = user_id);

-- One checkin per user per match (enforced at app layer + DB)
create unique index if not exists idx_checkins_user_match
  on checkins(user_id, match_id);

-- ── RLS: tighten pulse_votes ──────────────────────────────────────────────────
drop policy if exists "Anon insert pulse_votes"  on pulse_votes;
drop policy if exists "Anon upsert pulse_votes"  on pulse_votes;

create policy "Auth upsert pulse_votes"
  on pulse_votes for insert
  with check (auth.uid() = user_id);

create policy "Auth update own pulse_votes"
  on pulse_votes for update
  using (auth.uid() = user_id);

-- ── Auto-create profile on user signup (anon or registered) ───────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, is_anonymous)
  values (new.id, new.is_anonymous)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── UTM / referral tracking table ─────────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  referrer    text,
  device_type text,              -- 'mobile' | 'tablet' | 'desktop'
  created_at  timestamptz not null default now()
);

alter table sessions enable row level security;
create policy "Own session insert" on sessions for insert
  with check (auth.uid() = user_id);
create policy "Service read sessions" on sessions for select
  using (false); -- only service role can read (analytics)
