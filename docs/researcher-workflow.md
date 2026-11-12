# Researcher workflow

This guide describes the researcher experience implemented by the current application. It covers account creation, authentication, report submission and tracking. The application is a disclosure-workflow ledger; it does not deploy patches to a target system.

## 1. Start the local application

Use Node.js 22.12 or newer, npm, Docker Engine and Docker Compose.

```bash
cp .env.example .env
# Replace the root password and each app-account password with distinct generated hex secrets.
openssl rand -hex 32
npm ci
docker compose up -d
npm run db:reset
npm run db:users
npm run qdrant:init
npm run vector:backfill
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database reset command is destructive: it drops and recreates the configured development database, then applies migrations and seed files. Do not run it against production data. The app's MySQL and Qdrant ports are published on loopback only by the supplied Compose file.

## 2. Create a researcher account

1. Open `/register`, or select **Create an account** from the sign-in page.
2. Enter your full name, e-mail, optional country and password.
3. Use a password with at least 10 characters, including a letter and a digit. The server validates the registration payload as well.
4. Submit the form. On success, the page confirms account creation and provides a sign-in link.
5. Open `/login` and sign in with the new credentials.

Registration creates the researcher and login records through the `sp_register_researcher` database procedure. Registration does not automatically sign the new user in. Sessions are stored server-side; only a hash of the opaque session token is persisted, and the browser cookie is HttpOnly.

## 3. Submit a vulnerability report

1. Sign in as a researcher. The application routes researcher sessions to `/researcher`.
2. Choose **Submit a report** or open `/researcher/submit`.
3. Select an active program.
4. Enter a concise title (5–150 characters), a description (20–4,000 characters), severity and a CVSS score from 0.0 to 10.0.
5. Submit the report. The application redirects to the new report's detail page when creation succeeds.

Provide enough impact and high-level reproduction detail for triage. Do not include live exploit code, credentials, secrets or unrelated personal data in a report. The authenticated session determines the researcher identity; do not try to submit another researcher's ID.

If no active program is listed, the UI explains that there are currently no active bounty programs. Browse `/researcher/programs` and return when an eligible program is available.

## 4. Track and manage your reports

- `/researcher` shows report counts, recent submissions and completed earnings grouped by currency.
- `/researcher/reports` lists your reports, program, severity, status and payout information.
- Select a report to open its detail page.
- A report may be edited or withdrawn only when its current workflow state permits it; the API enforces the state and ownership rules.
- The reports and payout collections are scoped to the authenticated researcher. A client-supplied owner ID is not an authorization mechanism.

Accepted reports may still need patch creation, verification and payout processing by an administrator. A completed payout appears in the earnings summary under its own currency. INR and USD are never added together.

## 5. Sign out

Use the application's sign-out action. The server revokes the current session and clears the session cookie. Closing a tab is not a substitute for signing out on a shared machine.

## Troubleshooting

| Symptom | Checks / action |
| --- | --- |
| `.env` is missing | Run `cp .env.example .env` from the repository root and fill in the required values. |
| Startup reports missing or invalid environment variables | Check the variable names in `.env.example`; required database usernames/passwords and `MYSQL_DATABASE` must be present. Use distinct hex secrets for the four app accounts. Restart the dev server after changing configuration. |
| MySQL connection refused | Run `docker compose ps`; check the MySQL health status and confirm `MYSQL_HOST=127.0.0.1` and `MYSQL_PORT=3307` unless you deliberately changed the Compose mapping. |
| Access denied for an application database account | After migrations, run `npm run db:users`. Check that the corresponding username/password in `.env` matches the provisioned account. |
| No active programs appear | Confirm the database was seeded and that at least one program has `status='ACTIVE'`. The researcher submit page intentionally does not allow submission without a selectable active program. |
| Sign-in fails | Check the e-mail/password pair and that the account is active. The API deliberately returns a generic credential error rather than disclosing which field was wrong. |
| A report action returns an authorization or state error | Confirm you are signed in with the intended role and that the report is yours. Some actions are state-dependent and cannot be repeated after a transition. |
| Qdrant/vector initialization fails | Confirm the Qdrant container is running and `QDRANT_URL` points to the local REST endpoint. Run `npm run qdrant:init`; use `npm run vector:backfill` to index existing MySQL reports. MySQL remains the source of truth. |
| A test command appears to delete data | `npm run db:reset` rebuilds the configured development database. `npm run test:db` resets only `MYSQL_TEST_DATABASE` and the dedicated test Qdrant collection. Do not run either against production. |

## Useful validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

The repository CI runs lint, typecheck, unit tests, a production build, MySQL/Qdrant integration tests and authenticated HTTP smoke checks. These automated checks do not replace manual browser verification of the current UI.
