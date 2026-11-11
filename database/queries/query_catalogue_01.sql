USE bug_bounty_ledger;
-- Q01: six-table report / patch / payout join (latest patch per report).
SELECT v.vuln_id,v.title,r.name researcher,p.name program,c.name company,pt.verification_status,py.payment_status
FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN PATCH pt ON pt.patch_id=(SELECT MAX(x.patch_id) FROM PATCH x WHERE x.vuln_id=v.vuln_id)
LEFT JOIN PAYOUT py ON py.payout_id=(SELECT MAX(y.payout_id) FROM PAYOUT y WHERE y.vuln_id=v.vuln_id)
WHERE v.status='ACCEPTED';
-- Q02: accepted reports without payouts (anti-join).
SELECT v.vuln_id,v.title,r.name researcher FROM VULNERABILITY v
JOIN RESEARCHER r ON r.researcher_id=v.researcher_id LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
WHERE v.status='ACCEPTED' AND py.payout_id IS NULL;
-- Q03: high/critical reports per program (GROUP BY/HAVING).
SELECT p.name program,c.name company,COUNT(*) report_count,MAX(v.cvss_score) worst_cvss
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id WHERE v.severity IN('HIGH','CRITICAL')
GROUP BY p.program_id,p.name,c.name HAVING COUNT(*)>=2;
-- Q04: researcher earnings above their country average (correlated subquery + function).
SELECT r.name,fn_researcher_earnings(r.researcher_id) earned FROM RESEARCHER r
WHERE fn_researcher_earnings(r.researcher_id)>(SELECT AVG(fn_researcher_earnings(r2.researcher_id))
FROM RESEARCHER r2 WHERE r2.country=r.country);
-- Q05: report CVSS above its own program average (correlated scalar subquery).
SELECT v.vuln_id,v.title,v.cvss_score,p.name program,
(SELECT AVG(v2.cvss_score) FROM VULNERABILITY v2 WHERE v2.program_id=v.program_id) program_avg
FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
WHERE v.cvss_score>(SELECT AVG(v2.cvss_score) FROM VULNERABILITY v2 WHERE v2.program_id=v.program_id);
-- Q06: programs with no accepted reports (nested NOT EXISTS).
SELECT p.program_id,p.name FROM PROGRAM p WHERE NOT EXISTS(
 SELECT 1 FROM VULNERABILITY v WHERE v.program_id=p.program_id AND v.status='ACCEPTED');
