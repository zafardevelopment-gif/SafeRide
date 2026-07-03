-- ============================================================
-- Per-agent commission override. NULL means "use the global
-- ss_settings.commission_amount_paise default" (see getCommissionAmount()).
-- ============================================================

ALTER TABLE public.ss_agents
  ADD COLUMN commission_amount_paise INTEGER CHECK (commission_amount_paise >= 0);
