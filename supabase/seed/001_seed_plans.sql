-- ============================================================
-- Seed: Default Plans
-- Run after migrations in dev/staging environments.
-- ============================================================

INSERT INTO public.plans (id, name, price_monthly, price_yearly, features) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Basic',
  0,       -- Free
  0,
  '{
    "sms_alerts": true,
    "whatsapp_alerts": false,
    "email_alerts": false,
    "medical_profile": false,
    "priority_support": false,
    "max_vehicles": 1,
    "max_emergency_contacts": 1
  }'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'Premium',
  19900,   -- ₹199/month (paise)
  179900,  -- ₹1799/year (≈25% off)
  '{
    "sms_alerts": true,
    "whatsapp_alerts": true,
    "email_alerts": true,
    "medical_profile": true,
    "priority_support": true,
    "max_vehicles": 5,
    "max_emergency_contacts": 5
  }'
)
ON CONFLICT (id) DO NOTHING;
