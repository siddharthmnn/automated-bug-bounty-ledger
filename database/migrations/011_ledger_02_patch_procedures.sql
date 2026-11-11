-- Stored procedure API for patch creation and verification.
DROP PROCEDURE IF EXISTS sp_record_patch;
DROP PROCEDURE IF EXISTS sp_verify_patch;
DELIMITER $$
CREATE PROCEDURE sp_record_patch(IN p_vuln_id INT,IN p_patch_date DATE,IN p_notes VARCHAR(300))
SQL SECURITY DEFINER
BEGIN
 IF p_patch_date IS NULL OR p_patch_date>CURRENT_DATE
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Patch date is required and cannot be in the future'; END IF;
 INSERT INTO PATCH(patch_date,verification_status,notes,vuln_id)
 VALUES(p_patch_date,'PENDING',NULLIF(TRIM(p_notes),''),p_vuln_id);
 SELECT LAST_INSERT_ID() AS patch_id;
END$$
CREATE PROCEDURE sp_verify_patch(IN p_patch_id INT,IN p_result VARCHAR(10),IN p_verified_by VARCHAR(100),IN p_notes VARCHAR(300))
SQL SECURITY DEFINER
BEGIN
 DECLARE v_status VARCHAR(10);
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 IF p_result NOT IN('VERIFIED','FAILED')
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Verification result must be VERIFIED or FAILED'; END IF;
 START TRANSACTION;
 SELECT verification_status INTO v_status FROM PATCH WHERE patch_id=p_patch_id FOR UPDATE;
 IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Patch not found';
 ELSEIF v_status='VERIFIED' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Patch is already verified'; END IF;
 UPDATE PATCH SET verification_status=p_result,verified_by=p_verified_by,verified_at=NOW(),
 notes=COALESCE(NULLIF(TRIM(p_notes),''),notes) WHERE patch_id=p_patch_id;
 COMMIT;
 SELECT p_patch_id AS patch_id,p_result AS verification_status;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_record_patch TO role_admin_app;
GRANT EXECUTE ON PROCEDURE sp_verify_patch TO role_admin_app;
