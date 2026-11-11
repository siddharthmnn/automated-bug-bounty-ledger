-- Synthetic vulnerability reports (invented test data).
INSERT INTO VULNERABILITY
  (vuln_id, title, description, severity, cvss_score, status, duplicate_of_vuln_id, submitted_date, program_id, researcher_id)
VALUES
  (311, 'Concurrent transfer requests overdraw account beyond its limit',
   'Firing several transfer calls in parallel bypasses the balance check and leaves the account with a negative balance larger than the allowed overdraft.',
   'CRITICAL', 9.0, 'SUBMITTED', NULL, '2026-10-25', 102, 204),
  (312, 'Missing account lockout on PIN verification',
   'The transaction PIN screen allows unlimited incorrect attempts without any delay or lockout.',
   'HIGH', 7.4, 'ACCEPTED', NULL, '2026-08-02', 102, 203),
  (313, 'CSV export allows formula injection in transaction notes',
   'Transaction notes starting with an equals sign are exported unchanged to CSV and are interpreted as spreadsheet formulas when opened.',
   'MEDIUM', 4.8, 'TRIAGED', NULL, '2026-09-28', 102, 211),
  (314, 'Lab results of other patients exposed via sequential record IDs',
   'The lab results page loads records by a sequential id in the URL and does not check that the record belongs to the logged-in patient.',
   'CRITICAL', 9.4, 'ACCEPTED', NULL, '2026-03-10', 103, 203),
  (315, 'Changing the patient ID in the results URL shows another patient lab report',
   'By editing the number at the end of the results address, a patient can open medical test results of other people.',
   'CRITICAL', 9.1, 'DUPLICATE', 314, '2026-03-14', 103, 205),
  (316, 'Password reset token does not expire after use',
   'A password reset link keeps working after it has been used once, so anyone who later obtains the email can reset the password again.',
   'HIGH', 7.2, 'ACCEPTED', NULL, '2026-04-02', 103, 207),
  (317, 'Reset password link can be reused multiple times',
   'The same reset link from the email can be opened and used again to set a new password even after a successful reset.',
   'HIGH', 7.0, 'DUPLICATE', 316, '2026-04-06', 103, 208),
  (318, 'Old password reset emails still work days later',
   'Reset emails received several days ago still allow changing the account password; the token is never invalidated.',
   'HIGH', 7.0, 'DUPLICATE', 317, '2026-04-12', 103, 213);
