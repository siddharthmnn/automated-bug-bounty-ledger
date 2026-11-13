USE bug_bounty_ledger;

-- Q01: Accepted reports with researcher, program, company, latest patch and payout.
-- INNER/LEFT JOIN, correlated scalar subqueries, ORDER BY.
SELECT v.vuln_id,v.title,v.severity,r.name AS researcher,p.name AS program,c.name AS company,
       pt.verification_status AS patch_status,py.payment_status AS payout_status
FROM VULNERABILITY v
JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
JOIN PROGRAM p ON p.program_id=v.program_id
JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN PATCH pt ON pt.patch_id=(SELECT MAX(x.patch_id) FROM PATCH x WHERE x.vuln_id=v.vuln_id)
LEFT JOIN PAYOUT py ON py.payout_id=(SELECT MAX(x.payout_id) FROM PAYOUT x WHERE x.vuln_id=v.vuln_id)
WHERE v.status='ACCEPTED' ORDER BY c.name,v.vuln_id;

-- Q02: Accepted reports without a payout (LEFT anti-join).
SELECT v.vuln_id,v.title,v.severity,r.name AS researcher,v.submitted_date
FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
WHERE v.status='ACCEPTED' AND py.payout_id IS NULL ORDER BY v.submitted_date;

-- Q03: Programs with at least two HIGH or CRITICAL reports.
-- COUNT/MAX, GROUP BY, HAVING and ORDER BY.
SELECT p.program_id,p.name AS program,c.name AS company,COUNT(*) AS high_or_critical,
       MAX(v.cvss_score) AS worst_cvss
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
JOIN VULNERABILITY v ON v.program_id=p.program_id
WHERE v.severity IN('HIGH','CRITICAL')
GROUP BY p.program_id,p.name,c.name
HAVING COUNT(*)>=2 ORDER BY high_or_critical DESC,worst_cvss DESC;

-- Q04: Earnings compared only within the same country and currency.
-- CTE, conditional SUM and correlated subquery. Currency values are never mixed.
WITH researcher_currency AS (
 SELECT r.researcher_id,r.name,r.country,py.currency,
        SUM(CASE WHEN py.payment_status='COMPLETED' THEN py.amount ELSE 0 END) AS earned
 FROM RESEARCHER r JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
 JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 GROUP BY r.researcher_id,r.name,r.country,py.currency
)
SELECT rc.researcher_id,rc.name,rc.country,rc.currency,rc.earned
FROM researcher_currency rc
WHERE rc.earned>(SELECT AVG(peer.earned) FROM researcher_currency peer
                 WHERE peer.country=rc.country AND peer.currency=rc.currency)
ORDER BY rc.currency,rc.earned DESC;

-- Q05: Reports whose CVSS is above their program average (correlated subquery).
SELECT v.vuln_id,v.title,v.cvss_score,p.name AS program,
       (SELECT ROUND(AVG(v2.cvss_score),2) FROM VULNERABILITY v2
        WHERE v2.program_id=v.program_id) AS program_avg
FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
WHERE v.cvss_score>(SELECT AVG(v2.cvss_score) FROM VULNERABILITY v2
                    WHERE v2.program_id=v.program_id)
ORDER BY p.name,v.cvss_score DESC;

-- Q06: Programs that have never accepted a report (nested NOT EXISTS).
SELECT p.program_id,p.name AS program,p.status,c.name AS company
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
WHERE NOT EXISTS(SELECT 1 FROM VULNERABILITY v
                 WHERE v.program_id=p.program_id AND v.status='ACCEPTED')
ORDER BY c.name,p.name;
