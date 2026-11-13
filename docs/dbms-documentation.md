# DBMS Documentation

## 1. Project overview

The ledger manages a bug bounty report from submission through review, patch verification and payout. The database must preserve relationships between researchers, programs, companies, reports and financial records while restricting who can perform each operation.

The project uses two data stores for different purposes:

- **MySQL 8.4** is the authoritative relational database. It stores accounts, business entities, workflow state, audit history and payouts.
- **Qdrant** is a derived vector index. It stores embeddings and metadata used to find semantically similar reports.

A vector-search result is a candidate only. Ownership, report status and payout state are enforced and read through the relational application path.

## 2. Main entities

| Entity | Purpose |
| --- | --- |
| COMPANY | Organization running bounty programs |
| PROGRAM | Scope and status of a bounty program |
| RESEARCHER | Person submitting vulnerability reports |
| VULNERABILITY | Report, severity, CVSS and workflow status |
| PATCH | Patch record and verification state |
| PAYOUT | Bounty amount, currency and payment state |
| APP_USER | Login identity and application role |
| USER_SESSION | Session token hash and expiry |
| VULN_STATUS_HISTORY | Audit trail of report status changes |
| VECTOR_SYNC_JOB | Outbox entry for Qdrant synchronization |

A company has many programs; a program receives many reports; a researcher can submit many reports. Each report can have at most one patch and one payout. A report may reference another report when marked as a duplicate.

See the [ER Diagram](er-diagram.md) and [Relational Schema](relational-schema.md) for the complete model.

## 3. Relational integrity

The schema uses:
- Primary keys to identify rows.
- Foreign keys to connect related entities.
- Unique constraints to prevent duplicate account emails and enforce at most one patch/payout per report.
- CHECK constraints for values such as CVSS range, payout currency, non-negative amount and session expiry.
- Indexes for report queues, researcher history, payout status and full-text report search.

The executable definitions are in `database/migrations/`. These migrations are the definitive schema.

## 4. DDL, DML and database programming

### DDL

Ordered migration files create and extend tables, keys, indexes, roles, views, functions, procedures and triggers.

### DML

| Operation | Project example |
| --- | --- |
| INSERT | Researcher submits a report; admin records a patch or creates a payout |
| SELECT | Dashboards, report details, payout history and analytics retrieve records |
| UPDATE | An eligible report is edited; admin changes review, patch or payout state |
| DELETE | A researcher withdraws an eligible unreviewed report; guarded deletes are restricted where history must be preserved |

The browser does not connect directly to MySQL. It calls the backend, which validates the request and uses the database layer. Important lifecycle operations use stored procedures.

The standalone [DML demo](../database/demo/dml_demo.sql) creates linked synthetic records, reads and updates them, deletes the disposable rows and finishes with ROLLBACK. Run it only against a disposable development database. Auto-increment counters may still advance after rollback.

### Procedures, functions and triggers

Stored procedures encapsulate sensitive operations such as registration, report submission, researcher-scoped reads and updates, admin review, patch verification and payout completion.

Functions provide reusable calculations and canonical report text. Triggers maintain report status history, guard patch/payout lifecycle rules and enqueue vector synchronization work when report data changes.

## 5. Database security

The project provisions separate application accounts:

- `app_auth` — authentication operations.
- `app_admin` — administrative operations.
- `app_researcher` — researcher-scoped operations.
- `app_vector` — vector synchronization.

Each account receives a database role with limited privileges. The backend selects the appropriate database path after authenticating the application user and checking the application role.

Researcher ownership is enforced in database procedures using authenticated user context. MySQL grants and stored procedures provide the database access boundary; the project does not claim native MySQL row-level security.

Session tokens are stored as hashes. The application checks session validity and role before serving protected pages or API operations.

## 6. Transactions and consistency

Multi-step ledger operations use transactions and row locking where required. Patch verification and payout completion, for example, must not race with another state transition.

The DML demo uses an explicit transaction and ROLLBACK so its sample rows are not committed.

Vector synchronization is asynchronous. MySQL records work in an outbox, and a worker updates Qdrant. Retry and reconciliation processes handle pending jobs and drift. This avoids treating a MySQL write and a Qdrant request as one distributed transaction.

## 7. SQL query catalogue

The twelve business queries in `database/queries/` demonstrate joins, anti-joins, grouping, HAVING, conditional aggregates, correlated and nested subqueries, CTEs, recursive CTEs and window functions.

Q04, Q08 and Q09 retain currency in their grouping or partitioning logic. INR, USD and EUR are not treated as directly comparable amounts.

See the [DML and Query Guide](dml-and-query-guide.md) for each query's business question and SQL concepts.

## 8. Indexing and query plans

Indexes target common access patterns: report queues by program/status, researcher history by researcher/date, payout status/date and full-text lookup across report title and description.

The validation record includes representative EXPLAIN output. A table scan is not automatically a defect; for a small table, MySQL may estimate that scanning rows is cheaper than using an index.

See [DBMS Validation Evidence](evidence/dbms-validation.md).

## 9. MySQL and Qdrant

The local Transformers.js model `Xenova/all-MiniLM-L6-v2` produces 384-dimensional embeddings. Qdrant stores these vectors with filterable report metadata.

The MySQL `VECTOR_SYNC_JOB` outbox tracks upsert/delete work. Backfill indexes existing reports; sync processes pending jobs; reconciliation compares relational records with Qdrant points and identifies drift.

MySQL remains authoritative if the two stores disagree.

## 10. Validation record

Recorded evidence covers MySQL objects, constraints, triggers, routines, indexes and grants; privilege probes; representative EXPLAIN plans; Qdrant reconciliation; automated tests; and manual application screenshots.

See [DBMS validation](evidence/dbms-validation.md), [screenshots](evidence/screenshots/README.md) and [integrated acceptance](integrated-acceptance.md). Automated and manual checks are identified separately; a screenshot should not be treated as proof of a test that was not performed.
