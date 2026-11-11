-- =====================================================================
-- 012_analytics_views.sql
-- Monetary aggregates are always partitioned by ISO currency code.
-- =====================================================================
DROP VIEW IF EXISTS v_leaderboard_public;
DROP VIEW IF EXISTS v_admin_report_overview;
DROP VIEW IF EXISTS v_program_stats;

CREATE VIEW v_leaderboard_public AS
WITH report_stats AS (
 SELECT r.researcher_id,r.name,r.country,COALESCE(r.reputation_score,0) reputation_score,
 COUNT(v.vuln_id) reports_submitted,
 COALESCE(SUM(v.status='ACCEPTED'),0) accepted_reports
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

-- One row per program and payout currency. A program with no payouts has a
-- single NULL-currency row rather than a fabricated zero in an arbitrary unit.
CREATE VIEW v_program_stats AS
SELECT p.program_id,p.name AS program_name,p.status,c.company_id,c.name AS company_name,
 COALESCE(v.total_reports,0) total_reports,COALESCE(v.submitted,0) submitted,
 COALESCE(v.triaged,0) triaged,COALESCE(v.accepted,0) accepted,
 COALESCE(v.rejected,0) rejected,COALESCE(v.duplicates,0) duplicates,
 COALESCE(v.critical_reports,0) critical_reports,
 py.currency,COALESCE(py.total_paid,0) total_paid
FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id
LEFT JOIN (
 SELECT program_id,COUNT(*) total_reports,
  SUM(status='SUBMITTED') submitted,SUM(status='TRIAGED') triaged,
  SUM(status='ACCEPTED') accepted,SUM(status='REJECTED') rejected,
  SUM(status='DUPLICATE') duplicates,SUM(severity='CRITICAL') critical_reports
 FROM VULNERABILITY GROUP BY program_id
) v ON v.program_id=p.program_id
LEFT JOIN (
 SELECT v.program_id,p.currency,SUM(p.amount) total_paid
 FROM PAYOUT p JOIN VULNERABILITY v ON v.vuln_id=p.vuln_id
 WHERE p.payment_status='COMPLETED'
 GROUP BY v.program_id,p.currency
) py ON py.program_id=p.program_id;

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
GRANT SELECT ON v_program_stats TO role_admin_app;
GRANT SELECT ON v_admin_report_overview TO role_admin_app;
