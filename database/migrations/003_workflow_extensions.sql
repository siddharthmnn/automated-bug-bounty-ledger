-- =====================================================================
-- 003_workflow_extensions.sql  (Phase 2 extension: review workflow)
-- Changes to the Phase 1 VULNERABILITY table:
--  1. description VARCHAR(500) -> VARCHAR(4000): real write-ups are longer,
--     and this text is what the embedding model reads.
--  2. severity and status become NOT NULL (Phase 1 allowed NULL).
--  3. New self-referencing column duplicate_of_vuln_id: a unary 0..1 : M
--     relationship DUPLICATE_OF (many duplicates -> one original).
--  4. updated_at timestamp for auditing.
-- New table VULN_STATUS_HISTORY: audit trail, written only by triggers.
-- =====================================================================

ALTER TABLE VULNERABILITY
    MODIFY description VARCHAR(4000),
    MODIFY severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
    MODIFY status ENUM('SUBMITTED','TRIAGED','ACCEPTED','REJECTED','DUPLICATE')
        NOT NULL DEFAULT 'SUBMITTED',
    ADD COLUMN duplicate_of_vuln_id INT NULL AFTER status,
    ADD COLUMN updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD CONSTRAINT fk_vuln_duplicate_of FOREIGN KEY (duplicate_of_vuln_id)
        REFERENCES VULNERABILITY(vuln_id),
    -- A report is DUPLICATE exactly when it points at an original.
    ADD CONSTRAINT chk_vuln_duplicate_link CHECK (
        (status = 'DUPLICATE') = (duplicate_of_vuln_id IS NOT NULL)
    ),
    ADD CONSTRAINT chk_vuln_title_length CHECK (CHAR_LENGTH(TRIM(title)) >= 5);

CREATE TABLE VULN_STATUS_HISTORY (
    history_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    vuln_id             INT NOT NULL,
    old_status          ENUM('SUBMITTED','TRIAGED','ACCEPTED','REJECTED','DUPLICATE') NULL,
    new_status          ENUM('SUBMITTED','TRIAGED','ACCEPTED','REJECTED','DUPLICATE') NOT NULL,
    changed_by_user_id  INT NULL,
    changed_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note                VARCHAR(300) NULL,
    CONSTRAINT fk_history_vuln FOREIGN KEY (vuln_id)
        REFERENCES VULNERABILITY(vuln_id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES APP_USER(user_id) ON DELETE SET NULL,
    INDEX idx_history_vuln_time (vuln_id, changed_at)
);
