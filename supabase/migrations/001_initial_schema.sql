-- ============================================================
-- SafeRide QR — Initial Schema Migration
-- Run order: 001 (first migration)
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- All tables are prefixed with ss_ (SafeSaathi namespace)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE ss_user_role AS ENUM ('customer', 'agent', 'admin', 'support');
CREATE TYPE ss_qr_status AS ENUM ('unactivated', 'active', 'suspended', 'lost');
CREATE TYPE ss_print_status AS ENUM ('pending', 'printed', 'dispatched');
CREATE TYPE ss_scan_action_type AS ENUM ('notify_owner', 'wrong_parking', 'emergency');
CREATE TYPE ss_subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE ss_commission_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE ss_notification_channel AS ENUM ('sms', 'whatsapp', 'email', 'push');
CREATE TYPE ss_notification_status AS ENUM ('queued', 'sent', 'failed', 'delivered');
CREATE TYPE ss_vehicle_type AS ENUM ('bike', 'scooter', 'car', 'auto', 'truck', 'other');
CREATE TYPE ss_payment_status AS ENUM ('created', 'paid', 'failed', 'refunded');
CREATE TYPE ss_discount_type AS ENUM ('percentage', 'fixed');

-- ============================================================
-- SS_USERS
-- Mirrors auth.users — created automatically via trigger on signup.
-- We never store passwords here; auth is handled by Supabase Auth.
-- ============================================================

CREATE TABLE public.ss_users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          ss_user_role NOT NULL DEFAULT 'customer',
  name          TEXT,
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_users_role ON public.ss_users(role);
CREATE INDEX idx_ss_users_phone ON public.ss_users(phone) WHERE phone IS NOT NULL;

-- Auto-update updated_at on any table that has it
CREATE OR REPLACE FUNCTION public.ss_handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ss_users_updated_at
  BEFORE UPDATE ON public.ss_users
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- Auto-create ss_users row when a new auth.users row is created
CREATE OR REPLACE FUNCTION public.ss_handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.ss_users (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ss_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_new_auth_user();

-- ============================================================
-- SS_PLANS
-- Defined before subscriptions because subscriptions reference plans.
-- Feature flags stored as JSONB — no schema change needed for new flags.
-- ============================================================

CREATE TABLE public.ss_plans (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  price_monthly               INTEGER NOT NULL DEFAULT 0,  -- paise
  price_yearly                INTEGER NOT NULL DEFAULT 0,  -- paise
  features                    JSONB NOT NULL DEFAULT '{
    "sms_alerts": true,
    "whatsapp_alerts": false,
    "email_alerts": false,
    "medical_profile": false,
    "priority_support": false,
    "max_vehicles": 1,
    "max_emergency_contacts": 1
  }',
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  razorpay_plan_id_monthly    TEXT,
  razorpay_plan_id_yearly     TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ss_plans_updated_at
  BEFORE UPDATE ON public.ss_plans
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_AGENTS
-- One-to-one with ss_users where role = 'agent'.
-- referral_code is auto-generated on row creation.
-- ============================================================

CREATE TABLE public.ss_agents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.ss_users(id) ON DELETE CASCADE,
  referral_code           TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  bank_account_name       TEXT,
  bank_account_number     TEXT,  -- encrypted at app layer before storing
  bank_ifsc               TEXT,
  upi_id                  TEXT,
  total_commission_earned INTEGER NOT NULL DEFAULT 0,  -- denormalised for perf, paise
  total_commission_paid   INTEGER NOT NULL DEFAULT 0,  -- paise
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_agents_user_id ON public.ss_agents(user_id);
CREATE INDEX idx_ss_agents_referral_code ON public.ss_agents(referral_code);

CREATE TRIGGER ss_agents_updated_at
  BEFORE UPDATE ON public.ss_agents
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_QR_BATCHES
-- An admin creates a batch → individual ss_qr_codes rows are inserted.
-- agent_id pre-tags every QR in the batch to that agent.
-- ============================================================

CREATE TABLE public.ss_qr_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES public.ss_agents(id) ON DELETE SET NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  print_status  ss_print_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES public.ss_users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_qr_batches_agent_id ON public.ss_qr_batches(agent_id);

CREATE TRIGGER ss_qr_batches_updated_at
  BEFORE UPDATE ON public.ss_qr_batches
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_QR_CODES
-- qr_id is the short public-facing identifier used in /scan/{qr_id}.
-- It is NOT the UUID primary key — it's a separate, short, URL-safe token.
-- vehicle_id is NULL until the QR is activated by a customer.
-- ============================================================

CREATE TABLE public.ss_qr_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id         TEXT NOT NULL UNIQUE,  -- e.g. "A7B2X9" — used in the printed URL
  status        ss_qr_status NOT NULL DEFAULT 'unactivated',
  batch_id      UUID NOT NULL REFERENCES public.ss_qr_batches(id) ON DELETE RESTRICT,
  agent_id      UUID REFERENCES public.ss_agents(id) ON DELETE SET NULL,  -- copied from batch at generation
  vehicle_id    UUID,  -- FK added after ss_vehicles table (see below)
  activated_at  TIMESTAMPTZ,
  suspended_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_qr_codes_qr_id ON public.ss_qr_codes(qr_id);
CREATE INDEX idx_ss_qr_codes_status ON public.ss_qr_codes(status);
CREATE INDEX idx_ss_qr_codes_agent_id ON public.ss_qr_codes(agent_id);
CREATE INDEX idx_ss_qr_codes_vehicle_id ON public.ss_qr_codes(vehicle_id) WHERE vehicle_id IS NOT NULL;

CREATE TRIGGER ss_qr_codes_updated_at
  BEFORE UPDATE ON public.ss_qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_VEHICLES
-- owner_id references the customer's user ID (not agent).
-- ============================================================

CREATE TABLE public.ss_vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.ss_users(id) ON DELETE CASCADE,
  vehicle_number  TEXT NOT NULL,
  type            ss_vehicle_type NOT NULL,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  color           TEXT NOT NULL,
  year            SMALLINT CHECK (year >= 1980 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, vehicle_number)  -- same owner can't register same number twice
);

CREATE INDEX idx_ss_vehicles_owner_id ON public.ss_vehicles(owner_id);
CREATE INDEX idx_ss_vehicles_vehicle_number ON public.ss_vehicles(vehicle_number);

CREATE TRIGGER ss_vehicles_updated_at
  BEFORE UPDATE ON public.ss_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- Now add the FK from ss_qr_codes → ss_vehicles (circular dependency resolved)
ALTER TABLE public.ss_qr_codes
  ADD CONSTRAINT fk_ss_qr_codes_vehicle
  FOREIGN KEY (vehicle_id) REFERENCES public.ss_vehicles(id) ON DELETE SET NULL;

-- ============================================================
-- SS_EMERGENCY_CONTACTS
-- Multiple contacts per vehicle, ordered by priority.
-- ============================================================

CREATE TABLE public.ss_emergency_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES public.ss_vehicles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  relation        TEXT NOT NULL,
  phone           TEXT NOT NULL,
  priority_order  SMALLINT NOT NULL DEFAULT 1 CHECK (priority_order >= 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, priority_order)
);

CREATE INDEX idx_ss_emergency_contacts_vehicle_id ON public.ss_emergency_contacts(vehicle_id);

CREATE TRIGGER ss_emergency_contacts_updated_at
  BEFORE UPDATE ON public.ss_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_MEDICAL_PROFILES
-- Sensitive data. Only disclosed during emergency action.
-- consent_given MUST be TRUE before any data is stored.
-- DPDP Act 2023 compliance: explicit consent with timestamp.
-- ============================================================

CREATE TABLE public.ss_medical_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID NOT NULL UNIQUE REFERENCES public.ss_vehicles(id) ON DELETE CASCADE,
  blood_group       TEXT,
  allergies         TEXT,
  conditions        TEXT,
  notes             TEXT,
  consent_given     BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_consent CHECK (
    consent_given = FALSE OR consent_given_at IS NOT NULL
  )
);

CREATE TRIGGER ss_medical_profiles_updated_at
  BEFORE UPDATE ON public.ss_medical_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_SCANS
-- Every scan of a QR code is logged, regardless of action type.
-- Used for abuse detection and owner notification history.
-- ============================================================

CREATE TABLE public.ss_scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id           TEXT NOT NULL,  -- denormalised string for fast lookup without JOIN
  action_type     ss_scan_action_type NOT NULL,
  scanner_message TEXT,
  location_lat    DOUBLE PRECISION,
  location_lng    DOUBLE PRECISION,
  photo_url       TEXT,
  ip_address      INET,
  user_agent      TEXT,
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_scans_qr_id ON public.ss_scans(qr_id);
CREATE INDEX idx_ss_scans_created_at ON public.ss_scans(created_at DESC);
CREATE INDEX idx_ss_scans_action_type ON public.ss_scans(action_type);
CREATE INDEX idx_ss_scans_ip_address ON public.ss_scans(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================
-- SS_SUBSCRIPTIONS
-- ============================================================

CREATE TABLE public.ss_subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.ss_users(id) ON DELETE CASCADE,
  plan_id                   UUID NOT NULL REFERENCES public.ss_plans(id),
  status                    ss_subscription_status NOT NULL DEFAULT 'active',
  razorpay_subscription_id  TEXT UNIQUE,
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_subscriptions_user_id ON public.ss_subscriptions(user_id);
CREATE INDEX idx_ss_subscriptions_status ON public.ss_subscriptions(status);

CREATE TRIGGER ss_subscriptions_updated_at
  BEFORE UPDATE ON public.ss_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_PAYMENTS
-- ============================================================

CREATE TABLE public.ss_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.ss_users(id),
  subscription_id       UUID REFERENCES public.ss_subscriptions(id),
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  amount                INTEGER NOT NULL,  -- paise (pre-GST)
  gst_amount            INTEGER NOT NULL DEFAULT 0,  -- paise
  total_amount          INTEGER NOT NULL,  -- paise (amount + gst_amount)
  currency              CHAR(3) NOT NULL DEFAULT 'INR',
  status                ss_payment_status NOT NULL DEFAULT 'created',
  invoice_url           TEXT,
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_payments_user_id ON public.ss_payments(user_id);
CREATE INDEX idx_ss_payments_status ON public.ss_payments(status);

CREATE TRIGGER ss_payments_updated_at
  BEFORE UPDATE ON public.ss_payments
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_COMMISSIONS
-- Created when a QR tagged to an agent is activated (on payment success).
-- Prevents awarding commission for stickers that were never activated.
-- ============================================================

CREATE TABLE public.ss_commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES public.ss_agents(id) ON DELETE CASCADE,
  qr_id         TEXT NOT NULL,  -- denormalised ss_qr_codes.qr_id string
  payment_id    UUID REFERENCES public.ss_payments(id),
  amount        INTEGER NOT NULL,  -- paise
  status        ss_commission_status NOT NULL DEFAULT 'pending',
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (qr_id)  -- one commission record per QR activation, ever
);

CREATE INDEX idx_ss_commissions_agent_id ON public.ss_commissions(agent_id);
CREATE INDEX idx_ss_commissions_status ON public.ss_commissions(status);

CREATE TRIGGER ss_commissions_updated_at
  BEFORE UPDATE ON public.ss_commissions
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_NOTIFICATIONS_LOG
-- Tracks every notification attempt per scan with retry state.
-- ============================================================

CREATE TABLE public.ss_notifications_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             UUID NOT NULL REFERENCES public.ss_scans(id) ON DELETE CASCADE,
  channel             ss_notification_channel NOT NULL,
  recipient           TEXT NOT NULL,  -- phone number or email
  status              ss_notification_status NOT NULL DEFAULT 'queued',
  retry_count         SMALLINT NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ss_notifications_log_scan_id ON public.ss_notifications_log(scan_id);
CREATE INDEX idx_ss_notifications_log_status ON public.ss_notifications_log(status);

CREATE TRIGGER ss_notifications_log_updated_at
  BEFORE UPDATE ON public.ss_notifications_log
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();

-- ============================================================
-- SS_COUPONS
-- ============================================================

CREATE TABLE public.ss_coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   ss_discount_type NOT NULL DEFAULT 'percentage',
  discount_value  INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses        INTEGER,  -- NULL = unlimited
  used_count      INTEGER NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  plan_id         UUID REFERENCES public.ss_plans(id),  -- NULL = all plans
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_percentage_range CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  )
);

CREATE INDEX idx_ss_coupons_code ON public.ss_coupons(code);

CREATE TRIGGER ss_coupons_updated_at
  BEFORE UPDATE ON public.ss_coupons
  FOR EACH ROW EXECUTE FUNCTION public.ss_handle_updated_at();
