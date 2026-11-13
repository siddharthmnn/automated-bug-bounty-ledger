# DML and Meaningful SQL Query Demonstration

## DML operations in the application

The application performs DML through authenticated API routes and database services/procedures.

| DML operation | Application example | Database behavior |
|---|---|---|
| INSERT | Researcher submits a vulnerability report | `sp_submit_vulnerability` inserts a row into `VULNERABILITY`; an AFTER INSERT trigger records status history |
| INSERT | Admin records a patch | `sp_record_patch` inserts a `PATCH` row; a trigger permits patches only for ACCEPTED reports |
| INSERT | Admin creates a payout | `sp_create_payout` inserts a PENDING `PAYOUT` row; a trigger permits payouts only for ACCEPTED reports |
| SELECT | Admin/researcher dashboards, report detail, payout history and analytics | SELECT statements, joins, views and query catalogue retrieve relational data |
| UPDATE | Researcher edits an unreviewed report | `sp_update_my_report` updates only a report owned by that researcher while its status is SUBMITTED |
| UPDATE | Admin verifies a patch | `sp_verify_patch` locks and updates the patch row within a transaction |
| UPDATE | Admin completes a payout | `sp_complete_payout` locks and updates a PENDING payout within a transaction |
| DELETE | Researcher withdraws an unreviewed report | `sp_withdraw_my_report` deletes only the researcher's own SUBMITTED report |
| DELETE | Admin removes a company/program | Delete guards prevent removal where reviewed reports or financial/audit history must be preserved |

The application uses stored procedures for important ownership-sensitive and ledger transitions. Do not describe every operation as a direct SQL statement from the browser: the UI calls the backend, and the backend invokes the database layer.

## Reproducible DML demonstration

Run `database/demo/dml_demo.sql` against a disposable development database using a privileged MySQL Workbench connection.

The script:
1. Starts a transaction.
2. Inserts a synthetic company, program, researcher and vulnerability report.
3. Selects the inserted report through four related tables.
4. Updates the still-SUBMITTED report and selects the changed values.
5. Deletes that disposable unreviewed report and verifies the row count is zero.
6. Deletes its remaining parent records in foreign-key-safe order.
7. Rolls the transaction back so no demonstration rows remain committed.

Use only a development copy. Do not execute this demonstration against production data. MySQL auto-increment counters may advance even though the transaction is rolled back.

## Meaningful SQL query catalogue

The standalone scripts in `database/queries/` now mirror the application analytics catalogue.

| Query | Business question | SQL concepts |
|---|---|---|
| Q01 | Which accepted reports have patch and payout state? | Multi-table JOIN, LEFT JOIN, correlated subqueries |
| Q02 | Which accepted reports have no payout? | LEFT anti-join, IS NULL |
| Q03 | Which programs have at least two HIGH/CRITICAL reports? | COUNT, MAX, GROUP BY, HAVING, ORDER BY |
| Q04 | Which researchers earn above peers in their country and currency? | CTE, conditional SUM, correlated subquery |
| Q05 | Which reports score above their program's average CVSS? | Correlated scalar subquery, AVG |
| Q06 | Which programs have never accepted a report? | Nested NOT EXISTS |
| Q07 | Which companies have a verified patch in every program? | Relational division, nested NOT EXISTS |
| Q08 | How do researcher earnings and accepted-report counts rank? | CTE, RANK, DENSE_RANK, window functions |
| Q09 | What are monthly payouts and running totals per currency? | GROUP BY, SUM OVER, PARTITION BY |
| Q10 | What are each researcher's accepted, duplicate and rejected counts? | Conditional aggregates, GROUP BY, HAVING |
| Q11 | What is the duplicate chain for report 318? | Recursive CTE, self-referencing relationship |
| Q12 | How long does patch verification take per company? | JOIN, DATEDIFF, AVG, GROUP BY |

### Currency correctness

Q04, Q08 and Q09 keep currency as a grouping/partitioning dimension. INR, USD and EUR amounts are not summed or ranked against one another as if they shared a unit.

### Suggested viva explanation

"Our SQL analytics are based on business questions from the bug bounty workflow. We use joins to combine reports with researchers, programs, companies, patches and payouts; grouping and HAVING to summarize program performance; correlated and nested subqueries to compare reports with their program or test missing related records; recursive CTEs to trace duplicate reports; and window functions to rank researchers and calculate running payout totals. Monetary values are grouped by currency so different currencies are never combined incorrectly."
