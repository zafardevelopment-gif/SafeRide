-- ============================================================
-- SafeRide QR — Security Pass (Phase 8)
-- Run order: 005 (after 001-004)
-- 1. pgcrypto-based encryption for medical profile fields and agent
--    bank account numbers (previously stored as plain TEXT despite
--    schema comments promising encryption).
-- 2. Owner DELETE policy on ss_medical_profiles (consent revocation).
-- 3. Audit log for admin actions.
-- ============================================================

-- ============================================================
-- ENCRYPTION HELPERS
-- Supabase's client talks to Postgres over the PostgREST HTTP API
-- (no persistent session), so the encryption key is passed as an
-- explicit argument on every call rather than a session setting.
-- The key itself lives only in the server-side ENCRYPTION_KEY env
-- var and is never exposed to the browser.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ss_encrypt(plain TEXT, key TEXT)
RETURNS BYTEA LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN plain IS NULL THEN NULL ELSE pgp_sym_encrypt(plain, key) END;
$$;

CREATE OR REPLACE FUNCTION public.ss_decrypt(cipher BYTEA, key TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN cipher IS NULL THEN NULL ELSE pgp_sym_decrypt(cipher, key) END;
$$;

-- ============================================================
-- SS_MEDICAL_PROFILES — encrypt sensitive fields
-- Pre-launch, no real data to preserve — direct type change.
-- ============================================================

ALTER TABLE public.ss_medical_profiles
  ALTER COLUMN blood_group TYPE BYTEA USING NULL,
  ALTER COLUMN allergies   TYPE BYTEA USING NULL,
  ALTER COLUMN conditions  TYPE BYTEA USING NULL,
  ALTER COLUMN notes       TYPE BYTEA USING NULL;

-- Owner can revoke consent by deleting their own medical profile.
CREATE POLICY "ss_medical_profiles_delete_own" ON public.ss_medical_profiles
  FOR DELETE USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

-- Combined encrypt-and-upsert / decrypt-and-select RPCs — Supabase's REST
-- client can't express inline SQL functions in .insert()/.select(), so the
-- whole read/write happens inside Postgres via SECURITY INVOKER functions
-- (RLS on ss_medical_profiles still applies to the calling user).
CREATE OR REPLACE FUNCTION public.ss_upsert_medical_profile(
  p_vehicle_id UUID,
  p_blood_group TEXT,
  p_allergies TEXT,
  p_conditions TEXT,
  p_notes TEXT,
  p_consent_given BOOLEAN,
  p_key TEXT
) RETURNS public.ss_medical_profiles
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  result public.ss_medical_profiles;
BEGIN
  INSERT INTO public.ss_medical_profiles (
    vehicle_id, blood_group, allergies, conditions, notes,
    consent_given, consent_given_at
  ) VALUES (
    p_vehicle_id,
    public.ss_encrypt(p_blood_group, p_key),
    public.ss_encrypt(p_allergies, p_key),
    public.ss_encrypt(p_conditions, p_key),
    public.ss_encrypt(p_notes, p_key),
    p_consent_given,
    NOW()
  )
  ON CONFLICT (vehicle_id) DO UPDATE SET
    blood_group = EXCLUDED.blood_group,
    allergies = EXCLUDED.allergies,
    conditions = EXCLUDED.conditions,
    notes = EXCLUDED.notes,
    consent_given = EXCLUDED.consent_given,
    consent_given_at = EXCLUDED.consent_given_at
  RETURNING * INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.ss_get_medical_profile(p_vehicle_id UUID, p_key TEXT)
RETURNS TABLE (
  id UUID,
  vehicle_id UUID,
  blood_group TEXT,
  allergies TEXT,
  conditions TEXT,
  notes TEXT,
  consent_given BOOLEAN,
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE sql SECURITY INVOKER AS $$
  SELECT
    m.id, m.vehicle_id,
    public.ss_decrypt(m.blood_group, p_key),
    public.ss_decrypt(m.allergies, p_key),
    public.ss_decrypt(m.conditions, p_key),
    public.ss_decrypt(m.notes, p_key),
    m.consent_given, m.consent_given_at, m.created_at, m.updated_at
  FROM public.ss_medical_profiles m
  WHERE m.vehicle_id = p_vehicle_id;
$$;

-- Service-role-only variant, used by the unauthenticated Emergency Mode
-- scan flow (already reads via createAdminClient() for the same reason
-- the rest of resolveActiveQR()'s vehicle/contact lookups do — RLS has
-- no policy granting an anonymous scanner read access to this data).
CREATE OR REPLACE FUNCTION public.ss_get_medical_profile_admin(p_vehicle_id UUID, p_key TEXT)
RETURNS TABLE (
  blood_group TEXT,
  allergies TEXT,
  conditions TEXT,
  consent_given BOOLEAN
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    public.ss_decrypt(m.blood_group, p_key),
    public.ss_decrypt(m.allergies, p_key),
    public.ss_decrypt(m.conditions, p_key),
    m.consent_given
  FROM public.ss_medical_profiles m
  WHERE m.vehicle_id = p_vehicle_id;
$$;

REVOKE ALL ON FUNCTION public.ss_get_medical_profile_admin(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ss_get_medical_profile_admin(UUID, TEXT) TO service_role;

-- ============================================================
-- SS_AGENTS — encrypt bank account number
-- ============================================================

ALTER TABLE public.ss_agents
  ALTER COLUMN bank_account_number TYPE BYTEA USING NULL;

CREATE OR REPLACE FUNCTION public.ss_update_agent_bank_details(
  p_user_id UUID,
  p_bank_account_name TEXT,
  p_bank_account_number TEXT,
  p_bank_ifsc TEXT,
  p_upi_id TEXT,
  p_key TEXT
) RETURNS VOID
LANGUAGE sql SECURITY INVOKER AS $$
  UPDATE public.ss_agents
  SET
    bank_account_name = p_bank_account_name,
    bank_account_number = public.ss_encrypt(p_bank_account_number, p_key),
    bank_ifsc = p_bank_ifsc,
    upi_id = p_upi_id
  WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.ss_get_agent_bank_details(p_user_id UUID, p_key TEXT)
RETURNS TABLE (
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT
) LANGUAGE sql SECURITY INVOKER AS $$
  SELECT
    a.bank_account_name,
    public.ss_decrypt(a.bank_account_number, p_key),
    a.bank_ifsc,
    a.upi_id
  FROM public.ss_agents a
  WHERE a.user_id = p_user_id;
$$;

-- Admin variant, keyed by agent id (used by /admin/agents/[id]).
CREATE OR REPLACE FUNCTION public.ss_get_agent_bank_details_by_id(p_agent_id UUID, p_key TEXT)
RETURNS TABLE (
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    a.bank_account_name,
    public.ss_decrypt(a.bank_account_number, p_key),
    a.bank_ifsc,
    a.upi_id
  FROM public.ss_agents a
  WHERE a.id = p_agent_id;
$$;

REVOKE ALL ON FUNCTION public.ss_get_agent_bank_details_by_id(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ss_get_agent_bank_details_by_id(UUID, TEXT) TO service_role;

-- ============================================================
-- SS_AUDIT_LOG
-- Admin-only. Every admin mutation of consequence writes one row.
-- ============================================================

CREATE TABLE public.ss_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES public.ss_users(id),
  action          TEXT NOT NULL,
  target_table    TEXT,
  target_id       UUID,
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_audit_log_created_at ON public.ss_audit_log(created_at DESC);
CREATE INDEX idx_ss_audit_log_admin_user_id ON public.ss_audit_log(admin_user_id);

ALTER TABLE public.ss_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_audit_log_admin_select" ON public.ss_audit_log
  FOR SELECT USING (public.ss_is_admin());

CREATE POLICY "ss_audit_log_admin_insert" ON public.ss_audit_log
  FOR INSERT WITH CHECK (public.ss_is_admin());
