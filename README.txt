MARRIAGE ORACLE — MOBILE ACCOUNT ACTION FIX

Overwrite these three files:

index.html
assets/js/auth.js
assets/css/style.css

Keep every other file unchanged, especially:
assets/js/supabase-config.js
assets/js/app.js
assets/js/payments.js

What this fixes:
- Continue as Guest now uses a delegated mobile-safe click handler.
- Start a New Reading opens the quiz immediately instead of silently waiting for Supabase.
- A visible message is shown if the quiz module has not loaded.
- New cache versions force phones to download the current CSS and JavaScript.
- The two main action buttons have reliable touch behaviour and full-width mobile hit areas.

After uploading to GitHub Pages, wait for deployment and fully close/reopen the browser tab.
