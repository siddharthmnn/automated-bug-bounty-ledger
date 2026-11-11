# Phase 2 architecture and validation notes

## System boundary

- Next.js 16 App Router provides admin/researcher interfaces and API routes.
- MySQL is authoritative for accounts, companies, programs, reports, patch records, payouts and workflow history.
- Stored procedures own sensitive researcher-scoped and lifecycle transitions. Application roles receive narrowly scoped grants.
- Qdrant stores report embeddings and filterable metadata for semantic duplicate discovery. It is a derived index, not a source of truth.
- The MySQL outbox records synchronization work. Reconciliation compares MySQL state with Qdrant payloads and queues missing, stale or orphaned points.

## Request and data flow

1. A researcher authenticates and receives a server-side session. Only a token hash is persisted in MySQL.
2. Researcher report commands call DEFINER procedures with the authenticated application user ID. Procedures enforce ownership and state transitions.
3. MySQL triggers maintain history and guard patch/payout lifecycle conditions.
4. Vector sync jobs are processed asynchronously. Embedding text is derived from report title and description; Qdrant payloads carry IDs, workflow metadata, text hash and model name.
5. Semantic search filters candidates by relational metadata. Final report records are read from MySQL.
6. Admin actions review reports, verify patches and record payout state through the privileged application path.
7. Analytics group and rank monetary totals per currency. Values in different currencies are never combined without an explicit FX policy.

## Local setup and validation

~~~bash
cp .env.example .env
# Replace every change-me value with a local secret.
npm ci
docker compose up -d
npm run db:reset
npm run db:users
npm run qdrant:init
npm run vector:backfill
npm run vector:reconcile
npm run vector:sync
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
~~~

The reset and test-reset commands are destructive. They drop and recreate only the configured development or dedicated test database. Never point them at production.

## Key design decisions

| Decision | Rationale |
| --- | --- |
| MySQL source of truth + Qdrant derived index | Relational integrity and transactions remain authoritative; vector search is auxiliary retrieval. |
| 384-dimensional local MiniLM embeddings | Local inference without a paid hosted embedding API. |
| SHA-256 embedding-text hash + model name | Detects content/model drift without re-embedding unchanged text. |
| MySQL outbox + reconciliation | Makes async sync retryable and repairs missed events, stale metadata and orphaned points. |
| Currency-partitioned analytics | Avoids misleading totals across currencies. |
| Role-specific database accounts | Separates auth, admin, researcher and vector-sync privileges. |

## Viva demonstration sequence

1. Sign in as admin and inspect company/program setup.
2. Sign in as researcher, browse an active program and submit a report.
3. Return to admin and triage the report.
4. Demonstrate duplicate candidate search and explain Qdrant metadata filters.
5. Verify the patch and create/complete the payout record.
6. Sign in as researcher and show only the current researcher's reports and payouts.
7. Open SQL analytics and explain JOIN, anti-join, correlated subquery, CTE, window function and recursive CTE examples.
8. Show role grants, stored procedures/triggers, vector outbox and reconciliation commands.

## Validation evidence to capture before submission

- Fresh migration and seed output from MySQL 8.4.
- SHOW GRANTS for all four application accounts and negative privilege probes.
- Unit and integration test summaries.
- Qdrant collection configuration, point count, payload indexes and reconciliation output.
- EXPLAIN output for representative full-text, report-list and analytics queries.
- Screenshots of both role dashboards and report → review → patch → payout.
- GitHub Actions run URL and final PR review/merge state.
