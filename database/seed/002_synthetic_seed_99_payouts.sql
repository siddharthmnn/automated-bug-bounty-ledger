INSERT INTO PAYOUT (payout_id, amount, currency, payment_date, payment_status, vuln_id) VALUES
  (503, 4000.00, 'USD', '2026-02-27', 'COMPLETED', 305),
  (504, 6000.00, 'USD', '2026-01-30', 'COMPLETED', 310),
  (505, 1500.00, 'USD', NULL,         'PENDING',   312),
  (506, 5000.00, 'USD', '2026-03-24', 'COMPLETED', 314),
  (507, 1200.00, 'USD', '2026-04-20', 'COMPLETED', 316),
  (508, 1000.00, 'USD', '2026-06-02', 'COMPLETED', 321),
  (509,  600.00, 'USD', '2026-03-12', 'COMPLETED', 323),
  (510, 3500.00, 'USD', '2026-06-29', 'COMPLETED', 325),
  (511, 2000.00, 'USD', NULL,         'PENDING',   327),
  (512, 7500.00, 'USD', '2026-02-09', 'COMPLETED', 330),
  (513, 1800.00, 'USD', '2026-05-19', 'COMPLETED', 331),
  (514,  700.00, 'USD', '2026-07-15', 'FAILED',    332),
  (515, 1600.00, 'USD', '2026-05-06', 'COMPLETED', 335),
  (516, 1400.00, 'USD', NULL,         'PENDING',   336),
  (517,  900.00, 'USD', '2026-08-06', 'COMPLETED', 340),
  (518, 1100.00, 'USD', '2026-01-20', 'COMPLETED', 344);
-- Reports 342 and 343 are ACCEPTED but deliberately have no payout yet
-- (used by the "accepted but unpaid" anti-join query).
