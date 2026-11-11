-- Admin review is transactional and serializes decisions with SELECT FOR UPDATE.
DROP PROCEDURE IF EXISTS sp_review_vulnerability;
DELIMITER $$
CREATE PROCEDURE sp_review_vulnerability(
 IN p_admin_user_id INT,IN p_vuln_id INT,IN p_new_status VARCHAR(10),
 IN p_duplicate_of INT,IN p_note VARCHAR(300)
)
SQL SECURITY DEFINER
BEGIN
 DECLARE v_status VARCHAR(10);DECLARE v_program_id INT;
 DECLARE v_orig_status VARCHAR(10);DECLARE v_orig_program INT;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION
 BEGIN
  ROLLBACK;SET @app_user_id=NULL,@app_status_note=NULL;RESIGNAL;
 END;
 IF NOT EXISTS(SELECT 1 FROM APP_USER WHERE user_id=p_admin_user_id AND role='ADMIN' AND is_active)
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Only an admin can review reports'; END IF;
 IF p_new_status NOT IN('TRIAGED','ACCEPTED','REJECTED','DUPLICATE')
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid review decision'; END IF;
 START TRANSACTION;
 SELECT status,program_id INTO v_status,v_program_id FROM VULNERABILITY WHERE vuln_id=p_vuln_id FOR UPDATE;
 IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report not found'; END IF;
 IF v_status NOT IN('SUBMITTED','TRIAGED') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report already has a final decision'; END IF;
 IF v_status=p_new_status THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Report already has this status'; END IF;
 IF p_new_status='DUPLICATE' THEN
  SELECT status,program_id INTO v_orig_status,v_orig_program FROM VULNERABILITY WHERE vuln_id=p_duplicate_of;
  IF v_orig_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Original report not found'; END IF;
  IF v_orig_program<>v_program_id THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Original report must be in the same program'; END IF;
  IF v_orig_status NOT IN('TRIAGED','ACCEPTED','DUPLICATE')
  THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Original report must be TRIAGED, ACCEPTED or DUPLICATE'; END IF;
 ELSE SET p_duplicate_of=NULL;
 END IF;
 SET @app_user_id=p_admin_user_id,@app_status_note=NULLIF(TRIM(p_note),'');
 UPDATE VULNERABILITY SET status=p_new_status,duplicate_of_vuln_id=p_duplicate_of WHERE vuln_id=p_vuln_id;
 SET @app_user_id=NULL,@app_status_note=NULL;
 COMMIT;
 SELECT p_vuln_id AS vuln_id,p_new_status AS status;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_review_vulnerability TO role_admin_app;
