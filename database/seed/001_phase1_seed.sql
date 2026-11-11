-- =====================================================================
-- 001_phase1_seed.sql
-- Phase 1 sample data: 2 companies, 2 programs, 2 researchers,
-- 3 vulnerability reports, 2 patches and 2 payouts.
--
-- The original Phase 1 Workbench screenshots clipped some long values.
-- Those descriptions, patch notes and dates are retained as synthetic
-- explanatory text from the team's hand-off seed; the six-table model
-- and the visible Phase 1 sample values remain unchanged.
-- =====================================================================

INSERT INTO COMPANY VALUES (1, 'Nexora Cloud', 'Cloud Infrastructure', 'nexoracloud.com');
INSERT INTO COMPANY VALUES (2, 'Finlock Payments', 'FinTech', 'finlock.io');

INSERT INTO PROGRAM VALUES (101, 'Nexora Public Program', 'api.nexoracloud.com/*', 'ACTIVE', 1);
INSERT INTO PROGRAM VALUES (102, 'Finlock Core Banking', 'app.finlock.io/*', 'ACTIVE', 2);

INSERT INTO RESEARCHER VALUES (201, 'Ananya Rao', 'ananya@example.com', 'India', 850);
INSERT INTO RESEARCHER VALUES (202, 'Marcus Lee', 'marcus@example.com', 'Singapore', 620);

INSERT INTO VULNERABILITY
  (vuln_id, title, description, severity, cvss_score, status, submitted_date, program_id, researcher_id)
VALUES
  (301, 'IDOR on /api/v2/invoices',
   'Insecure direct object reference: the invoices endpoint returns any tenant''s invoice when the numeric invoice id in the path is changed, because ownership is not checked on the server.',
   'HIGH', 7.5, 'ACCEPTED', '2026-06-02', 101, 201),
  (302, 'Stored XSS in profile bio',
   'Unsanitized bio field allows HTML and script content to be stored and rendered to every user who views the profile page.',
   'MEDIUM', 5.4, 'ACCEPTED', '2026-06-28', 102, 202),
  (303, 'Rate limit bypass on OTP endpoint',
   'OTP endpoint can be called without any request limit, so a six digit one-time password can be guessed by sending many verification attempts.',
   'HIGH', 7.3, 'TRIAGED', '2026-07-01', 101, 201);

INSERT INTO PATCH (patch_id, patch_date, verified_by, verification_status, notes, vuln_id) VALUES
  (401, '2026-06-20', 'Rahul Iyer', 'VERIFIED', 'Added tenant-scoped authorization check on invoice lookup', 301),
  (402, '2026-07-10', 'Sara Chen',  'VERIFIED', 'Sanitized input with output encoding on profile render', 302);

INSERT INTO PAYOUT (payout_id, amount, currency, payment_date, payment_status, vuln_id) VALUES
  (501, 2500.00, 'USD', '2026-06-22', 'COMPLETED', 301),
  (502,  800.00, 'USD', '2026-07-12', 'COMPLETED', 302);
