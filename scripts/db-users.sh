#!/usr/bin/env bash
# Creates the four least-privilege MySQL accounts used by the app and gives
# each one exactly one role (roles come from migration 006).
# Passwords are read from .env so they never appear in git.
# Run after the first migration: npm run db:users
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo "ERROR: .env is missing. Copy .env.example to .env first." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env
set +a

mysql_root() {
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql     mysql -uroot --default-character-set=utf8mb4 "$@"
}

create_account() {
  local user="$1" password="$2" role="$3"
  # Project-generated passwords are hex, which is safe inside this SQL literal.
  if [[ ! "$password" =~ ^[A-Fa-f0-9]{32,}$ ]]; then
    echo "ERROR: $user password must be a generated hex secret (32+ chars)." >&2
    exit 1
  fi
  echo "Account $user -> $role"
  mysql_root -e "
    CREATE USER IF NOT EXISTS '$user'@'%' IDENTIFIED BY '$password';
    ALTER USER '$user'@'%' IDENTIFIED BY '$password';
    GRANT $role TO '$user'@'%';
    SET DEFAULT ROLE $role TO '$user'@'%';"
}
create_account "$DB_AUTH_USER"       "$DB_AUTH_PASSWORD"       role_auth
create_account "$DB_ADMIN_USER"      "$DB_ADMIN_PASSWORD"      role_admin_app
create_account "$DB_RESEARCHER_USER" "$DB_RESEARCHER_PASSWORD" role_researcher_app
create_account "$DB_VECTOR_USER"     "$DB_VECTOR_PASSWORD"     role_vector_sync
echo "Done. Verify with SHOW GRANTS and role-specific access probes."
