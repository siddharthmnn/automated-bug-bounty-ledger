-- Stored procedure API for one-time payout completion and owner-scoped reads.
DROP PROCEDURE IF EXISTS sp_create_payout;
DROP PROCEDURE IF EXISTS sp_complete_payout;
DROP PROCEDURE IF EXISTS sp_my_payouts;
DELIMITER $$
CREATE PROCEDURE sp_create_payout(IN p_vuln_id INT,IN p_amount DECIMAL(10,2),IN p_currency VARCHAR(10))
SQL SECURITY DEFINER
BEGIN
 IF p_amount IS NULL OR p_amount<=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Payout amount must be greater than zero'; END IF;
 INSERT INTO PAYOUT(amount,currency,payment_status,vuln_id)
 VALUES(p_amount,UPPER(COALESCE(p_currency,'USD')),'PENDING',p_vuln_id);
 SELECT LAST_INSERT_ID() AS payout_id;
END$$
CREATE PROCEDURE sp_complete_payout(IN p_payout_id INT,IN p_result VARCHAR(10),IN p_payment_date DATE)
SQL SECURITY DEFINER
BEGIN
 DECLARE v_status VARCHAR(10);
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 IF p_result NOT IN('COMPLETED','FAILED') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Result must be COMPLETED or FAILED'; END IF;
 START TRANSACTION;
 SELECT payment_status INTO v_status FROM PAYOUT WHERE payout_id=p_payout_id FOR UPDATE;
 IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Payout not found'; END IF;
 IF v_status<>'PENDING' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Payout has already been processed'; END IF;
 UPDATE PAYOUT SET payment_status=p_result,
 payment_date=CASE WHEN p_result='COMPLETED' THEN COALESCE(p_payment_date,CURRENT_DATE) ELSE p_payment_date END
 WHERE payout_id=p_payout_id;
 COMMIT;
 SELECT p_payout_id AS payout_id,p_result AS payment_status;
END$$
CREATE PROCEDURE sp_my_payouts(IN p_user_id INT)
SQL SECURITY DEFINER
BEGIN
 SELECT py.payout_id,py.amount,py.currency,py.payment_status,py.payment_date,
 v.vuln_id,v.title,v.severity,p.name AS program_name,c.name AS company_name
 FROM PAYOUT py JOIN VULNERABILITY v ON v.vuln_id=py.vuln_id
 JOIN APP_USER u ON u.researcher_id=v.researcher_id
 JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
 WHERE u.user_id=p_user_id ORDER BY COALESCE(py.payment_date,py.created_at) DESC;
END$$
DELIMITER ;
GRANT EXECUTE ON PROCEDURE sp_create_payout TO role_admin_app;
GRANT EXECUTE ON PROCEDURE sp_complete_payout TO role_admin_app;
GRANT EXECUTE ON PROCEDURE sp_my_payouts TO role_researcher_app;
GRANT EXECUTE ON FUNCTION fn_severity_from_cvss TO role_admin_app;
GRANT EXECUTE ON FUNCTION fn_researcher_earnings TO role_admin_app;
