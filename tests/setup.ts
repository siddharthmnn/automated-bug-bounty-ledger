// Tests never touch the development database or collection:
// they use bug_bounty_ledger_test (npm run db:test-reset) and
// vulnerability_reports_test in Qdrant.
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
process.env.MYSQL_DATABASE = process.env.MYSQL_TEST_DATABASE ?? "bug_bounty_ledger_test";
process.env.QDRANT_COLLECTION = "vulnerability_reports_test";
