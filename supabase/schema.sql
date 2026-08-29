-- Ingredient Check — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Creates:
--   public.profiles   display name, tied 1:1 to auth.users
--   public.user_data  conditions, kids-product flag, scan history (json)
--   RLS so each signed-in user can only read/write their own rows
--   a trigger that inserts those rows when someone signs up
--   delete_own_account() so a user can remove themselves from the app

-- ————————————————————————— profiles —————————————————————————

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  created_at timestamptz not null default now()
);

-- ————————————————————————— user_data —————————————————————————

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  conditions jsonb not null default '[]'::jsonb,
  kids_product boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ————————————————————————— row level security —————————————————————————

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

drop policy if exists "profiles_own_row" on public.profiles;
create policy "profiles_own_row"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "user_data_own_row" on public.user_data;
create policy "user_data_own_row"
  on public.user_data
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

-- ————————————————————————— signup trigger —————————————————————————

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');
  if display_name is null then
    display_name := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  insert into public.profiles (id, name)
  values (new.id, display_name)
  on conflict (id) do nothing;

  insert into public.user_data (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ————————————————————————— self-delete —————————————————————————
-- Lets a signed-in user remove their auth.users row. Profiles and
-- user_data cascade. Requires the function to run as the table owner.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
