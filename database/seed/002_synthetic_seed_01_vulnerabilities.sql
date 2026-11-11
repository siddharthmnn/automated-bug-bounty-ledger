-- Synthetic vulnerability reports (invented test data).
INSERT INTO VULNERABILITY
  (vuln_id, title, description, severity, cvss_score, status, duplicate_of_vuln_id, submitted_date, program_id, researcher_id)
VALUES
  (304, 'Invoice PDFs of other tenants downloadable by changing the invoice number',
   'The invoice download link uses a sequential number. Replacing it with another value returns a PDF that belongs to a different customer account.',
   'HIGH', 7.1, 'DUPLICATE', 301, '2026-06-09', 101, 212),
  (305, 'Server-side request forgery in webhook URL validator',
   'The webhook configuration accepts any URL and the server fetches it to validate it, so internal-only addresses such as the cloud metadata service can be reached from outside.',
   'CRITICAL', 9.1, 'ACCEPTED', NULL, '2026-02-11', 101, 206),
  (306, 'Webhook test button makes the server request internal metadata address',
   'Using the "send test event" feature with an internal IP address as the target makes the backend call that address and show part of the response, exposing internal services.',
   'HIGH', 8.6, 'SUBMITTED', NULL, '2026-10-21', 101, 207),
  (307, 'Verbose stack traces returned on malformed JSON',
   'Sending a malformed JSON body returns a full framework stack trace with file paths and library versions.',
   'LOW', 3.1, 'REJECTED', NULL, '2026-03-04', 101, 214),
  (308, 'API keys remain in browser local storage after logout',
   'After signing out of the dashboard the personal API key is still stored in local storage and can be read by any script running on the page.',
   'MEDIUM', 5.4, 'TRIAGED', NULL, '2026-09-15', 101, 209),
  (309, 'Script injection through profile biography field',
   'HTML entered in the biography section of the user profile is saved and later executed in the browser of anyone who opens that profile.',
   'MEDIUM', 5.4, 'DUPLICATE', 302, '2026-07-03', 102, 210),
  (310, 'Race condition allows double withdrawal of the same balance',
   'Sending two withdrawal requests at the same moment lets both succeed before the balance is updated, so the same money is withdrawn twice.',
   'CRITICAL', 9.3, 'ACCEPTED', NULL, '2026-01-19', 102, 212);
