-- =====================================================================
-- 006_roles_grants.sql  (database-level RBAC)
-- MySQL 8 roles = named bundles of privileges. Login accounts are created
-- by scripts/db-users.sh (passwords come from .env, never from git) and
-- are granted exactly one role each.
--
--   role_auth            login/register/session lookup only
--   role_admin_app       ADMIN requests: read/write domain tables, no DDL,
--                        cannot DELETE payouts or history, cannot read password hashes
--   role_researcher_app  RESEARCHER requests: NO direct table access at all;
--                        only views and stored procedures (granted in later migrations)
--   role_vector_sync     the Qdrant sync worker: read reports, manage the outbox
--
-- MySQL has no row-level security: GRANT controls WHICH OPERATIONS an
-- account may run, not WHICH ROWS. Ownership ("only my reports") is enforced
-- inside stored procedures using the user id that the server takes from the session.
-- Unqualified table names refer to the database this migration runs in.
-- =====================================================================

CREATE ROLE IF NOT EXISTS role_auth, role_admin_app, role_researcher_app, role_vector_sync;

-- ---------- role_auth ----------
GRANT SELECT ON APP_USER TO role_auth;
GRANT UPDATE (last_login_at) ON APP_USER TO role_auth;      -- column-level privilege
GRANT SELECT, INSERT, UPDATE ON USER_SESSION TO role_auth;

-- ---------- role_admin_app ----------
GRANT SELECT, INSERT, UPDATE         ON COMPANY       TO role_admin_app;
GRANT DELETE                         ON COMPANY       TO role_admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON PROGRAM       TO role_admin_app;
GRANT SELECT, UPDATE                 ON RESEARCHER    TO role_admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON VULNERABILITY TO role_admin_app;
GRANT SELECT, INSERT, UPDATE         ON PATCH         TO role_admin_app;
GRANT SELECT, INSERT, UPDATE         ON PAYOUT        TO role_admin_app;   -- no DELETE: ledger rows are permanent
GRANT SELECT                         ON VULN_STATUS_HISTORY TO role_admin_app;  -- read-only audit trail
GRANT SELECT, UPDATE                 ON VECTOR_SYNC_JOB TO role_admin_app;  -- view and retry sync jobs
-- Column-level SELECT: admins can list users but can never read password_hash.
GRANT SELECT (user_id, email, role, researcher_id, display_name, is_active, created_at, last_login_at)
    ON APP_USER TO role_admin_app;

-- ---------- role_researcher_app ----------
-- Intentionally no table privileges. See migrations 008, 009, 011, 012, 013.

-- ---------- role_vector_sync ----------
GRANT SELECT ON VULNERABILITY TO role_vector_sync;
GRANT SELECT ON PROGRAM       TO role_vector_sync;
GRANT SELECT, INSERT, UPDATE ON VECTOR_SYNC_JOB TO role_vector_sync;
