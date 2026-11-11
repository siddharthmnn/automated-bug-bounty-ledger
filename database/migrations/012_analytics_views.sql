-- =====================================================================
-- 012_analytics_views.sql
-- Earnings are ranked independently per currency. Amounts in different
-- currencies are never added or compared as if they shared a unit.
-- =====================================================================
DROP VIEW IF EXISTS v_leaderboard_public;
DROP VIEW IF EXISTS v_admin_report_overview;

CREATE VIEW v_leaderboard_public AS
WITH report_stats AS (
 SELECT r.researcher_id,r.name,r.country,COALESCE(r.reputation_score,0) reputation_score,
 COUNT(v.vuln_id) reports_submitted,
 SUM(v.status='ACCEPTED') accepted_reports
 FROM RESEARCHER r LEFT JOIN VULNERABILITY v ON v.researcher_id=r.researcher_id
 GROUP BY r.researcher_id,r.name,r.country,r.reputation_score
), payout_stats AS (
 SELECT v.researcher_id,py.currency,
 SUM(CASE WHEN py.payment_status='COMPLETED' THEN py.amount ELSE 0 END) total_earned
 FROM VULNERABILITY v JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 GROUP BY v.researcher_id,py.currency
), ranked AS (
 SELECT rs.*,ps.currency,COALESCE(ps.total_earned,0) total_earned
 FROM report_stats rs LEFT JOIN payout_stats ps ON ps.researcher_id=rs.researcher_id
)
SELECT RANK() OVER(PARTITION BY currency ORDER BY total_earned DESC,accepted_reports DESC) earnings_rank,
 researcher_id,name,country,reputation_score,reports_submitted,accepted_reports,currency,total_earned
FROM ranked;

CREATE VIEW v_admin_report_overview AS
SELECT v.vuln_id,v.title,v.severity,v.cvss_score,v.status,v.submitted_date,v.duplicate_of_vuln_id,
 r.researcher_id,r.name researcher_name,p.program_id,p.name program_name,
 c.company_id,c.name company_name,pt.patch_id,pt.verification_status,pt.patch_date,
 py.payout_id,py.amount,py.currency,py.payment_status,py.payment_date
FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN PATCH pt ON pt.patch_id=(SELECT MAX(x.patch_id) FROM PATCH x WHERE x.vuln_id=v.vuln_id)
LEFT JOIN PAYOUT py ON py.payout_id=(SELECT MAX(y.payout_id) FROM PAYOUT y WHERE y.vuln_id=v.vuln_id);

GRANT SELECT ON v_leaderboard_public TO role_researcher_app,role_admin_app;
GRANT SELECT ON v_admin_report_overview TO role_admin_app;
