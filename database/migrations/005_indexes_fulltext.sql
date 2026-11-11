-- =====================================================================
-- 005_indexes_fulltext.sql
-- Indexes chosen from the queries the app actually runs.
-- Compare EXPLAIN output before and after (see database/tests/explain_indexes.sql).
-- =====================================================================

-- Admin triage queue: WHERE program_id = ? AND status = ?
CREATE INDEX idx_vuln_program_status ON VULNERABILITY (program_id, status);

-- "My reports" ordered by date: WHERE researcher_id = ? ORDER BY submitted_date
CREATE INDEX idx_vuln_researcher_date ON VULNERABILITY (researcher_id, submitted_date);

-- Status filter on its own (dashboard counts)
CREATE INDEX idx_vuln_status ON VULNERABILITY (status);

-- Monthly payout reports: WHERE payment_status = 'COMPLETED' AND payment_date BETWEEN ...
CREATE INDEX idx_payout_status_date ON PAYOUT (payment_status, payment_date);

-- Outbox processor: WHERE state = 'PENDING' ORDER BY created_at
CREATE INDEX idx_sync_state_created ON VECTOR_SYNC_JOB (state, created_at);

-- Keyword search: MATCH(title, description) AGAINST (...)
-- Word-based full-text index, compared in the app with Qdrant's meaning-based search.
CREATE FULLTEXT INDEX ftx_vuln_title_description ON VULNERABILITY (title, description);
