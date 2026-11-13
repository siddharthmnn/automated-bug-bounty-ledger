USE bug_bounty_ledger;

-- Q07: Companies where every program has at least one verified patch.
-- Relational division expressed as nested NOT EXISTS.
SELECT c.company_id,c.name AS company FROM COMPANY c
WHERE EXISTS(SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id)
AND NOT EXISTS(
 SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id
 AND NOT EXISTS(
  SELECT 1 FROM VULNERABILITY v JOIN PATCH pt ON pt.vuln_id=v.vuln_id
  WHERE v.program_id=p.program_id AND pt.verification_status='VERIFIED'
 )
)
ORDER BY c.name;

-- Q08: Researcher earnings ranked separately per currency.
-- CTE, conditional aggregation, RANK/DENSE_RANK and window PARTITION BY.
WITH earnings AS (
 SELECT r.researcher_id,r.name,r.country,py.currency,
        SUM(CASE WHEN py.payment_status='COMPLETED' THEN py.amount ELSE 0 END) AS earned,
        COUNT(DISTINCT CASE WHEN v.status='ACCEPTED' THEN v.vuln_id END) AS accepted
 FROM RESEARCHER r
 LEFT JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 GROUP BY r.researcher_id,r.name,r.country,py.currency
)
SELECT RANK() OVER(PARTITION BY currency ORDER BY earned DESC) AS earnings_rank,
       DENSE_RANK() OVER(ORDER BY accepted DESC) AS accepted_rank,
       name,country,currency,earned,accepted
FROM earnings ORDER BY currency,earnings_rank,name;

-- Q09: Monthly completed payouts and running totals, separated by currency.
-- CTE, GROUP BY, COUNT/SUM and window SUM OVER.
WITH monthly AS (
 SELECT currency,DATE_FORMAT(payment_date,'%Y-%m') AS month,
        COUNT(*) AS payouts,SUM(amount) AS paid
 FROM PAYOUT WHERE payment_status='COMPLETED'
 GROUP BY currency,DATE_FORMAT(payment_date,'%Y-%m')
)
SELECT currency,month,payouts,paid,
       SUM(paid) OVER(PARTITION BY currency ORDER BY month) AS running_total
FROM monthly ORDER BY currency,month;

-- Q10: Acceptance/duplicate/rejection counts per researcher.
-- Conditional aggregates, GROUP BY, HAVING and ORDER BY.
SELECT r.name,COUNT(*) AS reports,
       SUM(v.status='ACCEPTED') AS accepted,
       SUM(v.status='DUPLICATE') AS duplicates,
       SUM(v.status='REJECTED') AS rejected,
       ROUND(100*SUM(v.status='ACCEPTED')/COUNT(*),1) AS acceptance_pct
FROM RESEARCHER r JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
GROUP BY r.researcher_id,r.name
HAVING COUNT(*)>=2 ORDER BY acceptance_pct DESC,reports DESC;

-- Q11: Follow report 318's duplicate chain toward its canonical report.
-- Recursive CTE over the self-referencing duplicate relationship.
WITH RECURSIVE chain(vuln_id,title,duplicate_of_vuln_id,depth) AS (
 SELECT vuln_id,title,duplicate_of_vuln_id,0 FROM VULNERABILITY WHERE vuln_id=318
 UNION ALL
 SELECT v.vuln_id,v.title,v.duplicate_of_vuln_id,c.depth+1
 FROM VULNERABILITY v JOIN chain c ON v.vuln_id=c.duplicate_of_vuln_id
)
SELECT depth,vuln_id,title,duplicate_of_vuln_id FROM chain ORDER BY depth;

-- Q12: Average days from submission to verified patch by company.
-- Multi-table JOIN, DATEDIFF, AVG, COUNT, GROUP BY and ORDER BY.
SELECT c.name AS company,COUNT(*) AS verified_patches,
       ROUND(AVG(DATEDIFF(pt.patch_date,v.submitted_date)),1) AS avg_days_to_patch
FROM COMPANY c JOIN PROGRAM p ON p.company_id=c.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id
JOIN PATCH pt ON pt.vuln_id=v.vuln_id
WHERE pt.verification_status='VERIFIED'
GROUP BY c.company_id,c.name ORDER BY avg_days_to_patch;
