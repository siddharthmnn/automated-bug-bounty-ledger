-- Run from WSL: docker compose exec -T mysql mysql -uroot -p bug_bounty_ledger < database/demo/rbac_demo.sql
USE bug_bounty_ledger;
SELECT user,host,default_role_user AS default_role FROM mysql.default_roles WHERE user LIKE 'app\_%';
SHOW GRANTS FOR role_researcher_app;
SHOW GRANTS FOR role_admin_app;
SHOW GRANTS FOR role_auth;
SHOW GRANTS FOR role_vector_sync;
SELECT grantee,column_name,privilege_type FROM information_schema.column_privileges
WHERE table_schema=DATABASE() AND table_name='app_user' ORDER BY grantee,column_name;
-- Connect separately as app_researcher and verify these fail with 1142/1370:
-- SELECT * FROM PAYOUT; SELECT email FROM RESEARCHER;
-- CALL sp_review_vulnerability(1,301,'ACCEPTED',NULL,NULL);
-- These must work:
-- SELECT * FROM v_program_public; SELECT * FROM v_leaderboard_public;
-- CALL sp_my_reports(2);
