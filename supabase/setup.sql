-- The Marriage Oracle: account and saved-reading database setup
-- Run this whole file once in Supabase Dashboard > SQL Editor.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- User profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text not null default 'Reader',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint profiles_first_name_length
        check (char_length(first_name) between 1 and 30)
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
grant select, insert, update, delete on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Saved quiz progress and completed readings
-- ---------------------------------------------------------------------------

create table if not exists public.readings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'in_progress',
    current_question_index integer not null default 0,
    answers jsonb not null default '{}'::jsonb,
    result jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint readings_status_allowed
        check (status in ('in_progress', 'completed')),
    constraint readings_question_index_range
        check (current_question_index between 0 and 200),
    constraint readings_answers_object
        check (jsonb_typeof(answers) = 'object'),
    constraint readings_result_object
        check (result is null or jsonb_typeof(result) = 'object'),
    constraint readings_completed_state
        check (
            (status = 'in_progress' and completed_at is null)
            or
            (status = 'completed' and completed_at is not null and result is not null)
        )
);

create index if not exists readings_user_updated_idx
    on public.readings (user_id, updated_at desc);

create index if not exists readings_user_status_idx
    on public.readings (user_id, status);

alter table public.readings enable row level security;

revoke all on table public.readings from anon;
grant select, insert, update, delete on table public.readings to authenticated;

-- ---------------------------------------------------------------------------
-- Keep updated_at accurate
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

drop trigger if exists readings_set_updated_at on public.readings;
create trigger readings_set_updated_at
    before update on public.readings
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row automatically after sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    supplied_name text;
begin
    supplied_name := left(
        btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
        30
    );

    if supplied_name = '' then
        supplied_name := 'Reader';
    end if;

    insert into public.profiles (id, first_name)
    values (new.id, supplied_name)
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security: users can access only their own rows
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
    on public.profiles
    for select
    to authenticated
    using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
    on public.profiles
    for insert
    to authenticated
    with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
    on public.profiles
    for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
    on public.profiles
    for delete
    to authenticated
    using ((select auth.uid()) = id);

drop policy if exists "readings_select_own" on public.readings;
create policy "readings_select_own"
    on public.readings
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "readings_insert_own" on public.readings;
create policy "readings_insert_own"
    on public.readings
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "readings_update_own" on public.readings;
create policy "readings_update_own"
    on public.readings
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "readings_delete_own" on public.readings;
create policy "readings_delete_own"
    on public.readings
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

commit;
