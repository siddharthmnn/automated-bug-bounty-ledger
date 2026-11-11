-- =====================================================================
-- 007_auth_procedures.sql
-- Creates a researcher profile and its login in one transaction.
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_register_researcher;
DELIMITER $$
CREATE PROCEDURE sp_register_researcher(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_country VARCHAR(50),
    IN p_password_hash CHAR(60)
)
SQL SECURITY DEFINER
BEGIN
    DECLARE v_researcher_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) < 2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Name must be at least 2 characters';
    END IF;
    IF p_password_hash IS NULL OR CHAR_LENGTH(p_password_hash) <> 60 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid password hash';
    END IF;
    START TRANSACTION;
      INSERT INTO RESEARCHER (name,email,country,reputation_score)
      VALUES (TRIM(p_name),LOWER(TRIM(p_email)),NULLIF(TRIM(p_country),''),0);
      SET v_researcher_id=LAST_INSERT_ID();
      INSERT INTO APP_USER (email,password_hash,role,researcher_id,display_name)
      VALUES (LOWER(TRIM(p_email)),p_password_hash,'RESEARCHER',v_researcher_id,TRIM(p_name));
    COMMIT;
    SELECT LAST_INSERT_ID() AS user_id,v_researcher_id AS researcher_id;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_register_researcher TO role_auth;
