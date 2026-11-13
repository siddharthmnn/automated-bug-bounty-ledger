# Documentation

This folder contains the design notes, DBMS material, operating instructions and validation records for the Automated Bug Bounty Vulnerability Patch & Payout Ledger.

## Start here

| Document | Use it for |
| --- | --- |
| [DBMS Documentation](dbms-documentation.md) | Database design and the DBMS concepts demonstrated by the project |
| [Demo Guide](demo-guide.md) | Suggested application and MySQL Workbench walkthrough |
| [DML and Query Guide](dml-and-query-guide.md) | Application DML mapping and Q01–Q12 SQL explanations |
| [Phase 2 Architecture](phase2-architecture.md) | System components, data flow and design decisions |

## Database design

- [ER Diagram](er-diagram.md) — entities, relationships and cardinalities.
- [Relational Schema](relational-schema.md) — tables, keys and integrity rules.
- `../database/migrations/` — ordered executable schema migrations.
- `../database/seed/` — synthetic baseline and demonstration data.
- `../database/demo/` — repeatable SQL demonstrations.
- `../database/queries/` — standalone business-query catalogue.

## Validation and evidence

- [DBMS Validation](evidence/dbms-validation.md) — captured MySQL objects, grants, constraints, indexes, vector reconciliation and EXPLAIN plans.
- [Application Screenshots](evidence/screenshots/README.md) — screenshots grouped by application area.
- [Integrated Acceptance](integrated-acceptance.md) — automated acceptance scope and manual browser checklist.
- [Accessibility and Responsive Audit](accessibility-responsive-audit.md) — UI checks and remaining limitations.
- [Release Readiness](release-readiness.md) — deployment assumptions and release considerations.

## Application workflows

- [Researcher Workflow](researcher-workflow.md) — registration, submission, report tracking and troubleshooting.
- [Researcher Acceptance](researcher-acceptance.md) — researcher-side acceptance checks.
- [Session Security Regression](session-security-regression.md) — session and ownership regression coverage.
- [Team Responsibilities](team-contributions.md) — agreed work split and attribution guidance.

## Source of truth

The SQL migrations and application code are authoritative. These documents explain the design and recorded validation. If a document and executable implementation differ, verify against the migrations and code before presenting the behavior.
