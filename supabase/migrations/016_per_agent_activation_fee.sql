-- ============================================================
-- Per-agent override for the price THAT agent charges customers in cash
-- (used in the agent billing "owed to SafeRide" settlement math). NULL
-- means "use the global activation_fee_paise default" (see
-- getActivationFeeAmount() in src/actions/settings.ts). Independent of
-- the online/UPI checkout price, which always uses the global setting.
-- ============================================================

ALTER TABLE public.ss_agents
  ADD COLUMN custom_activation_fee_paise INTEGER CHECK (custom_activation_fee_paise >= 0);
