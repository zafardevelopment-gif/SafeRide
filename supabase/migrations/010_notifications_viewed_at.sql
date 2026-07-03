-- ============================================================
-- Tracks when a customer last viewed /dashboard/notifications, so an
-- "unread" count can be derived by comparing ss_scans.created_at against
-- this timestamp. No per-scan read state exists (and isn't needed for
-- this simple "seen since last visit" badge).
-- ============================================================

ALTER TABLE public.ss_users
  ADD COLUMN notifications_viewed_at TIMESTAMPTZ;
