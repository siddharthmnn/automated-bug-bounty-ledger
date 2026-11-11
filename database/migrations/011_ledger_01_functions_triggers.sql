-- =====================================================================
-- 011_ledger_01_functions_triggers.sql
-- Patch/payout state guards, CVSS banding, earnings and reputation.
-- =====================================================================
DROP FUNCTION IF EXISTS fn_severity_from_cvss;
DROP FUNCTION IF EXISTS fn_researcher_earnings;
DROP TRIGGER IF EXISTS trg_patch_guard_bi;
DROP TRIGGER IF EXISTS trg_payout_guard_bi;
DROP TRIGGER IF EXISTS trg_vuln_reputation_au;

DELIMITER $$
CREATE FUNCTION fn_severity_from_cvss(p_score DECIMAL(3,1))
RETURNS VARCHAR(10) DETERMINISTIC NO SQL
BEGIN
 RETURN CASE WHEN p_score IS NULL THEN NULL
  WHEN p_score>=9.0 THEN 'CRITICAL' WHEN p_score>=7.0 THEN 'HIGH'
  WHEN p_score>=4.0 THEN 'MEDIUM' ELSE 'LOW' END;
END$$

-- The legacy single-number API is deliberately NULL for multi-currency
-- researchers. Callers needing a breakdown must GROUP BY currency.
CREATE FUNCTION fn_researcher_earnings(p_researcher_id INT)
RETURNS DECIMAL(12,2) READS SQL DATA
BEGIN
 DECLARE v_currency_count INT DEFAULT 0;
 DECLARE v_total DECIMAL(12,2) DEFAULT 0;
 SELECT COUNT(DISTINCT py.currency),COALESCE(SUM(py.amount),0)
 INTO v_currency_count,v_total
 FROM PAYOUT py JOIN VULNERABILITY v ON v.vuln_id=py.vuln_id
 WHERE v.researcher_id=p_researcher_id AND py.payment_status='COMPLETED';
 IF v_currency_count>1 THEN RETURN NULL; END IF;
 RETURN v_total;
END$$

CREATE TRIGGER trg_patch_guard_bi BEFORE INSERT ON PATCH FOR EACH ROW
BEGIN
 IF COALESCE((SELECT status FROM VULNERABILITY WHERE vuln_id=NEW.vuln_id),'')<>'ACCEPTED'
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='A patch can only be recorded for an ACCEPTED report'; END IF;
END$$
CREATE TRIGGER trg_payout_guard_bi BEFORE INSERT ON PAYOUT FOR EACH ROW
BEGIN
 IF COALESCE((SELECT status FROM VULNERABILITY WHERE vuln_id=NEW.vuln_id),'')<>'ACCEPTED'
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='A payout can only be created for an ACCEPTED report'; END IF;
END$$
CREATE TRIGGER trg_vuln_reputation_au AFTER UPDATE ON VULNERABILITY FOR EACH ROW
BEGIN
 IF NEW.status='ACCEPTED' AND OLD.status<>'ACCEPTED' THEN
  UPDATE RESEARCHER SET reputation_score=COALESCE(reputation_score,0)+
   CASE NEW.severity WHEN 'CRITICAL' THEN 100 WHEN 'HIGH' THEN 50 WHEN 'MEDIUM' THEN 25 ELSE 10 END
  WHERE researcher_id=NEW.researcher_id;
 END IF;
END$$
DELIMITER ;
