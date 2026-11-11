-- =====================================================================
-- 002_auth_tables.sql  (Phase 2 extension: authentication)
-- New entities APP_USER and USER_SESSION.
--  * APP_USER  0..1 : 1  RESEARCHER  (a researcher has at most one login;
--    an ADMIN login has no researcher row).
--  * USER_SESSION  M : 1  APP_USER   (one user, many sessions/devices).
-- Login data is kept out of the Phase 1 RESEARCHER table on purpose:
-- admins are not researchers, and credentials are a separate concern.
-- =====================================================================

CREATE TABLE APP_USER (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(100) NOT NULL,
    password_hash  CHAR(60)     NOT NULL,           -- bcrypt hash, never the password
    role           ENUM('ADMIN','RESEARCHER') NOT NULL,
    researcher_id  INT NULL,
    display_name   VARCHAR(100) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at  DATETIME NULL,
    CONSTRAINT uq_app_user_email      UNIQUE (email),
    CONSTRAINT uq_app_user_researcher UNIQUE (researcher_id),
    -- No ON DELETE action here: MySQL forbids referential actions on a
    -- column that a CHECK constraint uses (see chk_app_user_role_link).
    CONSTRAINT fk_app_user_researcher FOREIGN KEY (researcher_id)
        REFERENCES RESEARCHER(researcher_id),
    -- A RESEARCHER login must point at a RESEARCHER row; an ADMIN must not.
    CONSTRAINT chk_app_user_role_link CHECK (
        (role = 'RESEARCHER' AND researcher_id IS NOT NULL) OR
        (role = 'ADMIN'      AND researcher_id IS NULL)
    ),
    CONSTRAINT chk_app_user_email CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE USER_SESSION (
    session_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT      NOT NULL,
    token_hash  CHAR(64) NOT NULL,                  -- SHA-256 of the cookie token
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME NOT NULL,
    revoked_at  DATETIME NULL,
    CONSTRAINT uq_session_token UNIQUE (token_hash),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id)
        REFERENCES APP_USER(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_session_expiry CHECK (expires_at > created_at)
);
