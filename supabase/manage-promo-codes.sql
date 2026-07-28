-- Useful complimentary-code administration queries.
-- Run only the statement you need.

-- 1. List labels and usage totals (the plaintext codes cannot be recovered).
select id, label, active, times_redeemed, max_redemptions, expires_at, created_at
from public.promo_codes
order by created_at desc;

-- 2. Disable a code by its label.
-- update public.promo_codes
-- set active = false
-- where label = 'Friends access code';

-- 3. Change the maximum number of accounts allowed to use a code.
-- The new limit cannot be lower than times_redeemed.
-- update public.promo_codes
-- set max_redemptions = 25
-- where label = 'Friends access code';

-- 4. Add an expiry date.
-- update public.promo_codes
-- set expires_at = '2026-12-31 23:59:59+00'
-- where label = 'Friends access code';

-- 5. See which accounts redeemed codes. This shows account IDs, not emails.
select
    pc.label,
    pr.user_id,
    pr.reading_id,
    pr.redeemed_at
from public.promo_redemptions pr
join public.promo_codes pc on pc.id = pr.promo_code_id
order by pr.redeemed_at desc;
