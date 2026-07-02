-- Google OAuth auto-fills raw_user_meta_data.name (the account's display
-- name), so the ss_on_auth_user_created trigger populates ss_users.name
-- immediately — the "!profile.name" check that used to gate the
-- role-picker step was always false for Google sign-ins, so new Google
-- users skipped choosing Agent/Customer and silently kept the default
-- 'customer' role. This explicit flag replaces that check.

ALTER TABLE public.ss_users
  ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Anyone who already has a role assigned via the old flows counts as
-- already completed, so existing accounts aren't sent back through
-- the role-picker on next login.
UPDATE public.ss_users SET profile_completed = TRUE WHERE deleted_at IS NULL;
