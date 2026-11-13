# Automated Bug Bounty Vulnerability Patch & Payout Ledger

A web application for managing the bug bounty lifecycle — from researcher submission and admin review to patch verification and payout tracking.

The project uses **MySQL as the source of truth** for application and financial records, with **Qdrant** providing semantic search for potentially similar vulnerability reports.

![Report accepted](<docs/evidence/screenshots/workflow/01-report-345-accepted.jpeg>)

## What the application does

- Researchers register, browse programs, submit vulnerability reports and track their own submissions.
- Administrators manage companies and programs, review reports, record patches, verify fixes and complete payouts.
- Report status history supports auditability.
- SQL analytics answer operational questions about reports, researchers, patches and payouts.
- Semantic search helps identify potentially related reports. Search results are candidates; MySQL remains authoritative.

## Screenshots

| Researcher dashboard | Admin report queue |
| --- | --- |
| ![Researcher dashboard](<docs/evidence/screenshots/researcher/researcher dashboard.jpeg>) | ![Admin report queue](<docs/evidence/screenshots/admin/reports page in admin.jpeg>) |

| SQL analytics | Vector synchronization |
| --- | --- |
| ![SQL analytics](<docs/evidence/screenshots/analytics/q08.jpeg>) | ![Vector sync](<docs/evidence/screenshots/database/vector sync.jpeg>) |

See the [screenshot index](docs/evidence/screenshots/README.md) for the complete set. Screenshots use synthetic demonstration data.

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Relational database | MySQL 8.4 |
| Vector database | Qdrant |
| Embeddings | Transformers.js, `Xenova/all-MiniLM-L6-v2` (384 dimensions) |
| Validation | Zod |
| Local infrastructure | Docker Compose |

## Data design

MySQL stores users, roles, companies, programs, researchers, reports, status history, patches and payouts. Constraints, indexes, triggers, stored procedures and database grants protect important operations.

Qdrant stores report embeddings and filterable metadata for semantic retrieval. A MySQL outbox records synchronization work; retries and reconciliation handle missed or stale entries. Qdrant is a derived index, not a replacement for MySQL.

Financial analytics preserve currency boundaries. INR, USD and EUR amounts are grouped separately rather than added together without an exchange-rate policy.

## Run locally

### Requirements
- Docker Engine or Docker Desktop with Compose
- Node.js 22.12 or later
- npm

### Setup

```bash
git clone https://github.com/siddharthmnn/automated-bug-bounty-ledger.git
cd automated-bug-bounty-ledger
cp .env.example .env
# Set strong local secrets in .env before starting the application.
npm ci
docker compose up -d
npm run db:reset
npm run db:users
npm run qdrant:init
npm run vector:backfill
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

MySQL is exposed locally on port `3307`; Qdrant uses `6333` (HTTP) and `6334` (gRPC). Compose binds these services to loopback for local development.

> **Important:** `npm run db:reset` drops and recreates the configured development database. `npm run test:db` resets the dedicated test database and test Qdrant collection. Use only disposable development/test data. Never point these commands at production.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run db:up` / `npm run db:down` | Start or stop local services |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Rebuild development database and load seeds |
| `npm run db:users` | Provision application database accounts |
| `npm run qdrant:init` | Create vector collection and payload indexes |
| `npm run vector:backfill` | Index existing reports |
| `npm run vector:sync` | Process pending outbox jobs |
| `npm run vector:reconcile` | Compare MySQL and Qdrant state |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm test` / `npm run test:db` | Unit and database-backed tests |
| `npm run build` | Production build |

## Documentation

Start with the [Documentation Index](docs/README.md).

| Document | Contents |
| --- | --- |
| [DBMS Documentation](docs/dbms-documentation.md) | Database design, schema, integrity, security, SQL and vector storage |
| [Demo Guide](docs/demo-guide.md) | Application and MySQL Workbench demonstration |
| [ER Diagram](docs/er-diagram.md) | Entities and relationship cardinalities |
| [Relational Schema](docs/relational-schema.md) | Tables, keys and integrity rules |
| [DML and Query Guide](docs/dml-and-query-guide.md) | DML mapping and Q01–Q12 explanations |
| [DBMS Validation](docs/evidence/dbms-validation.md) | Captured database validation and query plans |
| [Application Evidence](docs/evidence/screenshots/README.md) | Screenshot index |
| [Architecture](docs/phase2-architecture.md) | Components, request flow and design decisions |

## Team responsibilities

| Member | Primary area |
| --- | --- |
| Siddharth Menon | Database design, SQL, backend services, database security and vector integration |
| Tanisha D | Frontend walkthrough, integration, testing, validation evidence and documentation |

Both members contributed to the project and its demonstration. This table describes the agreed division of responsibility; individual implementation history remains in GitHub commits and pull requests.

## Scope and security

- Seed and screenshot data are synthetic.
- Do not commit `.env`, passwords, private vulnerability disclosures or real payout details.
- Keep MySQL and Qdrant on trusted local/private networks.
- The application manages disclosure workflow and payout records; it does not autonomously patch external repositories.
