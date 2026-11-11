-- Status history is maintained by database triggers, not client-supplied fields.
DROP TRIGGER IF EXISTS trg_vuln_history_ai;
DROP TRIGGER IF EXISTS trg_vuln_history_au;
DROP TRIGGER IF EXISTS trg_vuln_duplicate_guard;
DELIMITER $$
CREATE TRIGGER trg_vuln_history_ai
AFTER INSERT ON VULNERABILITY FOR EACH ROW
BEGIN
 INSERT INTO VULN_STATUS_HISTORY(vuln_id,old_status,new_status,changed_by_user_id,note)
 VALUES(NEW.vuln_id,NULL,NEW.status,@app_user_id,'Report submitted');
END$$
CREATE TRIGGER trg_vuln_history_au
AFTER UPDATE ON VULNERABILITY FOR EACH ROW
BEGIN
 IF NOT (OLD.status <=> NEW.status) THEN
  INSERT INTO VULN_STATUS_HISTORY(vuln_id,old_status,new_status,changed_by_user_id,note)
  VALUES(NEW.vuln_id,OLD.status,NEW.status,@app_user_id,@app_status_note);
 END IF;
END$$
-- A CHECK cannot detect cycles across rows, so enforce the chain here.
CREATE TRIGGER trg_vuln_duplicate_guard
BEFORE UPDATE ON VULNERABILITY FOR EACH ROW
BEGIN
 DECLARE v_cycle INT DEFAULT 0;
 IF NEW.duplicate_of_vuln_id IS NOT NULL THEN
  IF NEW.duplicate_of_vuln_id=NEW.vuln_id THEN
   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='A report cannot be a duplicate of itself';
  END IF;
  WITH RECURSIVE chain(vuln_id,duplicate_of_vuln_id,depth) AS (
   SELECT vuln_id,duplicate_of_vuln_id,1 FROM VULNERABILITY WHERE vuln_id=NEW.duplicate_of_vuln_id
   UNION ALL
   SELECT v.vuln_id,v.duplicate_of_vuln_id,c.depth+1
   FROM VULNERABILITY v JOIN chain c ON v.vuln_id=c.duplicate_of_vuln_id
   WHERE c.depth<50
  )
  SELECT COUNT(*) INTO v_cycle FROM chain WHERE vuln_id=NEW.vuln_id;
  IF v_cycle>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Duplicate link would create a cycle'; END IF;
 END IF;
END$$
DELIMITER ;
