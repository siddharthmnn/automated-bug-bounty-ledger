#!/usr/bin/env bash
# DESTRUCTIVE: drops and rebuilds one of the two local project databases.
# Usage: bash scripts/db-reset.sh [bug_bounty_ledger|bug_bounty_ledger_test]
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
  *) echo "ERROR: refusing to drop unexpected database name: $DB" >&2; exit 1 ;;
esac

mysql_root() {
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
    mysql -uroot --default-character-set=utf8mb4 "$@"
}

echo "WARNING: this permanently drops and rebuilds the local database '$DB'."
mysql_root -e "SELECT 1" >/dev/null
mysql_root -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"

bash scripts/db-migrate.sh "$DB"

shopt -s nullglob
seeds=(database/seed/*.sql)
if [[ ${#seeds[@]} -eq 0 ]]; then
  echo "ERROR: no SQL seed files found in database/seed/." >&2
  exit 1
fi
for file in "${seeds[@]}"; do
  echo "Seeding $(basename "$file")"
  mysql_root "$DB" < "$file"
done
echo "Database '$DB' rebuilt and seeded."
