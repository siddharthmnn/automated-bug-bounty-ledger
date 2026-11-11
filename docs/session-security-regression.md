# Session security and ownership regression matrix

This document records the security properties covered by the automated unit and database tests.
It is not a substitute for a manual browser test or a production security assessment.

## Session lifecycle

| Boundary | Automated coverage | Expected behaviour |
| --- | --- | --- |
| Token generation | `tests/unit/session-security.test.ts` | 32 random bytes encoded as an opaque base64url token |
| Token persistence | `tests/unit/session-security.test.ts` | Only the SHA-256 digest is stored in MySQL |
| Session lookup | `tests/unit/session-security.test.ts` | Lookup requires an unrevoked, unexpired session and an active account |
| Expired / revoked / unknown token | `tests/unit/session-security.test.ts` | No authenticated identity is returned |
| Cookie attributes | `tests/unit/session-security.test.ts` | HttpOnly, SameSite=Lax, root path, Secure in production |
| Logout | `tests/unit/session-security.test.ts` | Server-side token revocation and browser cookie deletion |
| Missing cookie on logout | `tests/unit/session-security.test.ts` | Idempotent logout; no database mutation |
| Anonymous API request | `tests/unit/auth-guard.test.ts` | HTTP 401 / UNAUTHENTICATED |
| Wrong role | `tests/unit/auth-guard.test.ts` | HTTP 403 / FORBIDDEN |
| Anonymous page request | `tests/unit/auth-guard.test.ts` | Redirect to login |
| Wrong-role page request | `tests/unit/auth-guard.test.ts` | Redirect to the authenticated role's home |

## Researcher ownership

The ownership boundary is enforced inside MySQL DEFINER procedures using the authenticated
application user ID. Application route tests alone cannot prove this database boundary, so
`tests/db/ownership-isolation.test.ts` exercises the procedures against the isolated test database.

- Researcher A sees A's reports and payout records.
- Researcher B does not see A's report or payout identifiers in collection results.
- B cannot open A's report detail.
- B cannot update or withdraw A's report.
- A can still read the report after B's rejected mutation attempts.
- A nonexistent user ID receives empty report and payout collections.

## Run locally

Use the dedicated test database and test Qdrant collection configured by `.env`:

```bash
npm ci
npm test
npm run test:db
```

`npm run test:db` resets only `MYSQL_TEST_DATABASE` and initializes the dedicated
`vulnerability_reports_test` Qdrant collection. Confirm those variables point to disposable
test resources before running it. Do not run database reset scripts against development or
production data.

## Manual browser acceptance still required

- Log in as two distinct synthetic researcher accounts in separate browser profiles.
- Copy a report URL from account A into account B's session; verify the UI does not disclose it.
- Log out, then revisit dashboard, reports, payouts and report-detail URLs.
- Confirm the browser no longer sends an active session cookie after logout.
- Repeat at mobile, tablet and desktop widths.
- Record browser/version, test account fixture, result and screenshots in the project acceptance log.

Automated checks establish the code-level contracts above. They do not claim that these manual
browser checks have been executed.
