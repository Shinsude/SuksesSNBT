begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  activity_type text not null check (activity_type in ('latihan', 'tryout')),
  label text not null default 'Aktivitas SNBT',
  score smallint not null check (score between 0 and 100),
  correct_count smallint not null default 0 check (correct_count >= 0),
  wrong_count smallint not null default 0 check (wrong_count >= 0),
  blank_count smallint not null default 0 check (blank_count >= 0),
  total_count smallint not null default 0 check (total_count >= 0),
  completed_at timestamptz not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists progress_entries_user_completed_idx
  on public.progress_entries (user_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.progress_entries enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.progress_entries to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own progress" on public.progress_entries;
create policy "Users can read their own progress" on public.progress_entries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own progress" on public.progress_entries;
create policy "Users can create their own progress" on public.progress_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own progress" on public.progress_entries;
create policy "Users can update their own progress" on public.progress_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own progress" on public.progress_entries;
create policy "Users can delete their own progress" on public.progress_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_snbt_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The trigger can invoke this function; API roles cannot call the definer function directly.
revoke all on function public.handle_new_snbt_user() from public, anon, authenticated;

drop trigger if exists on_snbt_auth_user_created on auth.users;
create trigger on_snbt_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_snbt_user();

commit;
