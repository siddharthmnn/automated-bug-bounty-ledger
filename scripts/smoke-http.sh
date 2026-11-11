#!/usr/bin/env bash
# Production HTTP + authenticated workflow tests against isolated CI resources.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] || { echo "ERROR: .env is missing." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a
export MYSQL_DATABASE="${MYSQL_TEST_DATABASE:?MYSQL_TEST_DATABASE is required}"
export QDRANT_COLLECTION="vulnerability_reports_test"
export HOSTNAME=127.0.0.1
export PORT="${SMOKE_PORT:-3100}"
BASE="http://$HOSTNAME:$PORT"
LOG_FILE="$(mktemp)"
TMP_DIR="$(mktemp -d)"
SERVER_PID=""
cleanup(){
  if [[ -n "$SERVER_PID" ]]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  rm -f "$LOG_FILE"; rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Provision a deterministic CI-only administrator without adding credentials to git.
ADMIN_EMAIL="ci-admin@example.test"
ADMIN_PASSWORD="CiOnly-Admin-Password-2026"
ADMIN_HASH="$(node -e 'process.stdout.write(require("bcryptjs").hashSync(process.argv[1], 10))' "$ADMIN_PASSWORD")"
docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql mysql -uroot "$MYSQL_DATABASE" \
  -e "INSERT INTO APP_USER(email,password_hash,role,researcher_id,display_name,is_active)
      VALUES('$ADMIN_EMAIL','$ADMIN_HASH','ADMIN',NULL,'CI Administrator',TRUE)
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),is_active=TRUE;"

npm run start -- --hostname "$HOSTNAME" --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE/login" >/dev/null 2>&1; then ready=1; break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then cat "$LOG_FILE" >&2; exit 1; fi
  sleep 2
done
[[ "$ready" -eq 1 ]] || { echo "ERROR: Next.js did not become ready." >&2; cat "$LOG_FILE" >&2; exit 1; }

check_status(){
  local expected="$1" path="$2" actual
  actual="$(curl -sS -o "$TMP_DIR/body" -w '%{http_code}' "$BASE$path")"
  [[ "$actual" == "$expected" ]] || { echo "FAIL $path: expected $expected got $actual" >&2; cat "$TMP_DIR/body" >&2; exit 1; }
  echo "PASS $path -> HTTP $actual"
}
check_redirect(){
  local path="$1" headers
  headers="$(curl -sS -D - -o /dev/null "$BASE$path")"
  grep -Eiq '^location: */login([?[:space:]]|$)' <<<"$headers" || { echo "FAIL $path: expected login redirect" >&2; printf '%s\n' "$headers" >&2; exit 1; }
  echo "PASS $path -> login redirect"
}
json_request(){
  local method="$1" path="$2" jar="$3" body="${4:-}" output="$5"
  if [[ -n "$body" ]]; then
    curl -fsS -X "$method" -H 'content-type: application/json' -b "$jar" -c "$jar" \
      -d "$body" "$BASE$path" -o "$output"
  else
    curl -fsS -X "$method" -b "$jar" -c "$jar" "$BASE$path" -o "$output"
  fi
}
login(){
  local email="$1" password="$2" jar="$3"
  curl -fsS -X POST -H 'content-type: application/json' -c "$jar" \
    -d "$(jq -nc --arg email "$email" --arg password "$password" '{email:$email,password:$password}')" \
    "$BASE/api/auth/login" -o "$TMP_DIR/login.json"
}
expect_forbidden(){
  local path="$1" jar="$2" actual
  actual="$(curl -sS -o "$TMP_DIR/forbidden.json" -w '%{http_code}' -b "$jar" "$BASE$path")"
  [[ "$actual" == "403" ]] || { echo "FAIL $path: expected 403 got $actual" >&2; cat "$TMP_DIR/forbidden.json" >&2; exit 1; }
  echo "PASS $path -> HTTP 403"
}

check_status 200 /login
check_status 200 /register
check_redirect /admin
check_redirect /researcher
check_status 401 /api/analytics/dashboard
invalid_status="$(curl -sS -X POST -H 'content-type: application/json' -d '{}' -o "$TMP_DIR/invalid.json" -w '%{http_code}' "$BASE/api/auth/login")"
[[ "$invalid_status" == "400" ]] || { echo "FAIL invalid login expected 400 got $invalid_status" >&2; exit 1; }
echo "PASS invalid login schema -> HTTP 400"

# Register two isolated researchers and establish real cookie-backed sessions.
RESEARCHER_PASSWORD="Researcher-CI-Password-2026"
RESEARCHER_EMAIL="ci-researcher@example.test"
OTHER_EMAIL="ci-other@example.test"
for email in "$RESEARCHER_EMAIL" "$OTHER_EMAIL"; do
  curl -fsS -X POST -H 'content-type: application/json' \
    -d "$(jq -nc --arg name "CI Researcher" --arg email "$email" --arg password "$RESEARCHER_PASSWORD" \
      '{name:$name,email:$email,country:"IN",password:$password}')" \
    "$BASE/api/auth/register" -o "$TMP_DIR/register.json"
done
RESEARCHER_JAR="$TMP_DIR/researcher.cookies"
OTHER_JAR="$TMP_DIR/other.cookies"
ADMIN_JAR="$TMP_DIR/admin.cookies"
login "$RESEARCHER_EMAIL" "$RESEARCHER_PASSWORD" "$RESEARCHER_JAR"
login "$OTHER_EMAIL" "$RESEARCHER_PASSWORD" "$OTHER_JAR"
login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_JAR"

# Discover a seeded active program and submit a report as the researcher.
json_request GET /api/programs "$RESEARCHER_JAR" "" "$TMP_DIR/programs.json"
PROGRAM_ID="$(jq -r '.data[0].program_id // empty' "$TMP_DIR/programs.json")"
[[ -n "$PROGRAM_ID" ]] || { echo "No active seeded program is available for E2E." >&2; cat "$TMP_DIR/programs.json" >&2; exit 1; }
REPORT_BODY="$(jq -nc --argjson programId "$PROGRAM_ID" \
  '{programId:$programId,title:"CI authenticated workflow report",description:"A reproducible CI-only vulnerability report used to validate the complete review and payout lifecycle.",severity:"HIGH",cvssScore:8.1}')"
json_request POST /api/vulnerabilities "$RESEARCHER_JAR" "$REPORT_BODY" "$TMP_DIR/report.json"
VULN_ID="$(jq -r '.data.vulnId // empty' "$TMP_DIR/report.json")"
[[ -n "$VULN_ID" ]] || { echo "Report submission returned no vulnId." >&2; cat "$TMP_DIR/report.json" >&2; exit 1; }
echo "PASS researcher report submission -> vuln $VULN_ID"

# Enforce role boundaries in both directions before admin transitions the report.
expect_forbidden /api/patches "$RESEARCHER_JAR"
expect_forbidden /api/me/reports "$ADMIN_JAR"

json_request POST "/api/vulnerabilities/$VULN_ID/review" "$ADMIN_JAR" \
  '{"decision":"ACCEPTED","note":"CI authenticated E2E acceptance"}' "$TMP_DIR/review.json"
json_request POST /api/patches "$ADMIN_JAR" \
  "$(jq -nc --argjson vulnId "$VULN_ID" '{vulnId:$vulnId,patchDate:"2026-11-12",notes:"CI verified patch"}')" "$TMP_DIR/patch.json"
PATCH_ID="$(jq -r '.data.patchId // empty' "$TMP_DIR/patch.json")"
[[ -n "$PATCH_ID" ]] || { echo "Patch creation returned no patchId." >&2; cat "$TMP_DIR/patch.json" >&2; exit 1; }
json_request POST "/api/patches/$PATCH_ID/verify" "$ADMIN_JAR" \
  '{"result":"VERIFIED","notes":"CI end-to-end verification"}' "$TMP_DIR/verify.json"
json_request POST /api/payouts "$ADMIN_JAR" \
  "$(jq -nc --argjson vulnId "$VULN_ID" '{vulnId:$vulnId,amount:125.50,currency:"INR"}')" "$TMP_DIR/payout.json"
PAYOUT_ID="$(jq -r '.data.payoutId // empty' "$TMP_DIR/payout.json")"
[[ -n "$PAYOUT_ID" ]] || { echo "Payout creation returned no payoutId." >&2; cat "$TMP_DIR/payout.json" >&2; exit 1; }
json_request POST "/api/payouts/$PAYOUT_ID/complete" "$ADMIN_JAR" \
  '{"result":"COMPLETED","paymentDate":"2026-11-12"}' "$TMP_DIR/complete.json"

# Assert persisted workflow state and researcher ownership via authenticated APIs.
json_request GET /api/me/reports "$RESEARCHER_JAR" "" "$TMP_DIR/my-reports.json"
jq -e --argjson id "$VULN_ID" '.data | any(.[]; .vuln_id == $id and .status == "ACCEPTED")' "$TMP_DIR/my-reports.json" >/dev/null
json_request GET /api/me/payouts "$RESEARCHER_JAR" "" "$TMP_DIR/my-payouts.json"
jq -e --argjson id "$VULN_ID" '.data | any(.[]; .vuln_id == $id and .currency == "INR" and .payment_status == "COMPLETED")' "$TMP_DIR/my-payouts.json" >/dev/null
json_request GET /api/me/reports "$OTHER_JAR" "" "$TMP_DIR/other-reports.json"
jq -e --argjson id "$VULN_ID" 'all(.data[]?; .vuln_id != $id)' "$TMP_DIR/other-reports.json" >/dev/null
json_request GET /api/analytics/dashboard "$ADMIN_JAR" "" "$TMP_DIR/dashboard.json"
jq -e '.data.payouts | any(.currency == "INR")' "$TMP_DIR/dashboard.json" >/dev/null
echo "PASS authenticated report -> review -> patch -> verification -> INR payout -> completion"
echo "PASS researcher ownership isolation and admin analytics access"
echo "All production HTTP and authenticated E2E checks passed."
