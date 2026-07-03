-- ============================================================
-- Links an ss_payments row to the QR sticker it's paying to activate,
-- so activateQRCode can verify a completed direct payment before
-- linking the vehicle (see createActivationOrder/confirmActivationPayment
-- in src/actions/checkout.ts). NULL for subscription payments.
-- ============================================================

ALTER TABLE public.ss_payments
  ADD COLUMN qr_id TEXT;

CREATE INDEX idx_ss_payments_qr_id ON public.ss_payments(qr_id) WHERE qr_id IS NOT NULL;
