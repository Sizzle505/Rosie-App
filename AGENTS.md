# Rosie App - Agent Operating Rules

These rules apply to all work on this repository, especially ChatGPT Work / coding-agent sessions.

## 1. Connector-first authentication is mandatory

For any task involving GitHub or Vercel, treat the authenticated ChatGPT connectors as the canonical authentication layer.

Before diagnosing an authentication problem, requesting login, or concluding that an account is disconnected:

1. Check GitHub through the GitHub connector.
   - Confirm the authenticated login with `get_user_login`.
   - Expected account: `Sizzle505`.
   - Confirm access to `Sizzle505/Rosie-App` with a connector read operation.

2. Check Vercel through the Vercel connector.
   - Use `get_git_deployment_context`.
   - Expected team: `Apex`.
   - Expected project: `rosie-app-git`.
   - Expected Git link: `Sizzle505/Rosie-App`.

If those connector checks succeed, the services are authenticated for the task. Proceed with the work.

## 2. Never confuse browser/CLI login state with connector authentication

The following are NOT valid evidence that the ChatGPT GitHub or Vercel connector is unauthenticated:

- GitHub.com showing a Sign in button in the Work cloud browser.
- Vercel.com redirecting the Work cloud browser to login.
- Local Git author name/email.
- `gh auth status` or absence of GitHub CLI credentials.
- `vercel whoami` or absence of Vercel CLI credentials.
- A fresh cloud-browser cookie jar.

Browser sessions, CLI credentials, local Git identity, and ChatGPT connectors are separate authentication layers.

Do not tell the user that GitHub or Vercel is unauthenticated unless the corresponding connector itself returns an authentication/authorization failure.

## 3. Prefer connector operations for remote work

Use the GitHub connector for repository reads/writes, branch operations, commits, pull requests, and remote verification whenever the required operation is available.

Use the Vercel connector for project lookup, deployment creation/inspection, logs, deployment verification, and other supported Vercel operations.

Do not fall back to public-web inspection merely because the cloud browser or CLI is signed out.

Use browser or CLI authentication only when a required operation genuinely is not available through the connectors.

## 4. Do not request redundant reauthentication

GitHub and Vercel are intentionally configured for broad ChatGPT access.

Do not ask the user to reconnect, sign in again, or grant access merely because a browser/CLI session is missing.

Only request user intervention when:
- the connector itself returns a genuine authentication/authorization error; and
- retrying the connector does not resolve it.

If that happens, state exactly which connector call failed and the returned error. Do not generalize from a browser login screen.

## 5. Verify remote state before claiming success

Never claim that code was pushed, merged, or deployed solely from local working-tree state.

For GitHub changes, verify the relevant remote branch/commit through the GitHub connector.

For Vercel changes, verify the relevant project/deployment through the Vercel connector.

## 6. New-session preflight

At the start of any new development session that will touch GitHub or Vercel, perform a quick connector preflight before substantive work:

- GitHub: authenticated login is `Sizzle505` and `Sizzle505/Rosie-App` is accessible.
- Vercel: team `Apex` and project `rosie-app-git` are visible and linked to `Sizzle505/Rosie-App`.

This preflight should be silent unless something actually fails.

A signed-out Work browser is not a failed preflight.
