#!/usr/bin/env bash
# DESTRUCTIVE (local only): drops the database, rebuilds it from every
# migration, then loads every seed file in order.
# Usage: scripts/db-reset.sh [database]   (default: $MYSQL_DATABASE)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
DB="${1:-$MYSQL_DATABASE}"

mysql_root() {
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
    mysql -uroot --default-character-set=utf8mb4 "$@"
}

echo "Resetting database '$DB'"
mysql_root -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\`"
scripts/db-migrate.sh "$DB"
for file in database/seed/*.sql; do
  echo "Seeding $(basename "$file")"
  mysql_root "$DB" < "$file"
done
echo "Database '$DB' rebuilt and seeded."
