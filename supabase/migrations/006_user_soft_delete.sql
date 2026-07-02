-- Soft-delete support for ss_users. Hard-deleting from auth.users can fail
-- with a foreign key violation (ss_qr_batches.created_by, ss_payments.user_id
-- have no ON DELETE CASCADE, by design — payment/audit history must survive).
-- Deleting a user instead disables login and blanks their PII, keeping every
-- row that references them intact.

ALTER TABLE public.ss_users
  ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_ss_users_deleted_at ON public.ss_users(deleted_at) WHERE deleted_at IS NOT NULL;
