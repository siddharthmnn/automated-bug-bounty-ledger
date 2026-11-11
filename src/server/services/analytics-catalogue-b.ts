import type { CatalogueQuery } from "@/server/services/analytics-catalogue-a";
export const QUERY_B:CatalogueQuery[]=[
{id:"Q07",title:"Companies where every program has a verified patch",technique:"Relational division with double NOT EXISTS",sql:`SELECT c.company_id,c.name company FROM COMPANY c
WHERE EXISTS(SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id)
AND NOT EXISTS(SELECT 1 FROM PROGRAM p WHERE p.company_id=c.company_id
 AND NOT EXISTS(SELECT 1 FROM VULNERABILITY v JOIN PATCH pt ON pt.vuln_id=v.vuln_id
 WHERE v.program_id=p.program_id AND pt.verification_status='VERIFIED')) ORDER BY c.name`},
{id:"Q08",title:"Researcher earnings leaderboard ranked separately by currency",technique:"CTE + RANK() and DENSE_RANK() window functions",sql:`WITH earnings AS(
 SELECT r.researcher_id,r.name,r.country,py.currency,
 SUM(CASE WHEN py.payment_status='COMPLETED' THEN py.amount ELSE 0 END) earned,
 COUNT(DISTINCT CASE WHEN v.status='ACCEPTED' THEN v.vuln_id END) accepted
 FROM RESEARCHER r LEFT JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 GROUP BY r.researcher_id,r.name,r.country,py.currency)
SELECT RANK() OVER(PARTITION BY currency ORDER BY earned DESC) earnings_rank,
 DENSE_RANK() OVER(ORDER BY accepted DESC) accepted_rank,
 name,country,currency,earned,accepted FROM earnings ORDER BY currency,earnings_rank,name`},
{id:"Q09",title:"Monthly completed payouts and running total per currency",technique:"CTE + SUM() OVER running total",sql:`WITH monthly AS(
 SELECT currency,DATE_FORMAT(payment_date,'%Y-%m') month,COUNT(*) payouts,SUM(amount) paid
 FROM PAYOUT WHERE payment_status='COMPLETED'
 GROUP BY currency,DATE_FORMAT(payment_date,'%Y-%m'))
SELECT currency,month,payouts,paid,
 SUM(paid) OVER(PARTITION BY currency ORDER BY month) running_total
FROM monthly ORDER BY currency,month`},
{id:"Q10",title:"Acceptance rate per researcher (at least two reports)",technique:"Conditional aggregates + HAVING",sql:`SELECT r.name,COUNT(*) reports,SUM(v.status='ACCEPTED') accepted,
 SUM(v.status='DUPLICATE') duplicates,SUM(v.status='REJECTED') rejected,
 ROUND(100*SUM(v.status='ACCEPTED')/COUNT(*),1) acceptance_pct
FROM RESEARCHER r JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
GROUP BY r.researcher_id,r.name HAVING COUNT(*)>=2 ORDER BY acceptance_pct DESC,reports DESC`},
{id:"Q11",title:"Duplicate chain of report 318 back to its original",technique:"WITH RECURSIVE",sql:`WITH RECURSIVE chain(vuln_id,title,duplicate_of_vuln_id,depth) AS(
 SELECT vuln_id,title,duplicate_of_vuln_id,0 FROM VULNERABILITY WHERE vuln_id=318
 UNION ALL SELECT v.vuln_id,v.title,v.duplicate_of_vuln_id,c.depth+1
 FROM VULNERABILITY v JOIN chain c ON v.vuln_id=c.duplicate_of_vuln_id)
SELECT depth,vuln_id,title,duplicate_of_vuln_id FROM chain ORDER BY depth`},
{id:"Q12",title:"Average days from submission to verified patch per company",technique:"JOIN + DATEDIFF + AVG + GROUP BY",sql:`SELECT c.name company,COUNT(*) verified_patches,
 ROUND(AVG(DATEDIFF(pt.patch_date,v.submitted_date)),1) avg_days_to_patch
FROM COMPANY c JOIN PROGRAM p ON p.company_id=c.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id JOIN PATCH pt ON pt.vuln_id=v.vuln_id
WHERE pt.verification_status='VERIFIED' GROUP BY c.company_id,c.name ORDER BY avg_days_to_patch`}
];
