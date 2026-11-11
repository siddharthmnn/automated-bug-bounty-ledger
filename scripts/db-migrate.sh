#!/usr/bin/env bash
# Apply pending SQL migrations in filename order and record each successful file.
# Usage: bash scripts/db-migrate.sh [bug_bounty_ledger|bug_bounty_ledger_test]
set -Eeuo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "ERROR: .env is missing. Copy .env.example to .env and configure it first." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env
set +a

DB="${1:-${MYSQL_DATABASE:?MYSQL_DATABASE is not configured in .env}}"
case "$DB" in
  bug_bounty_ledger|bug_bounty_ledger_test) ;;
  *) echo "ERROR: refusing to use unexpected database name: $DB" >&2; exit 1 ;;
esac

mysql_root() {
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
    mysql -uroot --default-character-set=utf8mb4 "$@"
}

echo "Waiting for MySQL to become ready..."
ready=0
for _ in $(seq 1 60); do
  if mysql_root -e "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then
  echo "ERROR: MySQL did not become ready within 120 seconds." >&2
  exit 1
fi

mysql_root -e "CREATE DATABASE IF NOT EXISTS \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
mysql_root "$DB" -e "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)"

shopt -s nullglob
migrations=(database/migrations/*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "ERROR: no SQL migration files found in database/migrations/." >&2
  exit 1
fi

for file in "${migrations[@]}"; do
  name="$(basename "$file")"
  done_already="$(mysql_root -N "$DB" -e "SELECT COUNT(*) FROM schema_migrations WHERE filename='$name'")"
  if [[ "$done_already" == "0" ]]; then
    echo "Applying $name"
    mysql_root "$DB" < "$file"
    mysql_root "$DB" -e "INSERT INTO schema_migrations (filename) VALUES ('$name')"
  else
    echo "Skipping $name (already applied)"
  fi
done
echo "Migrations complete for '$DB'."
