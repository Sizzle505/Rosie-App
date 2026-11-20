# Runtime isolation and release blockers

Read-only findings from `Sizzle505/Rosie-App`, main branch, November 19, 2026. These are **future pilot requirements**, not changes to the flagship app.

| Severity | Evidence in current RosieVerse code | Isolation requirement before using a pet-specific site |
|---|---|---|
| BLOCKER | `api/_lib/core.js`: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`; tables `rosie_users`, `rosie_sessions`, `rosie_notes` | Do not reuse flagship database credentials. Disable account and cloud notes on the pilot until a separate environment and schema are deployed. |
| BLOCKER | `api/secret-santa.js`: table `rosie_santa_exchanges`, shared functions and notifications | Disable all Secret Santa backend operations for the pilot until data separation is verified. A newly branded UI cannot be assumed to have isolated exchange records. |
| BLOCKER | `api/_lib/secretSantaMail.js`: `ROSIE_GMAIL_ADDRESS`, `ROSIE_GMAIL_APP_PASSWORD`, default sender `RosieVerse750@gmail.com` | Never copy the production Gmail credentials to a pet site. Disable sending until the destination sender is deliberately configured and confirmed. |
| HIGH | `src/private/AccountContext.jsx`: hardcoded `/api/auth` paths; `api/_lib/core.js`: cookie `rosie_session` | Separate domains/projects and backend sessions; do not import Rosie cookies or use Rosie auth API. |
| HIGH | `src/main.jsx`: Fortune, Cheese and landing text use Rosie names and hardcoded asset paths | Pilot must resolve pet name, titles and images without editing RosieVerse's originals. Test every visible name before publishing. |
| HIGH | `src/RosieSecretSanta.jsx`: stored invitation tokens in `rosie-secret-santa-links-v1` | Do not copy/localStorage-migrate personal exchange tokens or links from Rosie. New domain keeps browser storage separate. |
| HIGH | `src/RosieReminders.jsx` and `src/RosieTimekeeper.jsx`: Rosie-namespaced browser storage | Tenant-specific storage keys are preferable; never point the pilot at the flagship origin. |
| HIGH | Production Vercel project `Apex/rosie-app-git` and GitHub `main` | Pilot must use an entirely separate Vercel project and domain and must never import production secrets. |
| MEDIUM | QR, review, recipe, fortune and calculator pages include baked-in illustration/wordmark text | Inspect each image for legacy name or dog silhouette; replace only proven pet-specific art. |
| MEDIUM | Existing Captain and Card Vault in main app navigation | Pet edition should hide both routes and all links in its isolated runtime, not just hide a button; do not patch flagship navigation. |
| MEDIUM | Existing public image directories include >1,000 entries | Reuse licensed generic scenery and UI, publish only approved pet-specific derivatives. |
| LOW | Existing page layouts are finely tuned for Rosie's proportions | Test long snouts, floppy ears, body width and mobile cropping with real pet photographs. |

## Non-negotiable pilot defaults
- **Accounts, registration, cloud notes, Secret Santa persistence and outgoing email disabled until separately provisioned.**
- No production API URLs, auth secrets, Supabase database, or Gmail credentials.
- No writes to `main`, no production aliases or custom domain changes.
- No user-uploaded private photos committed to public GitHub.
- Independent test URL and explicit approval prior to public sharing.
- Test route access (not just visible navigation); excluded Captain/Card Vault routes must not be reachable.
- Capture a before/after RosieVerse visual baseline on desktop and iPhone and confirm the main production commit stays unchanged.

## Decision once photos arrive
Generate the canonical dog first, then prioritize Home, Fortune, and Cheese. Only when the pilot layout is visually acceptable should the remaining pages be batch-produced. A separate pet deployment/asset resolver is still to be engineered and tested. The files in `pet-template-lab/` do not change running behavior.
