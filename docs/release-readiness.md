# Release-readiness audit

This is an implementation audit, not a claim that the application has been deployed or penetration-tested in a production environment.

## Configuration and secrets

- Server configuration is parsed by `src/server/env.ts`. Required MySQL database identity and four role-specific credentials are validated before pools are created.
- Each application database password must be at least 32 hexadecimal characters and unique across the auth, admin, researcher and vector accounts. Generate values with `openssl rand -hex 32`.
- `.env*` is ignored by Git; only `.env.example` is allowlisted. Do not put live secrets in source, issue comments, screenshots or logs.
- `scripts/db-users.sh` independently validates role passwords before provisioning MySQL accounts.
- The CI workflow uses synthetic, deterministic credentials and synthetic database records in an isolated runner. They are not deployment secrets.
- Error reporting from `env()` lists invalid variable names, not supplied values.

## Database and vector service exposure

- The supplied Compose file publishes MySQL on `127.0.0.1:3307` and Qdrant REST/gRPC on `127.0.0.1:6333/6334`. This is a local-development topology.
- Qdrant has no authentication configured in this Compose setup. Do not expose it to an untrusted network. A real deployment must place it on a private network and configure the deployment's supported authentication/TLS controls or a trusted network boundary.
- MySQL is the authoritative store; Qdrant is a derived semantic index. Back up and restore MySQL as the source of truth, then reconcile/rebuild the vector index as required.
- Compose health-checks MySQL. Qdrant does not currently have a Compose health check; startup readiness should be checked before vector initialization/synchronization.

## Destructive database operations

- `npm run db:reset` invokes `scripts/db-reset.sh`, which drops and recreates the selected database.
- The script accepts only `bug_bounty_ledger` and `bug_bounty_ledger_test`, requires a local `.env`, prints the target and now refuses to run when `NODE_ENV=production`.
- `npm run test:db` explicitly targets `MYSQL_TEST_DATABASE` and `vulnerability_reports_test`; it is destructive to those test resources only.
- Never use these reset/test scripts against production. Use a separately reviewed migration and backup/restore process for deployed data.

## Build and runtime assumptions

- Node.js 22.12+ and npm are required by `package.json`.
- `npm run build` produces the Next.js production build; `npm run start` serves it.
- The current Compose file is for local development, not a complete production deployment manifest. No cloud deployment target, TLS termination, secret manager, external backup policy, monitoring/alerting, or disaster-recovery procedure is defined in this repository.
- The embedding model is loaded locally by Transformers.js. A deployment must account for model download/cache availability, filesystem permissions, memory and cold-start costs.
- Session cookies are HttpOnly and SameSite=Lax; Secure is enabled when `NODE_ENV=production`.

## Verification checklist

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

CI additionally runs authenticated HTTP smoke tests against an isolated test database and Qdrant collection. Passing CI is not a substitute for deployment-specific security review, external network testing, backups/restore drills, or live browser acceptance.

| Area | Current result | Remaining before real production |
| --- | --- | --- |
| App DB credentials | Strong, distinct hex credentials validated | Inject from a secret manager; rotate and audit |
| Local service binding | MySQL/Qdrant loopback-only | Private network policy, TLS/auth as appropriate |
| Destructive reset | Database allowlist and production-mode guard | Operational approval/backup process for any deployed migration |
| Production build | Covered by CI | Verify target runtime, model cache and resource limits |
| Observability/recovery | Not configured in repository | Logs/metrics/alerts, backups and restore drill |
| Deployment manifest | Local Compose only | Choose and harden an actual deployment target |
