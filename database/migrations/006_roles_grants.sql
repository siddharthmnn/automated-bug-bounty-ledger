-- =====================================================================
-- 006_roles_grants.sql  (database-level RBAC)
-- MySQL 8 roles = named bundles of privileges. Login accounts are created
-- by scripts/db-users.sh (passwords come from .env, never from git) and
-- are granted exactly one role each.
--
--   role_auth            login/register/session lookup only
--   role_admin_app       admin reads domain data and invokes controlled
--                        procedures; no direct vulnerability/ledger DML
--   role_researcher_app  no direct table access; views/procedures only
--   role_vector_sync     Qdrant sync worker: read reports, manage outbox
--
-- MySQL has no row-level security: GRANT controls WHICH OPERATIONS an
-- account may run, not WHICH ROWS. Ownership is enforced inside stored
-- procedures using the user id taken from the authenticated session.
-- =====================================================================

CREATE ROLE IF NOT EXISTS role_auth, role_admin_app, role_researcher_app, role_vector_sync;

-- ---------- role_auth ----------
GRANT SELECT ON APP_USER TO role_auth;
GRANT UPDATE (last_login_at) ON APP_USER TO role_auth;
GRANT SELECT, INSERT, UPDATE ON USER_SESSION TO role_auth;

-- ---------- role_admin_app ----------
GRANT SELECT, INSERT, UPDATE ON COMPANY TO role_admin_app;
GRANT DELETE ON COMPANY TO role_admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON PROGRAM TO role_admin_app;
GRANT SELECT, UPDATE ON RESEARCHER TO role_admin_app;

-- Vulnerability, patch and payout writes must go through the audited
-- stored procedures introduced by later migrations. Direct DML would
-- bypass transition validation and could destroy ledger/history records.
GRANT SELECT ON VULNERABILITY TO role_admin_app;
GRANT SELECT ON PATCH TO role_admin_app;
GRANT SELECT ON PAYOUT TO role_admin_app;
GRANT SELECT ON VULN_STATUS_HISTORY TO role_admin_app;

-- Admin UI may inspect and retry vector sync jobs. It cannot alter reports.
GRANT SELECT, UPDATE ON VECTOR_SYNC_JOB TO role_admin_app;

-- Column-level SELECT: admins can list users but cannot read password_hash.
GRANT SELECT (user_id, email, role, researcher_id, display_name, is_active, created_at, last_login_at)
    ON APP_USER TO role_admin_app;

-- ---------- role_researcher_app ----------
-- Intentionally no table privileges. Views/procedures are granted later.

-- ---------- role_vector_sync ----------
GRANT SELECT ON VULNERABILITY TO role_vector_sync;
GRANT SELECT ON PROGRAM TO role_vector_sync;
GRANT SELECT, INSERT, UPDATE ON VECTOR_SYNC_JOB TO role_vector_sync;
