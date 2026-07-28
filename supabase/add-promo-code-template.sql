-- Create another private complimentary code.
-- 1. Replace the three values in the settings CTE.
-- 2. Run this in Supabase Dashboard > SQL Editor.
-- 3. Do not save the edited plaintext code in a public GitHub repository.
-- Codes are case-insensitive but may contain punctuation such as !, ?, _ or #.

with settings as (
    select
        lower(btrim('REPLACE_WITH_A_PRIVATE_CODE')) as private_code,
        'Friends access code'::text as label,
        10::integer as maximum_uses
)
insert into public.promo_codes (
    code_hash,
    label,
    active,
    max_redemptions
)
select
    encode(digest(private_code, 'sha256'), 'hex'),
    label,
    true,
    maximum_uses
from settings
where private_code <> 'replace_with_a_private_code'
on conflict (code_hash) do update
set label = excluded.label,
    active = true,
    max_redemptions = excluded.max_redemptions;

-- View code labels and usage totals without exposing the actual code.
select label, active, times_redeemed, max_redemptions, expires_at, created_at
from public.promo_codes
order by created_at desc;
