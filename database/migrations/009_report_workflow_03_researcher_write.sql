-- Researcher write procedures derive researcher_id from authenticated user_id.
DROP PROCEDURE IF EXISTS sp_submit_vulnerability;
DROP PROCEDURE IF EXISTS sp_update_my_report;
DROP PROCEDURE IF EXISTS sp_withdraw_my_report;
DELIMITER $$
CREATE PROCEDURE sp_submit_vulnerability(
 IN p_user_id INT,IN p_program_id INT,IN p_title VARCHAR(150),
 IN p_description VARCHAR(4000),IN p_severity VARCHAR(10),IN p_cvss DECIMAL(3,1)
)
SQL SECURITY DEFINER
BEGIN
 DECLARE v_researcher_id INT;DECLARE v_program_status VARCHAR(10);
 SELECT researcher_id INTO v_researcher_id FROM APP_USER
 WHERE user_id=p_user_id AND role='RESEARCHER' AND is_active;
 IF v_researcher_id IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Only an active researcher can submit reports'; END IF;
 SELECT status INTO v_program_status FROM PROGRAM WHERE program_id=p_program_id;
 IF v_program_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Program not found';
 ELSEIF v_program_status<>'ACTIVE' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Program is not accepting reports'; END IF;
 SET @app_user_id=p_user_id;
 INSERT INTO VULNERABILITY(title,description,severity,cvss_score,status,submitted_date,program_id,researcher_id)
 VALUES(TRIM(p_title),TRIM(p_description),p_severity,p_cvss,'SUBMITTED',CURRENT_DATE,p_program_id,v_researcher_id);
 SET @app_user_id=NULL;
 SELECT LAST_INSERT_ID() AS vuln_id;
END$$
CREATE PROCEDURE sp_update_my_report(
 IN p_user_id INT,IN p_vuln_id INT,IN p_title VARCHAR(150),
 IN p_description VARCHAR(4000),IN p_severity VARCHAR(10),IN p_cvss DECIMAL(3,1)
)
SQL SECURITY DEFINER
BEGIN
 DECLARE v_rows INT;
 UPDATE VULNERABILITY v JOIN APP_USER u ON u.researcher_id=v.researcher_id
 SET v.title=TRIM(p_title),v.description=TRIM(p_description),v.severity=p_severity,v.cvss_score=p_cvss
 WHERE v.vuln_id=p_vuln_id AND u.user_id=p_user_id AND v.status='SUBMITTED';
 SET v_rows=ROW_COUNT();
 IF v_rows=0 AND NOT EXISTS(
  SELECT 1 FROM VULNERABILITY v JOIN APP_USER u ON u.researcher_id=v.researcher_id
  WHERE v.vuln_id=p_vuln_id AND u.user_id=p_user_id AND v.status='SUBMITTED'
 ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report not found, not yours, or already under review'; END IF;
 SELECT p_vuln_id AS vuln_id;
END$$
CREATE PROCEDURE sp_withdraw_my_report(IN p_user_id INT,IN p_vuln_id INT)
SQL SECURITY DEFINER
BEGIN
 DELETE v FROM VULNERABILITY v JOIN APP_USER u ON u.researcher_id=v.researcher_id
 WHERE v.vuln_id=p_vuln_id AND u.user_id=p_user_id AND v.status='SUBMITTED';
 IF ROW_COUNT()=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report not found, not yours, or already under review'; END IF;
 SELECT p_vuln_id AS vuln_id;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_submit_vulnerability TO role_researcher_app;
GRANT EXECUTE ON PROCEDURE sp_update_my_report TO role_researcher_app;
GRANT EXECUTE ON PROCEDURE sp_withdraw_my_report TO role_researcher_app;
