export interface CatalogueQuery {id:string;title:string;technique:string;sql:string;}
export const QUERY_A:CatalogueQuery[]=[
{id:"Q01",title:"Accepted reports with researcher, program, company, patch and payout",technique:"Multi-table JOIN with optional LEFT JOINs",sql:`SELECT v.vuln_id,v.title,v.severity,r.name researcher,p.name program,c.name company,pt.verification_status patch,py.payment_status payout
FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN PATCH pt ON pt.patch_id=(SELECT MAX(x.patch_id) FROM PATCH x WHERE x.vuln_id=v.vuln_id)
LEFT JOIN PAYOUT py ON py.payout_id=(SELECT MAX(x.payout_id) FROM PAYOUT x WHERE x.vuln_id=v.vuln_id)
WHERE v.status='ACCEPTED' ORDER BY c.name,v.vuln_id`},
{id:"Q02",title:"Accepted reports that still have no payout",technique:"Anti-join (LEFT JOIN ... IS NULL)",sql:`SELECT v.vuln_id,v.title,v.severity,r.name researcher,v.submitted_date
FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
WHERE v.status='ACCEPTED' AND py.payout_id IS NULL ORDER BY v.submitted_date`},
{id:"Q03",title:"Programs with at least two HIGH or CRITICAL reports",technique:"GROUP BY + HAVING + ORDER BY",sql:`SELECT p.program_id,p.name program,c.name company,COUNT(*) high_or_critical,MAX(v.cvss_score) worst_cvss
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id
WHERE v.severity IN('HIGH','CRITICAL') GROUP BY p.program_id,p.name,c.name
HAVING COUNT(*)>=2 ORDER BY high_or_critical DESC,worst_cvss DESC`},
{id:"Q04",title:"Researchers earning above their own country average",technique:"Correlated subquery + stored function",sql:`SELECT r.researcher_id,r.name,r.country,fn_researcher_earnings(r.researcher_id) earned
FROM RESEARCHER r
WHERE fn_researcher_earnings(r.researcher_id)>(
 SELECT AVG(fn_researcher_earnings(r2.researcher_id)) FROM RESEARCHER r2 WHERE r2.country=r.country)
ORDER BY earned DESC`},
{id:"Q05",title:"Reports whose CVSS is above their program average",technique:"Correlated subquery",sql:`SELECT v.vuln_id,v.title,v.cvss_score,p.name program,
 (SELECT ROUND(AVG(v2.cvss_score),2) FROM VULNERABILITY v2 WHERE v2.program_id=v.program_id) program_avg
FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
WHERE v.cvss_score>(SELECT AVG(v2.cvss_score) FROM VULNERABILITY v2 WHERE v2.program_id=v.program_id)
ORDER BY p.name,v.cvss_score DESC`},
{id:"Q06",title:"Programs that have never accepted a report",technique:"Nested NOT EXISTS",sql:`SELECT p.program_id,p.name program,p.status,c.name company
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
WHERE NOT EXISTS(SELECT 1 FROM VULNERABILITY v WHERE v.program_id=p.program_id AND v.status='ACCEPTED')
ORDER BY c.name,p.name`}
];
