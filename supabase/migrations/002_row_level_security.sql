-- ============================================================
-- SafeRide QR — Row Level Security Policies
-- Run order: 002 (after 001_initial_schema.sql)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: check if current user is admin or support
CREATE OR REPLACE FUNCTION public.is_admin_or_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$;

-- ============================================================
-- USERS
-- ============================================================

-- Users see only their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin can update any user (role changes, suspend etc.)
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- AGENTS
-- ============================================================

CREATE POLICY "agents_select_own" ON public.agents
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "agents_update_own" ON public.agents
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "agents_admin_all" ON public.agents
  FOR ALL USING (public.is_admin());

-- ============================================================
-- VEHICLES
-- ============================================================

CREATE POLICY "vehicles_select_own" ON public.vehicles
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin_or_support());

CREATE POLICY "vehicles_insert_own" ON public.vehicles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "vehicles_update_own" ON public.vehicles
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "vehicles_admin_all" ON public.vehicles
  FOR ALL USING (public.is_admin());

-- ============================================================
-- QR BATCHES — Admin only
-- ============================================================

CREATE POLICY "qr_batches_admin_all" ON public.qr_batches
  FOR ALL USING (public.is_admin());

-- Agents can view their own batches
CREATE POLICY "qr_batches_agent_select" ON public.qr_batches
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- ============================================================
-- QR CODES
-- ============================================================

-- Public read for scan page — anyone can read a qr_code by qr_id
-- (needed for /scan/{qr_id} which is unauthenticated)
CREATE POLICY "qr_codes_public_select" ON public.qr_codes
  FOR SELECT USING (TRUE);

-- Customers can see QR codes linked to their vehicles
CREATE POLICY "qr_codes_customer_select" ON public.qr_codes
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- Only admin can insert/update QR codes
CREATE POLICY "qr_codes_admin_all" ON public.qr_codes
  FOR ALL USING (public.is_admin());

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================

CREATE POLICY "emergency_contacts_select_own" ON public.emergency_contacts
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
    OR public.is_admin_or_support()
  );

CREATE POLICY "emergency_contacts_insert_own" ON public.emergency_contacts
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "emergency_contacts_update_own" ON public.emergency_contacts
  FOR UPDATE USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "emergency_contacts_delete_own" ON public.emergency_contacts
  FOR DELETE USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- ============================================================
-- MEDICAL PROFILES
-- Only owner + admin can read. NEVER exposed on scan page directly.
-- Emergency mode sends this data via server-side notification only.
-- ============================================================

CREATE POLICY "medical_profiles_select_own" ON public.medical_profiles
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "medical_profiles_insert_own" ON public.medical_profiles
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "medical_profiles_update_own" ON public.medical_profiles
  FOR UPDATE USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- ============================================================
-- SCANS — Public insert (unauthenticated scanners)
-- ============================================================

-- Anyone can insert a scan (the scan page is public)
CREATE POLICY "scans_public_insert" ON public.scans
  FOR INSERT WITH CHECK (TRUE);

-- Owner can see scans of their QR codes
CREATE POLICY "scans_owner_select" ON public.scans
  FOR SELECT USING (
    qr_id IN (
      SELECT qr_id FROM public.qr_codes
      WHERE vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
    )
    OR public.is_admin_or_support()
  );

-- Owner can mark scans as resolved
CREATE POLICY "scans_owner_update" ON public.scans
  FOR UPDATE USING (
    qr_id IN (
      SELECT qr_id FROM public.qr_codes
      WHERE vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
    )
  );

-- ============================================================
-- PLANS — Public read (visible on pricing page)
-- ============================================================

CREATE POLICY "plans_public_select" ON public.plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "plans_admin_all" ON public.plans
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.is_admin());

-- ============================================================
-- COMMISSIONS
-- ============================================================

CREATE POLICY "commissions_agent_select" ON public.commissions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "commissions_admin_all" ON public.commissions
  FOR ALL USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS LOG — Admin + support
-- ============================================================

CREATE POLICY "notifications_log_admin_select" ON public.notifications_log
  FOR SELECT USING (public.is_admin_or_support());

CREATE POLICY "notifications_log_admin_all" ON public.notifications_log
  FOR ALL USING (public.is_admin());

-- ============================================================
-- COUPONS — Public read for code validation; admin for writes
-- ============================================================

CREATE POLICY "coupons_public_select" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (public.is_admin());
