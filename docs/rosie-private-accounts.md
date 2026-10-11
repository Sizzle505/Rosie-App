# RosieVerse private accounts and cloud notes

## Architecture

- Existing entertainment pages remain completely public.
- The Notes & Ideas card in **Rosie's Reminders** prompts invited members to sign in. Sign-in is optional elsewhere.
- Vercel functions under `/api/auth/*` and `/api/notes/*` verify the username/PIN, manage HttpOnly cookies, and enforce each note's owner on the server. The browser never receives a Supabase service-role key, PIN hash, or other user's note.
- **Supabase PostgreSQL** is accessed only by the functions through its PostgREST HTTP interface. No additional NPM packages or public sign-up routes are necessary.
- PIN hashes use salted Node scrypt. Six-digit PINs can be selected when creating/resetting an account.
- Five consecutive incorrect PINs lock the account for 15 minutes. Successful authentication resets the counter. A separate persistent username/IP attempt bucket limits repeated guessing.
- Random 256-bit session cookies have a 30-day age and a server-side hashed token, expiration, and revocation. Sessions refresh when fewer than seven days remain. Resetting a PIN or disabling an account revokes existing sessions.
- Supabase tables have row-level security enabled **without browser-role policies**; only the secret service role can access data. API note read/write/delete operations also include the authenticated owner's ID in database queries.

## Initial database setup

1. Create a Supabase project under an account you control and locate its **Project URL** and **service_role secret key**. Do not use the public anon/publishable key as the service-role credential.
2. In the Supabase SQL editor, execute `database/rosieverse.sql` once. This creates users, sessions, notes, lockout functions, throttling, indexes, and RLS restrictions.
3. Add the following encrypted **server-only** environment variables to Vercel's project `rosie-app-git` for **Preview** and **Production** (and Development if needed):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Do **not** prefix either with `VITE_`; never expose the service-role key to browser code. Redeploy the preview so the serverless functions receive the variables.
5. Run the admin script on a trusted computer with those two variables set in the shell's environment. Do not paste their values into tickets, commit messages, screenshots, or logs.
6. Create **two different accounts** and run manual live multiuser verification before approving any production merge.

### Account administration

The administrator manages invited users from the terminal, not from a public web endpoint. Usernames are normalized to lower case; permitted characters are ASCII letters, numbers, dot, underscore, and hyphen.

```sh
node scripts/rosie-admin.mjs create rosefan "Rose Fan"
node scripts/rosie-admin.mjs create guesttwo "Guest Two"
node scripts/rosie-admin.mjs reset rosefan
node scripts/rosie-admin.mjs unlock rosefan
node scripts/rosie-admin.mjs disable guesttwo
node scripts/rosie-admin.mjs enable guesttwo
```

Creating or resetting a PIN prompts for a **hidden** four- or six-digit number in an interactive terminal. Never put a PIN on the command line. `reset` and `disable` also invalidate prior sessions. `unlock` clears the failed-PIN counter and the lockout expiration. No emails, registration, or password recovery service exist.

### Endpoints

| Endpoint | Method | Behavior |
| --- | --- | --- |
| `/api/auth/login` | POST | Username, PIN; checks account/lockout/throttle and sets session cookie |
| `/api/auth/session` | GET | Returns current account identity or `user: null`, renews near expiration |
| `/api/auth/logout` | POST | Revokes current session and clears cookie |
| `/api/notes` | GET | Lists notes of the signed-in user |
| `/api/notes` | POST | Creates note for the signed-in user |
| `/api/notes/{uuid}` | PATCH | Updates user's note, returns 404 for other users' notes |
| `/api/notes/{uuid}` | DELETE | Deletes user's note, returns 404 for other users' notes |

Only same-origin unsafe browser requests are accepted. All requests use no-store responses. After five incorrect PINs, the API returns status 423 and a server-calculated `retryAfter` in seconds. App shows a live cooldown.

### Existing organizer data

**Only Notes & Ideas is cloud-saved at this stage.** Tasks, shopping, appointments, goals, and gratitude remain on the current device in the existing `rosieverse.reminders.v1` localStorage document, and their current workflows are unchanged. Historical **device-only notes** are left untouched in that document and any exported backup; they are **not automatically uploaded** to a newly signed-in account. The old device-only notes are intentionally no longer rendered in the private note editor. Migrate selectively later rather than silently copying shared-device data into the wrong account.

Draft edits to a signed-in note are debounced by 700 ms; the editor has Saving, Saved and Save Failed statuses. Unconfirmed drafts are kept per user and note in sessionStorage and restored/retried on reopening within the browser session. A before-unload guard runs if there is unsaved work; pending edits are flushed with keepalive requests when switching views. A saved status is displayed only after the API confirms the write.

## Tests and preview

`node --test tests/private-api.test.mjs` tests salted hash verification, four/six digit PINs, five failed attempts/lockout, cookie session validation, sign-out revocation, and two independently authenticated users. It uses a mocked Supabase REST interface, not a live Postgres instance. It verifies both cross-user API filtering and direct PATCH/DELETE access to another user's UUID; the live database and mobile browser must still be tested manually.

`npm ci && npm run build` verifies compatibility with the existing Vite 7 / React 19 app. The GitHub `rosie-private-ci` workflow runs these checks on this feature branch.

### Manual release gate (with configured database)

1. Admin-create users `rosefan` (4-digit PIN) and `guesttwo` (6-digit PIN). Log in from separate browser profiles and iPhone Safari.
2. Confirm session persistence after refresh, Safari exit/reopen, and a Home Screen launch. Confirm account sign-out, disabled-account session invalidation, PIN resets, and manual unlock.
3. Attempt five wrong PINs, check countdown, then correct PIN during lockout (must fail). After 15 minutes or admin unlock, correct PIN must succeed.
4. Create/edit/delete A's note; from B's session attempt `GET /api/notes`, `PATCH /api/notes/{A-id}` and `DELETE /api/notes/{A-id}`. B should see none of A's notes and direct requests should yield 404.
5. Type notes, wait for Saved, refresh, reopen on another device, and verify persistence. Simulate offline edits to verify Save Failed / restored pending drafts.
6. Verify Fortune, Cheese, Captain, Randomizers, Vault and Home remain accessible while signed out; inspect 320, 375, 390 px mobile and desktop with reduced motion.

Do not merge to `main` or enable production until **live Supabase** and **two-account end-to-end tests** have passed, including iPhone Safari keyboard/safe-area screenshots.

## Operational notes

- All Supabase credentials must be granted only to trusted Vercel server functions and administrator machines; rotate credentials if exposed.
- Temporary throttling rows and expired sessions may be periodically pruned from Supabase (e.g., older than 30 days) after operational usage grows; this is not necessary for a tiny invited audience.
- Do not rely on the application as a confidential-document vault: four-digit PINs are convenient, not suitable for high-value records.
