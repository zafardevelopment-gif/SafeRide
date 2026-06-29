-- ============================================================
-- SafeRide QR — Initial Schema Migration
-- Run order: 001 (first migration)
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'agent', 'admin', 'support');
CREATE TYPE qr_status AS ENUM ('unactivated', 'active', 'suspended', 'lost');
CREATE TYPE print_status AS ENUM ('pending', 'printed', 'dispatched');
CREATE TYPE scan_action_type AS ENUM ('notify_owner', 'wrong_parking', 'emergency');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email', 'push');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'delivered');
CREATE TYPE vehicle_type AS ENUM ('bike', 'scooter', 'car', 'auto', 'truck', 'other');
CREATE TYPE payment_status AS ENUM ('created', 'paid', 'failed', 'refunded');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ============================================================
-- USERS
-- Mirrors auth.users — created automatically via trigger on signup.
-- We never store passwords here; auth is handled by Supabase Auth.
-- ============================================================

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'customer',
  name          TEXT,
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries (admin panel)
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create public.users row when a new auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- PLANS
-- Defined before subscriptions because subscriptions reference plans.
-- Feature flags are stored as JSONB so adding new features
-- doesn't require schema changes.
-- ============================================================

CREATE TABLE public.plans (
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

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AGENTS
-- One-to-one with users where role = 'agent'.
-- referral_code is auto-generated on row creation.
-- ============================================================

CREATE TABLE public.agents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_referral_code ON public.agents(referral_code);

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- QR BATCHES
-- An admin creates a batch → individual qr_codes rows are inserted.
-- agent_id pre-tags every QR in the batch to that agent.
-- ============================================================

CREATE TABLE public.qr_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  print_status  print_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_batches_agent_id ON public.qr_batches(agent_id);

CREATE TRIGGER qr_batches_updated_at
  BEFORE UPDATE ON public.qr_batches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- QR CODES
-- qr_id is the short public-facing identifier used in /scan/{qr_id}.
-- It is NOT the UUID primary key — it's a separate, short, URL-safe token.
-- vehicle_id is NULL until the QR is activated by a customer.
-- ============================================================

CREATE TABLE public.qr_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id         TEXT NOT NULL UNIQUE,  -- e.g. "A7B2X9" — used in the printed URL
  status        qr_status NOT NULL DEFAULT 'unactivated',
  batch_id      UUID NOT NULL REFERENCES public.qr_batches(id) ON DELETE RESTRICT,
  agent_id      UUID REFERENCES public.agents(id) ON DELETE SET NULL,  -- copied from batch at generation
  vehicle_id    UUID,  -- FK added after vehicles table (see below)
  activated_at  TIMESTAMPTZ,
  suspended_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_qr_id ON public.qr_codes(qr_id);
CREATE INDEX idx_qr_codes_status ON public.qr_codes(status);
CREATE INDEX idx_qr_codes_agent_id ON public.qr_codes(agent_id);
CREATE INDEX idx_qr_codes_vehicle_id ON public.qr_codes(vehicle_id) WHERE vehicle_id IS NOT NULL;

CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- VEHICLES
-- owner_id references the customer's user ID (not agent).
-- ============================================================

CREATE TABLE public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_number  TEXT NOT NULL,
  type            vehicle_type NOT NULL,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  color           TEXT NOT NULL,
  year            SMALLINT CHECK (year >= 1980 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, vehicle_number)  -- same owner can't register same number twice
);

CREATE INDEX idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX idx_vehicles_vehicle_number ON public.vehicles(vehicle_number);

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Now add the FK from qr_codes → vehicles (circular dependency resolved)
ALTER TABLE public.qr_codes
  ADD CONSTRAINT fk_qr_codes_vehicle
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- ============================================================
-- EMERGENCY CONTACTS
-- Multiple contacts per vehicle, ordered by priority.
-- ============================================================

CREATE TABLE public.emergency_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  relation        TEXT NOT NULL,
  phone           TEXT NOT NULL,
  priority_order  SMALLINT NOT NULL DEFAULT 1 CHECK (priority_order >= 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, priority_order)
);

CREATE INDEX idx_emergency_contacts_vehicle_id ON public.emergency_contacts(vehicle_id);

CREATE TRIGGER emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- MEDICAL PROFILES
-- Sensitive data. Only disclosed to scanner during emergency action.
-- consent_given MUST be TRUE before any data is stored.
-- DPDP Act 2023 compliance: explicit consent with timestamp.
-- ============================================================

CREATE TABLE public.medical_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
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

CREATE TRIGGER medical_profiles_updated_at
  BEFORE UPDATE ON public.medical_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SCANS
-- Every scan of a QR code is logged, regardless of action type.
-- Used for abuse detection and owner notification history.
-- ============================================================

CREATE TABLE public.scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id           TEXT NOT NULL,  -- denormalised string for fast lookup without JOIN
  action_type     scan_action_type NOT NULL,
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

CREATE INDEX idx_scans_qr_id ON public.scans(qr_id);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX idx_scans_action_type ON public.scans(action_type);
-- For IP-based abuse detection
CREATE INDEX idx_scans_ip_address ON public.scans(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id                   UUID NOT NULL REFERENCES public.plans(id),
  status                    subscription_status NOT NULL DEFAULT 'active',
  razorpay_subscription_id  TEXT UNIQUE,
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id),
  subscription_id       UUID REFERENCES public.subscriptions(id),
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  amount                INTEGER NOT NULL,  -- paise (pre-GST)
  gst_amount            INTEGER NOT NULL DEFAULT 0,  -- paise
  total_amount          INTEGER NOT NULL,  -- paise (amount + gst_amount)
  currency              CHAR(3) NOT NULL DEFAULT 'INR',
  status                payment_status NOT NULL DEFAULT 'created',
  invoice_url           TEXT,
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- COMMISSIONS
-- Created when a QR tagged to an agent is activated (on payment success).
-- Prevents awarding commission for stickers that were never activated.
-- ============================================================

CREATE TABLE public.commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  qr_id         TEXT NOT NULL,  -- denormalised qr_code.qr_id string
  payment_id    UUID REFERENCES public.payments(id),
  amount        INTEGER NOT NULL,  -- paise
  status        commission_status NOT NULL DEFAULT 'pending',
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (qr_id)  -- one commission record per QR activation, ever
);

CREATE INDEX idx_commissions_agent_id ON public.commissions(agent_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);

CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- NOTIFICATIONS LOG
-- Tracks every notification attempt per scan with retry state.
-- ============================================================

CREATE TABLE public.notifications_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  channel             notification_channel NOT NULL,
  recipient           TEXT NOT NULL,  -- phone number or email
  status              notification_status NOT NULL DEFAULT 'queued',
  retry_count         SMALLINT NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_log_scan_id ON public.notifications_log(scan_id);
CREATE INDEX idx_notifications_log_status ON public.notifications_log(status);

CREATE TRIGGER notifications_log_updated_at
  BEFORE UPDATE ON public.notifications_log
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- COUPONS
-- ============================================================

CREATE TABLE public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   discount_type NOT NULL DEFAULT 'percentage',
  discount_value  INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses        INTEGER,  -- NULL = unlimited
  used_count      INTEGER NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  plan_id         UUID REFERENCES public.plans(id),  -- NULL = all plans
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_percentage_range CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  )
);

CREATE INDEX idx_coupons_code ON public.coupons(code);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
