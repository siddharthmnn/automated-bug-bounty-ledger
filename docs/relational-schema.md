# Relational schema

Notation: PK = primary key, FK = foreign key, UK = unique key. This is the logical schema after migrations 001–012; the ordered SQL migrations remain authoritative for exact types, defaults, checks and trigger definitions.

## Core disclosure and payout ledger

- **COMPANY**(**company_id** PK, name, industry, website)
- **PROGRAM**(**program_id** PK, name, scope, status, company_id FK → COMPANY.company_id)
- **RESEARCHER**(**researcher_id** PK, name, email UK, country, reputation_score)
- **VULNERABILITY**(**vuln_id** PK, title, description, severity, cvss_score, status, duplicate_of_vuln_id FK → VULNERABILITY.vuln_id, updated_at, submitted_date, program_id FK → PROGRAM.program_id, researcher_id FK → RESEARCHER.researcher_id)
- **PATCH**(**patch_id** PK, patch_date, verified_by, verification_status, verified_at, notes, vuln_id FK + UK → VULNERABILITY.vuln_id)
- **PAYOUT**(**payout_id** PK, amount, currency, payment_date, payment_status, created_at, vuln_id FK + UK → VULNERABILITY.vuln_id)

## Authentication and audit

- **APP_USER**(**user_id** PK, email UK, password_hash, role, researcher_id nullable FK + UK → RESEARCHER.researcher_id, display_name, is_active, created_at, last_login_at)
- **USER_SESSION**(**session_id** PK, user_id FK → APP_USER.user_id, token_hash UK, created_at, expires_at, revoked_at)
- **VULN_STATUS_HISTORY**(**history_id** PK, vuln_id FK → VULNERABILITY.vuln_id, old_status, new_status, changed_by_user_id nullable FK → APP_USER.user_id, changed_at, note)

## Vector synchronization outbox

- **VECTOR_SYNC_JOB**(**job_id** PK, vuln_id, operation, state, attempts, last_error, created_at, processed_at)

VECTOR_SYNC_JOB.vuln_id deliberately has no FK. The outbox must retain a DELETE operation after its VULNERABILITY row has been deleted.

## Integrity rules

- PROGRAM.status is ACTIVE, PAUSED or CLOSED.
- VULNERABILITY.severity and status are NOT NULL. CVSS is constrained to 0.0–10.0. DUPLICATE status is equivalent to a non-NULL duplicate_of_vuln_id.
- PATCH.verification_status is PENDING, VERIFIED or FAILED. A non-PENDING patch requires a verifier.
- PAYOUT.amount is non-negative; currency is USD, EUR or INR. COMPLETED payouts require payment_date.
- APP_USER.role is ADMIN or RESEARCHER. RESEARCHER accounts require a researcher_id; ADMIN accounts must not have one.
- USER_SESSION stores a SHA-256 token hash, not the raw session token, and expires_at must be later than created_at.
- Triggers maintain status history, enforce patch/payout lifecycle guards and enqueue vector synchronization in the same MySQL transaction.

## Source of truth

See database/migrations/ for the executable DDL and constraints. Qdrant is not a second relational database: it stores embeddings and filterable payload metadata derived from MySQL.
