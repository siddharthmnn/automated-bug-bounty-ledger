-- DBMS Level 3: safe, repeatable DML demonstration.
-- Run on a disposable/dev copy of bug_bounty_ledger using a privileged
-- MySQL Workbench connection. The script demonstrates INSERT, SELECT,
-- UPDATE and DELETE with linked synthetic rows, then ROLLBACKs all changes.
-- Do not run against production data. Auto-increment counters may advance.

USE bug_bounty_ledger;
START TRANSACTION;

SET @demo_marker=CONCAT('DML-DEMO-',UUID_SHORT());
SET @demo_email=CONCAT('dml-demo-',UUID_SHORT(),'@example.test');

-- INSERT: create related company, program, researcher and report rows.
INSERT INTO COMPANY(name,industry,website)
VALUES(CONCAT(@demo_marker,' Company'),'Software','https://example.test');
SET @demo_company_id=LAST_INSERT_ID();

INSERT INTO PROGRAM(name,scope,status,company_id)
VALUES(CONCAT(@demo_marker,' Program'),'demo.example.test/*','ACTIVE',@demo_company_id);
SET @demo_program_id=LAST_INSERT_ID();

INSERT INTO RESEARCHER(name,email,country,reputation_score)
VALUES('DML Demo Researcher',@demo_email,'India',0);
SET @demo_researcher_id=LAST_INSERT_ID();

INSERT INTO VULNERABILITY(title,description,severity,cvss_score,status,submitted_date,program_id,researcher_id)
VALUES(CONCAT(@demo_marker,' sample report'),
       'Synthetic row created only to demonstrate DML statements.',
       'LOW',2.0,'SUBMITTED',CURRENT_DATE,@demo_program_id,@demo_researcher_id);
SET @demo_vuln_id=LAST_INSERT_ID();

-- SELECT: retrieve the inserted report through relational joins.
SELECT v.vuln_id,v.title,v.status,r.name AS researcher,p.name AS program,c.name AS company
FROM VULNERABILITY v
JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
JOIN PROGRAM p ON p.program_id=v.program_id
JOIN COMPANY c ON c.company_id=p.company_id
WHERE v.vuln_id=@demo_vuln_id;

-- UPDATE: change the still-SUBMITTED report and read the new values.
UPDATE VULNERABILITY
SET title=CONCAT(@demo_marker,' updated sample report'),
    description='Synthetic report updated to demonstrate the UPDATE statement.'
WHERE vuln_id=@demo_vuln_id AND status='SUBMITTED';

SELECT vuln_id,title,description FROM VULNERABILITY WHERE vuln_id=@demo_vuln_id;

-- DELETE: remove this disposable, unreviewed report (withdrawal semantics).
DELETE FROM VULNERABILITY
WHERE vuln_id=@demo_vuln_id AND status='SUBMITTED';

-- Verify the row is gone within this transaction.
SELECT COUNT(*) AS remaining_demo_reports
FROM VULNERABILITY WHERE vuln_id=@demo_vuln_id;

-- Remove remaining disposable parent rows in foreign-key-safe order.
DELETE FROM PROGRAM WHERE program_id=@demo_program_id;
DELETE FROM COMPANY WHERE company_id=@demo_company_id;
DELETE FROM RESEARCHER WHERE researcher_id=@demo_researcher_id;

-- Discard all demo data. Review result sets above before running COMMIT instead.
ROLLBACK;
