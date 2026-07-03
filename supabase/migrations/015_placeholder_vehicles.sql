-- ============================================================
-- Marks a vehicle as an admin-created placeholder (Amazon stock /
-- phone-order activation done before the real owner has an account).
-- The real buyer later "claims" the sticker by scanning it and
-- overwriting these details with their own, flipping this back to FALSE.
-- ============================================================

ALTER TABLE public.ss_vehicles
  ADD COLUMN is_placeholder BOOLEAN NOT NULL DEFAULT FALSE;
