# DBMS Validation Evidence

- Date: 2026-11-12T06:11:20+00:00
- Commit: c7bbcf420bcee3de0c44ce853dd89571f99ef16a
- Branch: feat/tanisha-dbms-evidence-validation
- MySQL: 8.4.13
- Qdrant: local Docker service

## Database tables
Tables_in_bug_bounty_ledger
app_user
company
patch
payout
program
researcher
schema_migrations
user_session
v_admin_report_overview
v_leaderboard_public
v_program_public
v_program_stats
vector_sync_job
vuln_status_history
vulnerability

## Database grants
### app_auth
Grants for app_auth@%
GRANT USAGE ON *.* TO `app_auth`@`%`
GRANT `role_auth`@`%` TO `app_auth`@`%`
### app_admin
Grants for app_admin@%
GRANT USAGE ON *.* TO `app_admin`@`%`
GRANT `role_admin_app`@`%` TO `app_admin`@`%`
### app_researcher
Grants for app_researcher@%
GRANT USAGE ON *.* TO `app_researcher`@`%`
GRANT `role_researcher_app`@`%` TO `app_researcher`@`%`
### app_vector
Grants for app_vector@%
GRANT USAGE ON *.* TO `app_vector`@`%`
GRANT `role_vector_sync`@`%` TO `app_vector`@`%`

## Constraints
TABLE_NAME	CONSTRAINT_NAME	CONSTRAINT_TYPE
app_user	chk_app_user_email	CHECK
app_user	chk_app_user_role_link	CHECK
app_user	fk_app_user_researcher	FOREIGN KEY
app_user	PRIMARY	PRIMARY KEY
app_user	uq_app_user_email	UNIQUE
app_user	uq_app_user_researcher	UNIQUE
company	PRIMARY	PRIMARY KEY
patch	chk_patch_verifier	CHECK
patch	patch_ibfk_1	FOREIGN KEY
patch	PRIMARY	PRIMARY KEY
patch	vuln_id	UNIQUE
payout	chk_payout_completed_date	CHECK
payout	chk_payout_currency	CHECK
payout	payout_chk_1	CHECK
payout	payout_ibfk_1	FOREIGN KEY
payout	PRIMARY	PRIMARY KEY
payout	vuln_id	UNIQUE
program	program_ibfk_1	FOREIGN KEY
program	PRIMARY	PRIMARY KEY
researcher	PRIMARY	PRIMARY KEY
researcher	email	UNIQUE
schema_migrations	PRIMARY	PRIMARY KEY
user_session	chk_session_expiry	CHECK
user_session	fk_session_user	FOREIGN KEY
user_session	PRIMARY	PRIMARY KEY
user_session	uq_session_token	UNIQUE
vector_sync_job	chk_sync_attempts	CHECK
vector_sync_job	PRIMARY	PRIMARY KEY
vuln_status_history	fk_history_user	FOREIGN KEY
vuln_status_history	fk_history_vuln	FOREIGN KEY
vuln_status_history	PRIMARY	PRIMARY KEY
vulnerability	chk_vuln_duplicate_link	CHECK
vulnerability	chk_vuln_title_length	CHECK
vulnerability	vulnerability_chk_1	CHECK
vulnerability	fk_vuln_duplicate_of	FOREIGN KEY
vulnerability	vulnerability_ibfk_1	FOREIGN KEY
vulnerability	vulnerability_ibfk_2	FOREIGN KEY
vulnerability	PRIMARY	PRIMARY KEY

## Triggers
TRIGGER_NAME	EVENT_MANIPULATION	EVENT_OBJECT_TABLE
trg_company_delete_guard	DELETE	company
trg_patch_guard_bi	INSERT	patch
trg_payout_guard_bi	INSERT	payout
trg_program_delete_guard	DELETE	program
trg_vuln_duplicate_guard	UPDATE	vulnerability
trg_vuln_history_ai	INSERT	vulnerability
trg_vuln_history_au	UPDATE	vulnerability
trg_vuln_outbox_ad	DELETE	vulnerability
trg_vuln_outbox_ai	INSERT	vulnerability
trg_vuln_outbox_au	UPDATE	vulnerability
trg_vuln_reputation_au	UPDATE	vulnerability

## Stored procedures and functions
ROUTINE_NAME	ROUTINE_TYPE
fn_canonical_report	FUNCTION
fn_researcher_earnings	FUNCTION
fn_severity_from_cvss	FUNCTION
sp_complete_payout	PROCEDURE
sp_create_payout	PROCEDURE
sp_my_payouts	PROCEDURE
sp_my_reports	PROCEDURE
sp_my_report_detail	PROCEDURE
sp_record_patch	PROCEDURE
sp_register_researcher	PROCEDURE
sp_review_vulnerability	PROCEDURE
sp_submit_vulnerability	PROCEDURE
sp_update_my_report	PROCEDURE
sp_verify_patch	PROCEDURE
sp_withdraw_my_report	PROCEDURE

## Indexes
TABLE_NAME	INDEX_NAME	COLUMN_NAME	NON_UNIQUE
app_user	PRIMARY	user_id	0
app_user	uq_app_user_email	email	0
app_user	uq_app_user_researcher	researcher_id	0
company	PRIMARY	company_id	0
patch	PRIMARY	patch_id	0
patch	vuln_id	vuln_id	0
payout	idx_payout_status_date	payment_status	1
payout	idx_payout_status_date	payment_date	1
payout	PRIMARY	payout_id	0
payout	vuln_id	vuln_id	0
program	company_id	company_id	1
program	PRIMARY	program_id	0
researcher	email	email	0
researcher	PRIMARY	researcher_id	0
schema_migrations	PRIMARY	filename	0
user_session	fk_session_user	user_id	1
user_session	PRIMARY	session_id	0
user_session	uq_session_token	token_hash	0
vector_sync_job	idx_sync_state_created	state	1
vector_sync_job	idx_sync_state_created	created_at	1
vector_sync_job	PRIMARY	job_id	0
vuln_status_history	fk_history_user	changed_by_user_id	1
vuln_status_history	idx_history_vuln_time	vuln_id	1
vuln_status_history	idx_history_vuln_time	changed_at	1
vuln_status_history	PRIMARY	history_id	0
vulnerability	fk_vuln_duplicate_of	duplicate_of_vuln_id	1
vulnerability	ftx_vuln_title_description	title	1
vulnerability	ftx_vuln_title_description	description	1
vulnerability	idx_vuln_program_status	program_id	1
vulnerability	idx_vuln_program_status	status	1
vulnerability	idx_vuln_researcher_date	researcher_id	1
vulnerability	idx_vuln_researcher_date	submitted_date	1
vulnerability	idx_vuln_status	status	1
vulnerability	PRIMARY	vuln_id	0

## Vector reconciliation

> automated-bug-bounty-ledger@0.1.0 vector:reconcile
> tsx scripts/vector-reconcile.ts

Drift: {
  mysqlReports: 44,
  qdrantPoints: 44,
  queuedUpserts: 0,
  queuedDeletes: 0
}

## Query execution plans
### Admin triage query
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	VULNERABILITY	NULL	ref	idx_vuln_program_status,idx_vuln_status	idx_vuln_program_status	5	const,const	1	100.00	Using index condition
### Researcher report listing
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	VULNERABILITY	NULL	ref	idx_vuln_researcher_date	idx_vuln_researcher_date	4	const	2	100.00	Backward index scan
### Payout reporting
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	PAYOUT	NULL	ALL	idx_payout_status_date	NULL	NULL	NULL	18	77.78	Using where
### Full-text search
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	VULNERABILITY	NULL	fulltext	ftx_vuln_title_description	ftx_vuln_title_description	0	const	1	100.00	Using where; Ft_hints: sorted
