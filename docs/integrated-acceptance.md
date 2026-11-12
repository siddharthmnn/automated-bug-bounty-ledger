# Integrated acceptance and demo evidence

This document separates automated HTTP evidence from manual browser evidence. The CI smoke test starts the production Next.js server and uses cookie-backed HTTP requests. It verifies rendered page responses and role redirects, but it is not a real browser automation run and does not validate visual layout, keyboard behavior or screenshots.

## Automated acceptance (CI)

The CI workflow runs `scripts/smoke-http.sh` after building the production app and preparing isolated MySQL/Qdrant test resources. The script:

1. Checks public login and registration pages, unauthenticated page redirects, API authentication and invalid-login validation.
2. Registers two synthetic researchers and signs in both plus a synthetic administrator using real session cookies.
3. Loads researcher dashboard, reports, submit and programs pages; loads admin dashboard, reports, analytics, patches and payouts pages.
4. Checks that researcher sessions redirect away from admin pages and admin sessions redirect away from researcher pages.
5. Submits a synthetic report, checks role boundaries, accepts it, records and verifies a patch, creates and completes an INR payout.
6. Confirms the report and completed payout are visible to the owning researcher, absent from the second researcher, and represented in admin analytics.

All test identities and report content are synthetic. The script creates its admin and researcher records in the isolated CI test database. It must not be run against production data.

## Manual browser acceptance

Run this against the exact commit intended for the demo, with the local services and app configured as described in the README.

### Setup

```bash
npm ci
cp .env.example .env
# Set strong local secrets and configure the four MySQL application accounts.
docker compose up -d
npm run db:reset
npm run db:users
npm run qdrant:init
npm run vector:backfill
npm run dev
```

Open `http://localhost:3000`. Use synthetic demo data only. Do not capture private disclosures, real credentials, or real payout information.

### Researcher journey

- [ ] Open registration and create a synthetic researcher.
- [ ] Sign in; confirm the researcher dashboard loads.
- [ ] Open active programs and choose an active program.
- [ ] Submit a report with a title, description, severity and CVSS score.
- [ ] Confirm redirect to report detail and presence in the report list.
- [ ] Open report detail and verify the visible status/history.
- [ ] Attempt to open an admin URL; confirm redirect to the researcher home.
- [ ] Sign out; confirm protected pages redirect to sign-in.

### Admin journey

- [ ] Sign in with a synthetic admin account.
- [ ] Confirm dashboard metrics and report queue load.
- [ ] Open a submitted report and triage it to an allowed state.
- [ ] Accept a report and create a patch record.
- [ ] Verify the patch.
- [ ] Create and complete a payout in one currency (for example INR).
- [ ] Confirm admin analytics displays payout totals grouped by currency.
- [ ] Attempt to open a researcher-only URL; confirm redirect to the admin home.
- [ ] Sign out and confirm protected pages redirect to sign-in.

### Cross-user and security checks

- [ ] Sign in as a second researcher and confirm the first researcher's report/payout is not visible.
- [ ] Confirm researcher sessions cannot access admin triage, patch, payout or analytics actions.
- [ ] Confirm anonymous sessions cannot access either role's protected pages.
- [ ] Confirm logout revokes the active session.

### Responsive and accessibility checks

- [ ] At 360px, 768px and 1440px, check the dashboard, report list, report form and admin queue for clipping or unintended horizontal page overflow.
- [ ] Complete sign-in, registration and report submission using only the keyboard.
- [ ] Confirm visible focus, logical focus order, form labels and readable validation/status messages.
- [ ] Check reduced-motion preference and screen-reader labels for primary navigation and form feedback.

### Evidence record

Record the commit SHA, browser/version, viewport sizes, test account roles (not passwords), outcome and any defect. Store screenshots under a local ignored directory such as `artifacts/acceptance/`; review them for secrets and personal data before sharing. Capture at least the researcher dashboard, submitted report detail, admin report triage and completed payout/analytics view.

| Evidence | Status in this PR |
| --- | --- |
| Production HTTP flow and rendered page smoke checks | Passed in CI run 43145310667 (run #65) |
| MySQL/Qdrant integration and ownership checks | Passed in CI run 43123609099 (run #63) |
| Real browser interaction and viewport checks | Requires a human browser run |
| Screenshots from the real running application | Not captured by this GitHub-only workflow |
| Remaining limitations | Record after the manual run; do not mark the demo fully accepted until completed |

## Known boundaries

- The automated smoke script uses HTTP requests against the production server; it does not execute a browser engine.
- No Playwright/WebDriver dependency is currently declared in the project. This PR deliberately avoids introducing an unpinned browser toolchain without being able to regenerate and verify the npm lockfile.
- A passing CI run demonstrates the scripted routes and data workflow only. It does not establish visual correctness, keyboard accessibility or production deployment readiness.
