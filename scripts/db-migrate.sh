#!/usr/bin/env bash
# Applies every database/migrations/*.sql file that has not been applied yet,
# in file-name order, and records it in the schema_migrations table.
# Usage: scripts/db-migrate.sh [database]   (default: $MYSQL_DATABASE from .env)
# Migrations run through the mysql command-line client inside the container
# because stored procedures use DELIMITER, which only the CLI understands.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
DB="${1:-$MYSQL_DATABASE}"

mysql_root() {
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
    mysql -uroot --default-character-set=utf8mb4 "$@"
}

echo "Waiting for MySQL..."
for _ in $(seq 1 60); do
  if mysql_root -e "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 2
done

mysql_root -e "CREATE DATABASE IF NOT EXISTS \`$DB\`"
mysql_root "$DB" -e "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)"

for file in database/migrations/*.sql; do
  name="$(basename "$file")"
  done_already="$(mysql_root -N "$DB" -e "SELECT COUNT(*) FROM schema_migrations WHERE filename='$name'")"
  if [ "$done_already" = "0" ]; then
    echo "Applying $name"
    mysql_root "$DB" < "$file"
    mysql_root "$DB" -e "INSERT INTO schema_migrations (filename) VALUES ('$name')"
  else
    echo "Skipping $name (already applied)"
  fi
done
echo "Migrations complete for database '$DB'."
