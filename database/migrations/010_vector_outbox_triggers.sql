-- MySQL is the source of truth; outbox jobs commit in the same transaction
-- as report changes, so rollback cannot leave a false Qdrant update behind.
DROP TRIGGER IF EXISTS trg_vuln_outbox_ai;
DROP TRIGGER IF EXISTS trg_vuln_outbox_au;
DROP TRIGGER IF EXISTS trg_vuln_outbox_ad;
DELIMITER $$
CREATE TRIGGER trg_vuln_outbox_ai
AFTER INSERT ON VULNERABILITY FOR EACH ROW
BEGIN
 INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) VALUES(NEW.vuln_id,'UPSERT');
END$$
CREATE TRIGGER trg_vuln_outbox_au
AFTER UPDATE ON VULNERABILITY FOR EACH ROW
BEGIN
 IF NOT(OLD.title <=> NEW.title)
 OR NOT(OLD.description <=> NEW.description)
 OR NOT(OLD.status <=> NEW.status)
 OR NOT(OLD.severity <=> NEW.severity)
 OR NOT(OLD.program_id <=> NEW.program_id) THEN
  INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) VALUES(NEW.vuln_id,'UPSERT');
 END IF;
END$$
CREATE TRIGGER trg_vuln_outbox_ad
AFTER DELETE ON VULNERABILITY FOR EACH ROW
BEGIN
 INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) VALUES(OLD.vuln_id,'DELETE');
END$$
DELIMITER ;
