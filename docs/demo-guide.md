# Project Demonstration Guide

This guide follows the application workflow first, then shows the database concepts behind it.

## 1. Start the application

```bash
docker compose up -d
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the database has not been initialized, follow the setup steps in the [main README](../README.md). Avoid running a destructive reset during the demonstration unless you intend to recreate the local sample data.

Use synthetic accounts and reports only. Do not display passwords, environment variables or real vulnerability information.

## 2. Researcher walkthrough

1. Open registration and create or use a synthetic researcher account.
2. Sign in and show the researcher dashboard.
3. Browse available bounty programs.
4. Submit a report with a title, description, severity and CVSS score.
5. Open the report detail page and show its current status and history.
6. Explain that a researcher can access only their own reports and payouts.

## 3. Administrator walkthrough

1. Sign in using the configured synthetic administrator account.
2. Open the report queue and select a submitted report.
3. Review the report and record a triage decision.
4. Accept an eligible report and record a patch.
5. Verify the patch.
6. Create and complete the payout record.
7. Open analytics and explain why payout totals are grouped by currency.

The report #345 screenshots in [Application Evidence](evidence/screenshots/README.md) document a continuous synthetic report-to-payout walkthrough.

## 4. DBMS concepts to demonstrate

| Concept | Where to show it | Explanation |
| --- | --- | --- |
| Relational design | ER diagram and schema | How company, program, researcher, report, patch and payout records relate |
| DDL | `database/migrations/` | Tables, constraints, indexes, roles, views, procedures and triggers are created through ordered migrations |
| DML | `database/demo/dml_demo.sql` | INSERT, SELECT, UPDATE and DELETE on linked synthetic rows |
| Transactions | DML demo and ledger procedures | Related writes are grouped; the demo ends with ROLLBACK |
| Constraints | MySQL schema | Foreign keys, unique keys and checks protect integrity |
| Stored procedures | MySQL routine list | Sensitive workflow operations are centralized and ownership-aware |
| Triggers | MySQL trigger list | Status history and vector outbox work are maintained automatically |
| Indexes | EXPLAIN plans | Indexes support common access paths; the optimizer may choose a scan for small tables |
| RBAC | SHOW GRANTS and privilege probes | Application accounts receive separate privileges |
| Advanced SQL | Query catalogue Q01–Q12 | Joins, subqueries, CTEs, recursive CTEs, grouping and window functions |
| Vector search | Qdrant collection and search page | Embeddings retrieve similar candidates; MySQL remains authoritative |

## 5. Run the DML demonstration in MySQL Workbench

The script is `database/demo/dml_demo.sql`. It is a SQL script, not a Workbench model file.

1. Copy the file locally or open it from the repository using **File → Open SQL Script**.
2. Connect to the project's local MySQL service:
   - Host: `127.0.0.1`
   - Port: `3307`
   - User: the configured privileged local database user.
3. Confirm that the connection points to the project database, not another local MySQL instance.
4. Open `dml_demo.sql` in the SQL editor.
5. Read the opening safety comments. The script targets `bug_bounty_ledger` and generates synthetic values.
6. Execute the script using the lightning-bolt **Execute** control.
7. Review the result grids and Action Output. The script inserts related rows, selects them, updates the report, deletes the disposable records, verifies zero remaining demo reports and executes ROLLBACK.

**Safety:** Run this only against a disposable development database. It uses a privileged connection and may advance auto-increment counters even though the transaction is rolled back. Never run it against production or a database containing important records.

## 6. Explain Q01–Q12

Open the scripts in `database/queries/` or use the SQL analytics page.

- **Q01:** joins report, program, company, patch and payout information.
- **Q02 and Q06:** find missing related records using anti-join / NOT EXISTS patterns.
- **Q03 and Q10:** summarize data with grouping, conditional aggregates and HAVING.
- **Q04 and Q05:** compare researchers or reports against a relevant aggregate.
- **Q07:** demonstrates relational division using nested NOT EXISTS.
- **Q08 and Q09:** use window functions for ranking and running totals.
- **Q11:** uses a recursive CTE to follow duplicate-report relationships.
- **Q12:** calculates patch verification time by company.

For earnings queries, point out that currency is part of the grouping or partitioning logic. INR, USD and EUR must not be treated as directly comparable values.

## 7. Explain the architecture

1. The Next.js interface sends a request to an authenticated API route.
2. The backend validates the request and checks the session and application role.
3. The database layer performs the operation using the appropriate MySQL account and, for protected lifecycle changes, a stored procedure.
4. MySQL stores the authoritative record and maintains audit/outbox data through triggers.
5. A vector worker processes outbox jobs and updates Qdrant.
6. Semantic search retrieves candidate reports from Qdrant; final records and workflow state are resolved from MySQL.

## 8. Suggested closing summary

"The project brings the bug bounty workflow and its payout records into one application. MySQL handles relational integrity, authorization-sensitive operations and the ledger. Qdrant adds semantic duplicate discovery without becoming the source of truth. The DBMS work is demonstrated through the schema, constraints, procedures, triggers, roles, transactions and twelve business-oriented SQL queries."

## Evidence

- [DBMS validation](evidence/dbms-validation.md)
- [Screenshot index](evidence/screenshots/README.md)
- [ER diagram](er-diagram.md)
- [Relational schema](relational-schema.md)
- [DML and query guide](dml-and-query-guide.md)
- [Integrated acceptance checklist](integrated-acceptance.md)
