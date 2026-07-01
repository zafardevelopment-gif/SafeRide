-- ============================================================
-- Seed: Sample users (customer, agent, admin)
-- Run in Supabase SQL Editor. Dev/staging only — do not run in prod.
-- Inserts directly into auth.users with a bcrypt password hash;
-- the ss_on_auth_user_created trigger auto-creates the ss_users row,
-- then we update role/name here.
-- All three use the password: Passw0rd!
-- ============================================================

DO $$
DECLARE
  v_customer_id UUID := gen_random_uuid();
  v_agent_id    UUID := gen_random_uuid();
  v_admin_id    UUID := gen_random_uuid();
  v_password    TEXT := crypt('Passw0rd!', gen_salt('bf'));
BEGIN
  -- Note: the token/change columns must be '' not NULL — GoTrue scans
  -- them as non-nullable strings and a NULL there breaks login lookups.
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) VALUES
  (
    v_customer_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'customer@saferideqr.test', v_password, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  ),
  (
    v_agent_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'agent@saferideqr.test', v_password, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  ),
  (
    v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@saferideqr.test', v_password, NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(),
    '', '', '', '', '', '', '', ''
  );

  -- Also insert matching identities (required for email/password login to work)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, created_at, updated_at
  ) VALUES
  (gen_random_uuid(), v_customer_id, v_customer_id::text,
    jsonb_build_object('sub', v_customer_id::text, 'email', 'customer@saferideqr.test'), 'email', NOW(), NOW()),
  (gen_random_uuid(), v_agent_id, v_agent_id::text,
    jsonb_build_object('sub', v_agent_id::text, 'email', 'agent@saferideqr.test'), 'email', NOW(), NOW()),
  (gen_random_uuid(), v_admin_id, v_admin_id::text,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@saferideqr.test'), 'email', NOW(), NOW());

  -- ss_users rows are auto-created by the ss_on_auth_user_created trigger.
  -- Now set name + role on each.
  UPDATE public.ss_users SET name = 'Sample Customer', role = 'customer' WHERE id = v_customer_id;
  UPDATE public.ss_users SET name = 'Sample Agent',    role = 'agent'    WHERE id = v_agent_id;
  UPDATE public.ss_users SET name = 'Sample Admin',    role = 'admin'    WHERE id = v_admin_id;

  -- Agents need a matching ss_agents row
  INSERT INTO public.ss_agents (user_id) VALUES (v_agent_id)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- ============================================================
-- Login credentials:
--   customer@saferideqr.test / Passw0rd!
--   agent@saferideqr.test    / Passw0rd!
--   admin@saferideqr.test    / Passw0rd!
-- ============================================================
