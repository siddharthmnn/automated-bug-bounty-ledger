-- =====================================================================
-- 008_program_management.sql
-- Delete guards preserve reviewed reports and financial/audit history.
-- Cascading deletes do not run child triggers, so parent guards enqueue
-- Qdrant DELETE jobs before MySQL removes submitted reports.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_program_delete_guard;
DROP TRIGGER IF EXISTS trg_company_delete_guard;
DROP VIEW IF EXISTS v_program_public;
DROP VIEW IF EXISTS v_program_stats;

DELIMITER $$
CREATE TRIGGER trg_program_delete_guard
BEFORE DELETE ON PROGRAM
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM VULNERABILITY
               WHERE program_id = OLD.program_id AND status <> 'SUBMITTED') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Program has reviewed reports; set its status to CLOSED instead of deleting it';
    END IF;
    INSERT INTO VECTOR_SYNC_JOB (vuln_id, operation)
    SELECT vuln_id, 'DELETE' FROM VULNERABILITY WHERE program_id = OLD.program_id;
END$$

CREATE TRIGGER trg_company_delete_guard
BEFORE DELETE ON COMPANY
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id = v.program_id
        WHERE p.company_id = OLD.company_id AND v.status <> 'SUBMITTED'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Company has reviewed reports; close its programs instead of deleting it';
    END IF;
    INSERT INTO VECTOR_SYNC_JOB (vuln_id, operation)
    SELECT v.vuln_id, 'DELETE'
    FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id = v.program_id
    WHERE p.company_id = OLD.company_id;
END$$
DELIMITER ;

-- Researchers have no table privileges: expose only active program metadata.
CREATE VIEW v_program_public AS
SELECT p.program_id, p.name AS program_name, p.scope, p.status,
       c.company_id, c.name AS company_name, c.industry, c.website,
       (SELECT COUNT(*) FROM VULNERABILITY v
         WHERE v.program_id=p.program_id AND v.status='ACCEPTED') AS accepted_reports
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
WHERE p.status='ACTIVE';

-- Aggregate independently to avoid multiplying payout totals by report joins.
CREATE VIEW v_program_stats AS
SELECT p.program_id,p.name AS program_name,p.status,c.company_id,c.name AS company_name,
       COALESCE(v.total_reports,0) AS total_reports,
       COALESCE(v.submitted,0) AS submitted,
       COALESCE(v.triaged,0) AS triaged,
       COALESCE(v.accepted,0) AS accepted,
       COALESCE(v.rejected,0) AS rejected,
       COALESCE(v.duplicates,0) AS duplicates,
       COALESCE(v.critical_reports,0) AS critical_reports,
       COALESCE(py.total_paid,0) AS total_paid
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN (
  SELECT program_id,COUNT(*) total_reports,
    SUM(status='SUBMITTED') submitted,SUM(status='TRIAGED') triaged,
    SUM(status='ACCEPTED') accepted,SUM(status='REJECTED') rejected,
    SUM(status='DUPLICATE') duplicates,SUM(severity='CRITICAL') critical_reports
  FROM VULNERABILITY GROUP BY program_id
) v ON v.program_id=p.program_id
LEFT JOIN (
  SELECT v.program_id,SUM(p.amount) total_paid
  FROM PAYOUT p JOIN VULNERABILITY v ON v.vuln_id=p.vuln_id
  WHERE p.payment_status='COMPLETED' GROUP BY v.program_id
) py ON py.program_id=p.program_id;

GRANT SELECT ON v_program_public TO role_researcher_app, role_admin_app;
GRANT SELECT ON v_program_stats TO role_admin_app;
