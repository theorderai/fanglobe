-- ═══════════════════════════════════════════════════════════════════
-- FanGlobe — Migration 011: fix "Database error creating anonymous user"
--
-- handle_new_user() (from 002) runs as Supabase Auth's role, whose
-- search_path doesn't include "public", so the unqualified `profiles`
-- insert failed and aborted every sign-up. Qualify the table, pin the
-- search_path, and never let a profile-row problem block a sign-in.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- Same pinning for the updated_at helper from 002.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- If sign-ups still fail after this, list every trigger on auth.users:
--   select tgname, tgfoid::regproc from pg_trigger
--   where tgrelid = 'auth.users'::regclass and not tgisinternal;
