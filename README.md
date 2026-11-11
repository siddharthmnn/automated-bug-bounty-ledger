# Automated Bug Bounty Vulnerability Patch & Payout Ledger

A centralized platform for vulnerability disclosure workflow: researcher submission, company review, patch verification and bounty payout tracking. It combines a relational ledger with vector-based semantic duplicate discovery.

## Stack

- **Application:** Next.js 16, React 19, TypeScript
- **Relational database:** MySQL 8.4 (authoritative source of truth)
- **Vector database:** Qdrant (derived semantic index)
- **Embeddings:** local Transformers.js Xenova/all-MiniLM-L6-v2 (384 dimensions)
- **Validation/tests:** Zod, Vitest
- **Local infrastructure:** Docker Compose

## Core architecture

MySQL owns users, roles, companies, programs, researchers, vulnerability reports, status history, patches and payouts. Sensitive workflow operations use stored procedures and database constraints/triggers. Role-specific database accounts isolate authentication, administration, researcher access and vector synchronization.

Qdrant stores report vectors and filterable metadata only. The MySQL outbox tracks synchronization jobs; retries and reconciliation repair missing points, stale metadata and orphaned vectors. Report content and financial records remain in MySQL.

Analytics group earnings and payout totals by currency. Values denominated in different currencies are not added or compared without an explicit FX conversion.

## Prerequisites

- Docker Engine / Docker Desktop with Compose
- Node.js 22.12+ and npm

## Quick start

~~~bash
cp .env.example .env
# Set MYSQL_ROOT_PASSWORD to a strong local password. Replace the four app-account passwords with distinct random 32+ character hexadecimal secrets (for example: openssl rand -hex 32).
npm ci
docker compose up -d
npm run db:reset
npm run db:users
npm run qdrant:init
npm run vector:backfill
npm run dev
~~~

The local MySQL port is 3307; Qdrant REST/gRPC ports are 6333/6334. Services are bound to loopback for local development. Never expose the development database or unauthenticated Qdrant endpoint publicly.

**Destructive operation:** npm run db:reset drops and recreates the configured development database and reloads sample data. npm run test:db resets only the dedicated test database and test Qdrant collection. Never point these scripts at production.

## Useful commands

| Command | Purpose |
| --- | --- |
| npm run db:up / npm run db:down | Start / stop local services |
| npm run db:migrate | Apply pending migrations |
| npm run db:reset | Destructively rebuild development DB and seed |
| npm run db:users | Provision least-privilege MySQL users |
| npm run qdrant:init | Create collection and payload indexes |
| npm run vector:backfill | Index existing MySQL reports |
| npm run vector:sync | Process pending outbox jobs |
| npm run vector:reconcile | Compare MySQL and Qdrant state |
| npm run lint / npm run typecheck | Static quality checks |
| npm test / npm run test:db | Unit / DB-backed integration tests |
| npm run build | Production build |

## Documentation

- docs/phase2-architecture.md — architecture, design decisions and viva sequence
- database/migrations/ — ordered SQL migrations
- src/server/vector/ — vector synchronization implementation
- src/server/services/analytics-catalogue-a.ts — SQL analytics catalogue

## Demo flow

Admin manages companies/programs and triages reports. Researchers submit and track only their own reports. Accepted reports proceed through patch verification and payout recording. Semantic duplicate discovery uses Qdrant candidates, while MySQL remains authoritative for final workflow state.

## Security and data handling

- Seed records are synthetic demonstration data.
- Never commit .env, passwords, private vulnerability disclosures or real payout details.
- Keep MySQL and Qdrant on trusted local/private networks.
- This application manages disclosure workflow and ledger records; it does not autonomously patch external repositories.
