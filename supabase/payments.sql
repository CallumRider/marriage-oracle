-- The Marriage Oracle: Stripe payments and complimentary-code migration
-- Run this file once in Supabase Dashboard > SQL Editor AFTER the account setup.sql.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Secure access state on each completed reading
-- ---------------------------------------------------------------------------

alter table public.readings
    add column if not exists access_status text not null default 'locked',
    add column if not exists unlock_source text,
    add column if not exists unlocked_at timestamptz;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'readings_access_status_allowed'
          and conrelid = 'public.readings'::regclass
    ) then
        alter table public.readings
            add constraint readings_access_status_allowed
            check (access_status in ('locked', 'paid', 'promo'));
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'readings_unlock_state_consistent'
          and conrelid = 'public.readings'::regclass
    ) then
        alter table public.readings
            add constraint readings_unlock_state_consistent
            check (
                (access_status = 'locked' and unlocked_at is null and unlock_source is null)
                or
                (access_status in ('paid', 'promo') and unlocked_at is not null and unlock_source is not null)
            );
    end if;
end;
$$;

create index if not exists readings_user_access_idx
    on public.readings (user_id, access_status, updated_at desc);

-- Existing browser code previously had blanket INSERT/UPDATE privileges. Replace
-- them with column-level privileges so a signed-in browser cannot mark its own
-- reading as paid or complimentary.
revoke insert, update on table public.readings from authenticated;
grant insert (
    user_id,
    status,
    current_question_index,
    answers,
    result,
    completed_at
) on table public.readings to authenticated;
grant update (
    status,
    current_question_index,
    answers,
    result,
    completed_at
) on table public.readings to authenticated;

-- ---------------------------------------------------------------------------
-- Successful Stripe payments
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    reading_id uuid not null references public.readings(id) on delete cascade,
    stripe_checkout_session_id text not null unique,
    stripe_payment_intent_id text,
    amount_total integer not null,
    currency text not null,
    status text not null default 'paid',
    created_at timestamptz not null default now(),
    completed_at timestamptz not null default now(),
    constraint payments_reading_unique unique (reading_id),
    constraint payments_amount_positive check (amount_total > 0),
    constraint payments_currency_format check (currency ~ '^[a-z]{3}$'),
    constraint payments_status_allowed check (status in ('paid', 'refunded'))
);

create index if not exists payments_user_created_idx
    on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;
revoke all on table public.payments from anon, authenticated;
grant select on table public.payments to authenticated;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
    on public.payments
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

-- Stripe event IDs make webhook retries idempotent.
create table if not exists public.stripe_events (
    id text primary key,
    event_type text not null,
    processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
revoke all on table public.stripe_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Complimentary codes
-- Codes are stored only as SHA-256 hashes, never as readable text.
-- ---------------------------------------------------------------------------

create table if not exists public.promo_codes (
    id uuid primary key default gen_random_uuid(),
    code_hash text not null unique,
    label text not null,
    active boolean not null default true,
    max_redemptions integer,
    times_redeemed integer not null default 0,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    constraint promo_codes_hash_format check (code_hash ~ '^[0-9a-f]{64}$'),
    constraint promo_codes_max_positive check (max_redemptions is null or max_redemptions > 0),
    constraint promo_codes_times_nonnegative check (times_redeemed >= 0),
    constraint promo_codes_limit_consistent check (
        max_redemptions is null or times_redeemed <= max_redemptions
    )
);

create table if not exists public.promo_redemptions (
    id uuid primary key default gen_random_uuid(),
    promo_code_id uuid not null references public.promo_codes(id) on delete restrict,
    user_id uuid not null references auth.users(id) on delete cascade,
    reading_id uuid not null references public.readings(id) on delete cascade,
    redeemed_at timestamptz not null default now(),
    constraint promo_redemptions_one_per_account unique (promo_code_id, user_id),
    constraint promo_redemptions_one_per_reading unique (reading_id)
);

create index if not exists promo_redemptions_user_idx
    on public.promo_redemptions (user_id, redeemed_at desc);

create table if not exists public.promo_code_attempts (
    id bigint generated by default as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    attempted_at timestamptz not null default now(),
    success boolean not null default false
);

create index if not exists promo_attempts_user_time_idx
    on public.promo_code_attempts (user_id, attempted_at desc);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.promo_code_attempts enable row level security;
revoke all on table public.promo_codes from anon, authenticated;
revoke all on table public.promo_redemptions from anon, authenticated;
revoke all on table public.promo_code_attempts from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Server-only function: permanently grant access after Stripe confirmation
-- ---------------------------------------------------------------------------

create or replace function public.grant_paid_reading_access(
    p_user_id uuid,
    p_reading_id uuid,
    p_session_id text,
    p_payment_intent_id text,
    p_amount_total integer,
    p_currency text,
    p_event_id text default null,
    p_event_type text default 'checkout.session.completed'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    reading_row public.readings%rowtype;
begin
    if p_amount_total <> 99 or lower(p_currency) <> 'gbp' then
        raise exception 'Unexpected payment amount or currency.';
    end if;

    if p_event_id is not null then
        insert into public.stripe_events (id, event_type)
        values (p_event_id, coalesce(p_event_type, 'unknown'))
        on conflict (id) do nothing;

        if not found then
            select * into reading_row
            from public.readings
            where id = p_reading_id and user_id = p_user_id;

            return jsonb_build_object(
                'ok', true,
                'duplicate', true,
                'reading_id', p_reading_id,
                'access_status', coalesce(reading_row.access_status, 'locked')
            );
        end if;
    end if;

    select * into reading_row
    from public.readings
    where id = p_reading_id
      and user_id = p_user_id
    for update;

    if not found or reading_row.status <> 'completed' then
        raise exception 'Completed reading not found.';
    end if;

    if reading_row.access_status <> 'locked' then
        return jsonb_build_object(
            'ok', true,
            'already_unlocked', true,
            'reading_id', reading_row.id,
            'access_status', reading_row.access_status
        );
    end if;

    insert into public.payments (
        user_id,
        reading_id,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        amount_total,
        currency,
        status
    ) values (
        p_user_id,
        p_reading_id,
        p_session_id,
        nullif(p_payment_intent_id, ''),
        p_amount_total,
        lower(p_currency),
        'paid'
    )
    on conflict (stripe_checkout_session_id) do update
    set stripe_payment_intent_id = excluded.stripe_payment_intent_id,
        status = 'paid',
        completed_at = now();

    update public.readings
    set access_status = 'paid',
        unlock_source = 'stripe',
        unlocked_at = now()
    where id = p_reading_id
      and user_id = p_user_id;

    return jsonb_build_object(
        'ok', true,
        'reading_id', p_reading_id,
        'access_status', 'paid'
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Server-only function: validate and atomically redeem a complimentary code
-- ---------------------------------------------------------------------------

create or replace function public.redeem_promo_code_admin(
    p_user_id uuid,
    p_reading_id uuid,
    p_code_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    failed_attempts integer;
    reading_row public.readings%rowtype;
    code_row public.promo_codes%rowtype;
begin
    select count(*) into failed_attempts
    from public.promo_code_attempts
    where user_id = p_user_id
      and success = false
      and attempted_at > now() - interval '15 minutes';

    if failed_attempts >= 8 then
        return jsonb_build_object('ok', false, 'code', 'rate_limited');
    end if;

    select * into reading_row
    from public.readings
    where id = p_reading_id
      and user_id = p_user_id
    for update;

    if not found or reading_row.status <> 'completed' then
        insert into public.promo_code_attempts (user_id, success)
        values (p_user_id, false);
        return jsonb_build_object('ok', false, 'code', 'reading_not_found');
    end if;

    if reading_row.access_status <> 'locked' then
        return jsonb_build_object(
            'ok', true,
            'already_unlocked', true,
            'reading_id', reading_row.id,
            'access_status', reading_row.access_status
        );
    end if;

    select * into code_row
    from public.promo_codes
    where code_hash = p_code_hash
      and active = true
      and (expires_at is null or expires_at > now())
      and (max_redemptions is null or times_redeemed < max_redemptions)
    for update;

    if not found then
        insert into public.promo_code_attempts (user_id, success)
        values (p_user_id, false);
        return jsonb_build_object('ok', false, 'code', 'invalid');
    end if;

    if exists (
        select 1
        from public.promo_redemptions
        where promo_code_id = code_row.id
          and user_id = p_user_id
    ) then
        insert into public.promo_code_attempts (user_id, success)
        values (p_user_id, false);
        return jsonb_build_object('ok', false, 'code', 'already_used');
    end if;

    insert into public.promo_redemptions (promo_code_id, user_id, reading_id)
    values (code_row.id, p_user_id, p_reading_id);

    update public.promo_codes
    set times_redeemed = times_redeemed + 1
    where id = code_row.id;

    update public.readings
    set access_status = 'promo',
        unlock_source = 'complimentary_code',
        unlocked_at = now()
    where id = p_reading_id
      and user_id = p_user_id;

    insert into public.promo_code_attempts (user_id, success)
    values (p_user_id, true);

    return jsonb_build_object(
        'ok', true,
        'reading_id', p_reading_id,
        'access_status', 'promo'
    );
end;
$$;

revoke all on function public.grant_paid_reading_access(
    uuid, uuid, text, text, integer, text, text, text
) from public, anon, authenticated;
grant execute on function public.grant_paid_reading_access(
    uuid, uuid, text, text, integer, text, text, text
) to service_role;

revoke all on function public.redeem_promo_code_admin(
    uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.redeem_promo_code_admin(
    uuid, uuid, text
) to service_role;

-- The exact private code requested for the initial friends/demo group is stored
-- only as this SHA-256 hash. It is case-insensitive and can be redeemed by up to
-- 25 different accounts, once per account. Change the limit below whenever needed.
insert into public.promo_codes (
    code_hash,
    label,
    active,
    max_redemptions
) values (
    '8b17a6d3eebf4046f04d745bc2c4db9f6f7acbbeda58623eb851ffbfd35e6d08',
    'Initial friends and demo access',
    true,
    25
)
on conflict (code_hash) do update
set label = excluded.label,
    active = excluded.active,
    max_redemptions = excluded.max_redemptions;

commit;
