# RosieVerse optional accounts (October 14, 2026)

## UX rules

- Keep every game, tool, and Reminders available without authentication.
- A small **icon-only** account button in the upper-right opens a dismissible account panel; do not display unsolicited sign-in dialogs, banners or redirects.
- Panel supports **Sign In**, **Create Account**, **Sign Out**. No email address or verification. Four-digit PIN is the default; six-digit PIN is an option at account creation.
- Five consecutive incorrect PIN attempts lock for 15 minutes. Successful login sets renewable 30-day HttpOnly session cookie.
- A signed-out visitor uses the existing local Notes & Ideas. An authenticated visitor uses private cloud Notes & Ideas; device-local notes are preserved rather than automatically uploaded or erased.
- The other Reminders sections (shopping, tasks, appointments, goals/gratitude) and recipe favorites remain local-only.
- Self-service registration is limited to 40 accounts and throttled. It does not require invite codes; if invite-only registration becomes necessary, gate the registration endpoint, not the public app.
- PINs are scrypt hashed server-side. Only Vercel serverless handlers hold the Supabase secret key. Do not expose it to Vite/browser code.
- Supabase RosieVerse database already exists and contains four RLS-protected tables. Do not rerun migrations.
- Local note import/export remains unchanged; sync of legacy local notes into accounts is deliberately not automatic.

## Deployment

Feature branch: `work/opt-in-account-pin-cloud-notes-20261014`. Copy/move both Vercel Preview environment variables, `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, from the previous account feature branch to this branch without exposing their values. Do not enable the feature on production until two-user live tests succeed.

Verify `npm ci && npm run build`; `node --test tests/private-api.test.mjs`; test create account -> reload -> login -> wrong PIN lock -> logout -> account isolation; iPhone Safari keyboard/open-close behavior; gameplay while signed out. Production main remains untouched.

- Usernames are matched case-insensitively; the display name retains the exact capitalization entered on account creation (e.g., `MyName` -> stored username `myname`, display `MyName`). Existing accounts retain their stored display name.
