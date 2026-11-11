#!/usr/bin/env bash
# HTTP smoke tests against the production Next.js server and isolated test DB.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then echo "ERROR: .env is missing." >&2; exit 1; fi
set -a
# shellcheck disable=SC1091
source .env
set +a
export MYSQL_DATABASE="${MYSQL_TEST_DATABASE:?MYSQL_TEST_DATABASE is required}"
export QDRANT_COLLECTION="vulnerability_reports_test"
export HOSTNAME=127.0.0.1
export PORT="${SMOKE_PORT:-3100}"
LOG_FILE="$(mktemp)"
npm run start -- --hostname "$HOSTNAME" --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; rm -f "$LOG_FILE"; }
trap cleanup EXIT
BASE="http://$HOSTNAME:$PORT"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE/login" >/dev/null 2>&1; then ready=1; break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then cat "$LOG_FILE" >&2; exit 1; fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then echo "ERROR: Next.js did not become ready." >&2; cat "$LOG_FILE" >&2; exit 1; fi
check_status(){
  local expected="$1" path="$2" actual
  actual="$(curl -sS -o /tmp/abbl-smoke-body -w '%{http_code}' "$BASE$path")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $path: expected HTTP $expected, got $actual" >&2
    cat /tmp/abbl-smoke-body >&2
    exit 1
  fi
  echo "PASS $path -> HTTP $actual"
}
check_redirect(){
  local path="$1" headers
  headers="$(curl -sS -D - -o /dev/null "$BASE$path")"
  if ! grep -Eiq '^location: */login([?[:space:]]|$)' <<<"$headers"; then
    echo "FAIL $path: expected redirect to /login" >&2
    printf '%s\n' "$headers" >&2
    exit 1
  fi
  echo "PASS $path -> login redirect"
}
check_status 200 /login
check_status 200 /register
check_redirect /admin
check_redirect /researcher
check_status 401 /api/analytics/dashboard
check_status 400 /api/auth/login
echo "Production HTTP smoke tests passed."
