-- Researcher reads are scoped by APP_USER.user_id inside DEFINER procedures.
DROP PROCEDURE IF EXISTS sp_my_reports;
DROP PROCEDURE IF EXISTS sp_my_report_detail;
DELIMITER $$
CREATE PROCEDURE sp_my_reports(IN p_user_id INT)
SQL SECURITY DEFINER
BEGIN
 SELECT v.vuln_id,v.title,v.severity,v.cvss_score,v.status,v.submitted_date,
        v.duplicate_of_vuln_id,p.program_id,p.name AS program_name,c.name AS company_name,
        py.amount AS payout_amount,py.currency AS payout_currency,py.payment_status
 FROM VULNERABILITY v JOIN APP_USER u ON u.researcher_id=v.researcher_id
 JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 WHERE u.user_id=p_user_id ORDER BY v.submitted_date DESC,v.vuln_id DESC;
END$$
CREATE PROCEDURE sp_my_report_detail(IN p_user_id INT,IN p_vuln_id INT)
SQL SECURITY DEFINER
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM VULNERABILITY v JOIN APP_USER u ON u.researcher_id=v.researcher_id
  WHERE v.vuln_id=p_vuln_id AND u.user_id=p_user_id
 ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report not found'; END IF;
 SELECT v.vuln_id,v.title,v.description,v.severity,v.cvss_score,v.status,
        v.submitted_date,v.duplicate_of_vuln_id,v.updated_at,p.program_id,
        p.name AS program_name,c.name AS company_name,
        pt.verification_status AS patch_status,pt.patch_date,
        py.amount AS payout_amount,py.currency AS payout_currency,py.payment_status,py.payment_date
 FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
 JOIN COMPANY c ON c.company_id=p.company_id
 LEFT JOIN PATCH pt ON pt.vuln_id=v.vuln_id
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 WHERE v.vuln_id=p_vuln_id;
 SELECT h.old_status,h.new_status,h.changed_at,h.note
 FROM VULN_STATUS_HISTORY h WHERE h.vuln_id=p_vuln_id ORDER BY h.changed_at,h.history_id;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_my_reports TO role_researcher_app;
GRANT EXECUTE ON PROCEDURE sp_my_report_detail TO role_researcher_app;
