-- Follow duplicate_of links upward and return the original report id.
DROP FUNCTION IF EXISTS fn_canonical_report;
DELIMITER $$
CREATE FUNCTION fn_canonical_report(p_vuln_id INT)
RETURNS INT READS SQL DATA
BEGIN
 DECLARE v_root INT;
 WITH RECURSIVE chain(vuln_id,duplicate_of_vuln_id,depth) AS (
  SELECT vuln_id,duplicate_of_vuln_id,0 FROM VULNERABILITY WHERE vuln_id=p_vuln_id
  UNION ALL
  SELECT v.vuln_id,v.duplicate_of_vuln_id,c.depth+1
  FROM VULNERABILITY v JOIN chain c ON v.vuln_id=c.duplicate_of_vuln_id
  WHERE c.depth<50
 )
 SELECT vuln_id INTO v_root FROM chain
 WHERE duplicate_of_vuln_id IS NULL ORDER BY depth DESC LIMIT 1;
 RETURN v_root;
END$$
DELIMITER ;
GRANT EXECUTE ON FUNCTION fn_canonical_report TO role_admin_app;
