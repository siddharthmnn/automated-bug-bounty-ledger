-- Two-session demonstration of SELECT ... FOR UPDATE in sp_complete_payout.
-- First pick a PENDING payout: SELECT payout_id FROM PAYOUT WHERE payment_status='PENDING';
-- Session A:
START TRANSACTION;
SELECT payout_id,payment_status FROM PAYOUT WHERE payout_id=516 FOR UPDATE;
-- Session B (waits while A holds the row lock):
-- CALL sp_complete_payout(516,'COMPLETED',CURDATE());
-- Session A:
COMMIT;
-- Session B continues. A second completion must receive SIGNAL SQLSTATE 45000 / error 1644.
