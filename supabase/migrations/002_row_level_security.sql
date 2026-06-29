-- ============================================================
-- SafeRide QR — Row Level Security Policies
-- Run order: 002 (after 001_initial_schema.sql)
-- All tables use the ss_ prefix
-- ============================================================

-- Enable RLS on all ss_ tables
ALTER TABLE public.ss_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_coupons ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ss_users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: check if current user is admin or support
CREATE OR REPLACE FUNCTION public.is_admin_or_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ss_users
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$;

-- ============================================================
-- SS_USERS
-- ============================================================

CREATE POLICY "ss_users_select_own" ON public.ss_users
  FOR SELECT USING (id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "ss_users_update_own" ON public.ss_users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "ss_users_admin_update" ON public.ss_users
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- SS_AGENTS
-- ============================================================

CREATE POLICY "ss_agents_select_own" ON public.ss_agents
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "ss_agents_update_own" ON public.ss_agents
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "ss_agents_admin_all" ON public.ss_agents
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_VEHICLES
-- ============================================================

CREATE POLICY "ss_vehicles_select_own" ON public.ss_vehicles
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "ss_vehicles_insert_own" ON public.ss_vehicles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "ss_vehicles_update_own" ON public.ss_vehicles
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "ss_vehicles_admin_all" ON public.ss_vehicles
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_QR_BATCHES — Admin only
-- ============================================================

CREATE POLICY "ss_qr_batches_admin_all" ON public.ss_qr_batches
  FOR ALL USING (public.is_admin());

CREATE POLICY "ss_qr_batches_agent_select" ON public.ss_qr_batches
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.ss_agents WHERE user_id = auth.uid())
  );

-- ============================================================
-- SS_QR_CODES
-- ============================================================

-- Public read — needed for /scan/{qr_id} which is unauthenticated
CREATE POLICY "ss_qr_codes_public_select" ON public.ss_qr_codes
  FOR SELECT USING (TRUE);

CREATE POLICY "ss_qr_codes_customer_select" ON public.ss_qr_codes
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "ss_qr_codes_admin_all" ON public.ss_qr_codes
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_EMERGENCY_CONTACTS
-- ============================================================

CREATE POLICY "ss_emergency_contacts_select_own" ON public.ss_emergency_contacts
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
    OR public.is_admin_or_support()
  );

CREATE POLICY "ss_emergency_contacts_insert_own" ON public.ss_emergency_contacts
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "ss_emergency_contacts_update_own" ON public.ss_emergency_contacts
  FOR UPDATE USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "ss_emergency_contacts_delete_own" ON public.ss_emergency_contacts
  FOR DELETE USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

-- ============================================================
-- SS_MEDICAL_PROFILES
-- Only owner + admin can read. NEVER exposed on scan page directly.
-- Emergency mode sends this data via server-side notification only.
-- ============================================================

CREATE POLICY "ss_medical_profiles_select_own" ON public.ss_medical_profiles
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "ss_medical_profiles_insert_own" ON public.ss_medical_profiles
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "ss_medical_profiles_update_own" ON public.ss_medical_profiles
  FOR UPDATE USING (
    vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
  );

-- ============================================================
-- SS_SCANS — Public insert (unauthenticated scanners)
-- ============================================================

CREATE POLICY "ss_scans_public_insert" ON public.ss_scans
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "ss_scans_owner_select" ON public.ss_scans
  FOR SELECT USING (
    qr_id IN (
      SELECT qr_id FROM public.ss_qr_codes
      WHERE vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
    )
    OR public.is_admin_or_support()
  );

CREATE POLICY "ss_scans_owner_update" ON public.ss_scans
  FOR UPDATE USING (
    qr_id IN (
      SELECT qr_id FROM public.ss_qr_codes
      WHERE vehicle_id IN (SELECT id FROM public.ss_vehicles WHERE owner_id = auth.uid())
    )
  );

-- ============================================================
-- SS_PLANS — Public read (pricing page)
-- ============================================================

CREATE POLICY "ss_plans_public_select" ON public.ss_plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "ss_plans_admin_all" ON public.ss_plans
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "ss_subscriptions_select_own" ON public.ss_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ss_subscriptions_admin_all" ON public.ss_subscriptions
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_PAYMENTS
-- ============================================================

CREATE POLICY "ss_payments_select_own" ON public.ss_payments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ss_payments_admin_all" ON public.ss_payments
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_COMMISSIONS
-- ============================================================

CREATE POLICY "ss_commissions_agent_select" ON public.ss_commissions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.ss_agents WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "ss_commissions_admin_all" ON public.ss_commissions
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_NOTIFICATIONS_LOG — Admin + support only
-- ============================================================

CREATE POLICY "ss_notifications_log_admin_select" ON public.ss_notifications_log
  FOR SELECT USING (public.is_admin_or_support());

CREATE POLICY "ss_notifications_log_admin_all" ON public.ss_notifications_log
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SS_COUPONS — Public read for code validation; admin for writes
-- ============================================================

CREATE POLICY "ss_coupons_public_select" ON public.ss_coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "ss_coupons_admin_all" ON public.ss_coupons
  FOR ALL USING (public.is_admin());
