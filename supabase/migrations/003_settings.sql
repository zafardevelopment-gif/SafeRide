-- ============================================================
-- SafeRide QR — Settings & Referral Attribution
-- Run order: 003 (after 001_initial_schema.sql, 002_row_level_security.sql)
-- ============================================================

-- ============================================================
-- SS_SETTINGS
-- Minimal key-value store for admin-configurable values that
-- shouldn't require a redeploy to change (e.g. commission amount).
-- ============================================================

CREATE TABLE public.ss_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ss_settings_updated_at
  BEFORE UPDATE ON public.ss_settings
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

INSERT INTO public.ss_settings (key, value) VALUES
  ('commission_amount_paise', '5000')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.ss_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_settings_admin_all" ON public.ss_settings
  FOR ALL USING (public.ss_is_admin());

-- ============================================================
-- SS_USERS — referral attribution
-- Captured at signup via ?ref={agent referral_code}. Used as a
-- fallback commission tag when a customer activates a QR that
-- has no agent_id set at batch generation.
-- ============================================================

ALTER TABLE public.ss_users
  ADD COLUMN referred_by_agent_id UUID REFERENCES public.ss_agents(id) ON DELETE SET NULL;
