#!/usr/bin/env bash
# Destructive only to the dedicated test database and test Qdrant collection.
# Builds schema + seed data, provisions least-privilege DB users, then runs
# integration tests against isolated test resources.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then echo "ERROR: .env is missing." >&2; exit 1; fi
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${MYSQL_TEST_DATABASE:?MYSQL_TEST_DATABASE is required}"
echo "Resetting only test database: $MYSQL_TEST_DATABASE"
bash scripts/db-reset.sh "$MYSQL_TEST_DATABASE"

echo "Provisioning application roles for the test database."
MYSQL_DATABASE="$MYSQL_TEST_DATABASE" bash scripts/db-users.sh

echo "Initializing isolated Qdrant test collection."
QDRANT_COLLECTION="vulnerability_reports_test" npx tsx scripts/qdrant-init.ts

echo "Running integration tests against isolated test resources."
MYSQL_DATABASE="$MYSQL_TEST_DATABASE" QDRANT_COLLECTION="vulnerability_reports_test" npx vitest run tests/integration tests/db
