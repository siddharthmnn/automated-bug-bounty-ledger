# Automated Bug Bounty Vulnerability Patch & Payout Ledger

A centralized platform that manages the lifecycle of security vulnerability reports, from researcher submission and company review to patch verification and bounty payment, using a relational database and a vector database.

## Current development baseline

- **Relational database:** MySQL 8.4
- **Vector database:** Qdrant
- **Application:** Next.js 16, React 19 and TypeScript
- **Phase 1 schema:** `COMPANY`, `PROGRAM`, `RESEARCHER`, `VULNERABILITY`, `PATCH` and `PAYOUT`
- **Local orchestration:** Docker Compose

MySQL remains the source of truth for application records. Qdrant is reserved for semantic retrieval over vulnerability reports; it does not replace relational records.

## Prerequisites

- Docker Engine or Docker Desktop with the Compose plugin
- Node.js **22.12 or later** and npm (for the Next.js application and project scripts)

## Local database setup

1. Clone the repository and enter its directory.
2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env`. Replace every `change-me` password with a strong local development password. Do not commit `.env`.
4. Start the database services:

   ```bash
   docker compose up -d
   docker compose ps
   ```

5. Install the Node.js dependencies:

   ```bash
   npm ci
   ```

6. Build the local MySQL database from the Phase 1 baseline and its sample data:

   ```bash
   npm run db:reset
   ```

   This reset command is **destructive**: it drops and recreates the configured local database before applying migrations and seed files. Use it only when you are okay losing the current local database contents.

The MySQL port is published on `127.0.0.1:3307` by default, and the Qdrant REST/gRPC ports are published on `127.0.0.1:6333` and `127.0.0.1:6334`. These loopback bindings keep the development services off external network interfaces. Change the host port values in `.env` if they conflict with another local service.

## Database scripts

| Command | Purpose |
| --- | --- |
| `npm run db:up` | Start MySQL and Qdrant |
| `npm run db:down` | Stop the Compose services |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run db:reset` | **Destructively** rebuild the configured database and load seed files |
| `npm run db:test-reset` | **Destructively** rebuild the dedicated test database |

The migration runner records successfully applied migration filenames in `schema_migrations`. SQL migrations are applied in filename order from `database/migrations/`; seed files are applied in filename order from `database/seed/` during a reset.

## Application commands

```bash
npm run dev        # start the Next.js development server
npm run lint       # run ESLint
npm run typecheck  # run the TypeScript compiler without emitting files
npm test           # run unit tests
npm run build      # create a production build
```

## Repository structure

```text
database/
  migrations/      # ordered SQL schema migrations
  seed/            # deterministic local sample data
scripts/           # database and vector operations
src/
  app/             # Next.js App Router application
  components/      # reusable UI components
  lib/             # shared utilities
tests/             # automated tests
```

## Data and security notes

- The sample records are synthetic development data, not real vulnerability disclosures or payment records.
- Never place real credentials, private vulnerability reports, or production payment information in the repository.
- Do not expose MySQL or Qdrant directly to a public network. Qdrant's local development endpoint is not configured with authentication by default.
- The application manages report workflow and payout records; it is not a vulnerability scanner and does not autonomously modify external company source code.
