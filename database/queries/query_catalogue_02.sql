USE bug_bounty_ledger;
-- Q07: companies for which every program has a verified patch (relational division).
SELECT c.company_id,c.name FROM COMPANY c
WHERE EXISTS(SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id)
AND NOT EXISTS(SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id
 AND NOT EXISTS(SELECT 1 FROM VULNERABILITY v JOIN PATCH pt ON pt.vuln_id=v.vuln_id
 WHERE v.program_id=p.program_id AND pt.verification_status='VERIFIED'));
-- Q08: leaderboard ranking and ties (CTE + RANK + DENSE_RANK).
WITH earned AS(SELECT r.researcher_id,r.name,r.country,
 COALESCE(SUM(CASE WHEN py.payment_status='COMPLETED' THEN py.amount END),0) amount,
 COUNT(DISTINCT CASE WHEN v.status='ACCEPTED' THEN v.vuln_id END) accepted
 FROM RESEARCHER r LEFT JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id GROUP BY r.researcher_id,r.name,r.country)
SELECT RANK() OVER(ORDER BY amount DESC) earnings_rank,DENSE_RANK() OVER(ORDER BY accepted DESC) accepted_rank,name,country,amount,accepted FROM earned;
-- Q09: monthly payouts and running total (CTE + window SUM).
WITH monthly AS(SELECT DATE_FORMAT(payment_date,'%Y-%m') month,COUNT(*) count,SUM(amount) paid
 FROM PAYOUT WHERE payment_status='COMPLETED' GROUP BY DATE_FORMAT(payment_date,'%Y-%m'))
SELECT month,count,paid,SUM(paid) OVER(ORDER BY month) running_total FROM monthly;
-- Q10: per-researcher acceptance rate (conditional aggregate + HAVING).
SELECT r.name,COUNT(*) reports,SUM(v.status='ACCEPTED') accepted,
 ROUND(100*SUM(v.status='ACCEPTED')/COUNT(*),1) acceptance_pct
FROM RESEARCHER r JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
GROUP BY r.researcher_id,r.name HAVING COUNT(*)>=2;
-- Q11: recursive duplicate chain from report 318 to its original.
WITH RECURSIVE chain(vuln_id,title,duplicate_of_vuln_id,depth) AS(
 SELECT vuln_id,title,duplicate_of_vuln_id,0 FROM VULNERABILITY WHERE vuln_id=318
 UNION ALL SELECT v.vuln_id,v.title,v.duplicate_of_vuln_id,c.depth+1
 FROM VULNERABILITY v JOIN chain c ON v.vuln_id=c.duplicate_of_vuln_id)
SELECT depth,vuln_id,title,duplicate_of_vuln_id FROM chain ORDER BY depth;
-- Q12: mean time to verified patch by company.
SELECT c.name,COUNT(*) verified_patches,ROUND(AVG(DATEDIFF(pt.patch_date,v.submitted_date)),1) avg_days
FROM COMPANY c JOIN PROGRAM p ON p.company_id=c.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id JOIN PATCH pt ON pt.vuln_id=v.vuln_id
WHERE pt.verification_status='VERIFIED' GROUP BY c.company_id,c.name;
