USE bug_bounty_ledger;
-- The optimizer may scan tiny seed tables. possible_keys still shows candidate indexes.
EXPLAIN SELECT vuln_id,title FROM VULNERABILITY WHERE program_id=101 AND status='SUBMITTED';
EXPLAIN SELECT vuln_id,title,MATCH(title,description) AGAINST('password reset' IN NATURAL LANGUAGE MODE) relevance
FROM VULNERABILITY WHERE MATCH(title,description) AGAINST('password reset' IN NATURAL LANGUAGE MODE);
EXPLAIN SELECT payout_id,amount FROM PAYOUT WHERE payment_status='COMPLETED' AND payment_date>='2026-01-01';
EXPLAIN SELECT vuln_id FROM VECTOR_SYNC_JOB WHERE state='PENDING' ORDER BY created_at LIMIT 100;
-- Unindexed leading-wildcard LIKE is expected to scan:
EXPLAIN SELECT vuln_id FROM VULNERABILITY WHERE description LIKE '%reset%';
