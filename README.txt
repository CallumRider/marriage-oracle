MARRIAGE ORACLE — PAYMENT + LOGIN UX FIX
==========================================

Overwrite these four files:

index.html
assets/css/style.css
assets/js/auth.js
assets/js/payments.js

Keep all other files, including assets/js/supabase-config.js, unchanged.

WHAT THIS FIXES
---------------
1. Restores the legal purchase acknowledgement that was accidentally removed
   by the previous mobile-actions index.html.
2. Keeps the payment button clickable before acknowledgement, so clicking it
   gives a visible instruction instead of appearing to do nothing.
3. Shows checkout errors immediately beside the £0.99 button.
4. Shows the sign-in requirement on the sign-in screen immediately, rather
   than leaving it hidden on the results page.
5. Preserves an entered complimentary code while the user signs in.
6. Keeps Continue as Guest and Start a New Reading reliable on phones.
7. Opens a new account reading immediately while Supabase saves in the
   background.
8. Uses cache version 20260731-payment-login-ux-v2 so phones fetch the repaired scripts.

After pushing to GitHub Pages, close the browser tab completely and reopen
https://themarriageoracle.com/ .
