# Researcher journey acceptance checklist

This checklist is the manual companion to the automated researcher API contract tests in
`tests/unit/researcher-api.test.ts`. It is intentionally evidence-driven: mark a case complete
only after running it against the application, and record the browser, viewport, account fixture,
result and any issue raised.

## Test environment

- Use a disposable local/test database populated through the repository's documented seed flow.
- Use synthetic researcher accounts and synthetic vulnerability reports only.
- Do not use production credentials, real vulnerability disclosures or real payout information.
- Start from a clean browser profile so stale cookies do not affect authentication results.
- Never run `npm run db:reset` against a database containing data that must be retained.

## Researcher journey

| ID | Scenario | Expected result | Evidence |
| --- | --- | --- | --- |
| R-01 | Open researcher routes without a session | Redirect to login; no protected data rendered | Screenshot / route |
| R-02 | Register with valid details | Account created; no password or token returned | HTTP status + UI |
| R-03 | Register with invalid or duplicate e-mail | Safe validation/conflict message; no stack or SQL details | HTTP status + UI |
| R-04 | Log in with valid credentials | HttpOnly session cookie issued; researcher lands on researcher home | Cookie flags + screenshot |
| R-05 | Log in with invalid credentials | Generic authentication failure; no account enumeration | HTTP status + UI |
| R-06 | Refresh researcher dashboard | Data reloads for the active account | Screenshot |
| R-07 | Browse active programs and open a program | Only public/active program information is shown | Screenshot + response |
| R-08 | Submit a valid vulnerability report | Report is created and appears in the researcher's report list | Report ID + screenshot |
| R-09 | Submit malformed report data | 400 response with a safe, actionable validation message | HTTP response |
| R-10 | Open report detail and status history | Only the owner's report and history are visible | Screenshot + response |
| R-11 | Edit an editable report | Updated fields persist; invalid transitions are rejected safely | Before/after |
| R-12 | Withdraw an eligible report | Report is withdrawn and no longer appears as active work | Screenshot + response |
| R-13 | View payout history | Only the researcher's own payout records and currencies are shown | Screenshot + response |
| R-14 | Log out and revisit protected routes | Session is revoked and protected routes require login | Cookie + route result |

## Authorization and isolation

Use two distinct synthetic researcher accounts, A and B, with at least one report and payout
associated with each account.

- Authenticate as A and verify A can list and open A's records.
- Attempt to open B's report by substituting its numeric identifier in detail, history, update
  and withdrawal requests. The application must return the same safe not-found behavior used for
  inaccessible records; it must not disclose B's title, history, status or payout.
- Verify collection endpoints never accept a client-supplied researcher/user identifier as an
  authority for data selection.
- Verify a researcher cannot call admin-only report listing or mutation endpoints.
- Verify an admin session is not silently treated as a researcher session for researcher-only
  write endpoints.
- Repeat protected requests after logout and after the session expiry boundary where practical.

## Responsive and accessibility pass

Run the same core dashboard, program list, report detail and submission views at these viewport
sizes:

- Mobile: 375 × 812
- Tablet: 768 × 1024
- Desktop: 1440 × 900

Check keyboard-only navigation, visible focus, meaningful form labels, heading order, error
association with fields, status text that does not rely on color alone, and horizontal overflow.
Record any browser-specific limitation instead of marking an untested case complete.

## Automated coverage

Run the checks from the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

The API contract suite verifies that researcher collection/detail/write routes pass the
authenticated session identity into researcher-scoped services, malformed identifiers and
payloads are rejected, unauthenticated requests stop before service access, and admin-only
duplicate-chain data is not included in researcher history responses.

Database-backed ownership isolation and browser interaction still require the test database and
a real browser run. Passing the unit suite alone is not evidence that those manual cases passed.

## Evidence log

For each executed case, record:

| Field | Value |
| --- | --- |
| Date / tester | |
| Commit / branch | |
| Browser + version | |
| Viewport | |
| Synthetic account fixture | |
| Cases executed | |
| Passed / failed | |
| Issue links | |
| Screenshots / logs location | |
