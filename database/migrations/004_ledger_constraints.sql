-- =====================================================================
-- 004_ledger_constraints.sql  (Phase 2 extension: ledger integrity + outbox)
-- Tightens PATCH, PAYOUT and PROGRAM, and adds the VECTOR_SYNC_JOB table
-- that keeps Qdrant in step with MySQL (transactional outbox pattern).
-- =====================================================================

ALTER TABLE PROGRAM
    MODIFY status ENUM('ACTIVE','PAUSED','CLOSED') NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE PATCH
    MODIFY verification_status ENUM('PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN verified_at DATETIME NULL AFTER verification_status,
    -- Someone must be named once a patch has been checked.
    ADD CONSTRAINT chk_patch_verifier CHECK (
        verification_status = 'PENDING' OR verified_by IS NOT NULL
    );

ALTER TABLE PAYOUT
    MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    MODIFY payment_status ENUM('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD CONSTRAINT chk_payout_currency CHECK (currency IN ('USD','EUR','INR')),
    -- A completed payment must say when it was paid.
    ADD CONSTRAINT chk_payout_completed_date CHECK (
        payment_status <> 'COMPLETED' OR payment_date IS NOT NULL
    );

-- Outbox: one row per pending change that Qdrant must mirror.
-- vuln_id has no FOREIGN KEY on purpose: a DELETE job must survive the
-- deletion of the report it refers to.
CREATE TABLE VECTOR_SYNC_JOB (
    job_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    vuln_id       INT NOT NULL,
    operation     ENUM('UPSERT','DELETE') NOT NULL,
    state         ENUM('PENDING','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
    attempts      INT NOT NULL DEFAULT 0,
    last_error    VARCHAR(500) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at  DATETIME NULL,
    CONSTRAINT chk_sync_attempts CHECK (attempts BETWEEN 0 AND 100)
);
