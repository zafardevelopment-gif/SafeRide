-- ============================================================
-- SafeRide QR — Notification Body
-- Run order: 004 (after 001-003)
-- Stores the rendered message content for each queued notification,
-- so it's auditable now and ready to hand to a real sender later.
-- ============================================================

ALTER TABLE public.ss_notifications_log
  ADD COLUMN body TEXT NOT NULL DEFAULT '';

ALTER TABLE public.ss_notifications_log
  ALTER COLUMN body DROP DEFAULT;
