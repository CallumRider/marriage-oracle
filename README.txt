THE MARRIAGE ORACLE — LAUNCH LEGAL & CONSENT PACK
===================================================
Prepared: 30 July 2026

IMPORTANT
---------
This is a carefully drafted, plain-English launch pack based on current UK guidance,
but it is not a substitute for advice from a qualified solicitor, accountant, tax
adviser, or data-protection professional. Because the operator is under 18, Samantha
Harding should review and approve the public business details and policies before launch.

PUBLIC DETAILS USED
-------------------
Operator: Callum Rider
Legal guardian: Samantha Harding
Support email: marrigeoraclecustomerservice@gmail.com
Correspondence address: 86 Kings Acre, Coggeshall, United Kingdom

PLEASE ADD THE FULL POSTCODE before public launch. Do not guess it. Edit the address in:
- index.html
- privacy.html
- terms.html
- refunds.html
- cookies.html

Remember: this correspondence address will be publicly visible on the website.

FILES TO OVERWRITE
------------------
index.html
assets/css/style.css
assets/js/auth.js
assets/js/payments.js

FILES TO ADD
------------
privacy.html
terms.html
refunds.html
cookies.html
assets/js/legal.js

SUPABASE FUNCTION TO UPDATE
---------------------------
supabase/functions/create-checkout-session/index.ts

In Supabase:
1. Edge Functions -> create-checkout-session -> Edit function.
2. Replace all code with the supplied index.ts.
3. Keep Verify JWT OFF, matching the working payment setup.
4. Deploy updates.

WHAT THIS UPDATE ADDS
---------------------
- Public Privacy Notice, Terms, Refund Policy, and Storage/Cookies Policy.
- Public operator, guardian, support email, and correspondence details.
- Adult-only confirmation before account creation and before readings.
- Explicit consent for optional identity, partner-preference, portrait-background,
  and beliefs/traditions answers.
- A clear purchase summary: one-off £0.99, no subscription, permanent access.
- A required immediate-access/cancellation acknowledgement before Stripe checkout.
- A clearer “Pay £0.99 & Unlock Reading” button.
- Consent-version metadata on Stripe Checkout.
- Stripe receipt email to the signed-in account email in live mode.
- Additional checkout text explaining one-off payment and digital access.

RECOMMENDED REPLACEMENT ORDER
-----------------------------
1. Back up the current live project.
2. Replace/add the website files listed above.
3. Commit and push the website to GitHub Pages.
4. Redeploy create-checkout-session with the supplied code.
5. Wait for GitHub Pages to finish deploying.
6. Open https://callumrider.github.io/marriage-oracle/ and press Ctrl + F5.

LIVE TEST CHECKLIST
-------------------
[ ] Footer links open all four policy pages.
[ ] Customer-service email link opens the correct Gmail address.
[ ] The full correspondence address includes the postcode.
[ ] A reading cannot begin until both reading consent boxes are ticked.
[ ] A new account cannot be created until the account Terms/age box is ticked.
[ ] The payment button is disabled until immediate-access consent is ticked.
[ ] Stripe Checkout opens and displays “one-off payment / no subscription” text.
[ ] A live £0.99 payment returns correctly and permanently unlocks the reading.
[ ] The customer receives a Stripe receipt at the account email.
[ ] A complimentary code still unlocks without requiring payment consent.
[ ] Refreshing/reopening keeps paid and promo readings unlocked.
[ ] Account deletion still works with a disposable test account.
[ ] Mobile layouts are checked at 320px, 390px, 768px, and desktop width.

STRIPE PUBLIC DETAILS
---------------------
In Stripe, review Branding and Public details. Make sure the customer-facing business
name, support email, website address, and statement descriptor are understandable.
The receipt should make clear that the purchase is one Marriage Oracle digital reading.

REVIEW WHEN THINGS CHANGE
-------------------------
Update the policy dates and wording before adding analytics, advertising, newsletters,
new payment methods, new providers, new data uses, or services for under-18s.
