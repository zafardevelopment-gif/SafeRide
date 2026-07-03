-- ============================================================
-- Backfill: admin's "change role" action (updateUserRole in
-- src/actions/admin-users.ts) previously only flipped ss_users.role and
-- never created the matching ss_agents row, so any user promoted to
-- 'agent' through /admin/users disappeared from /admin/agents,
-- /admin/scan-assign, and 404'd on /admin/agents/[id]. Fixed going
-- forward in application code; this backfills existing orphans.
-- ============================================================

INSERT INTO public.ss_agents (user_id)
SELECT u.id
FROM public.ss_users u
LEFT JOIN public.ss_agents a ON a.user_id = u.id
WHERE u.role = 'agent' AND a.id IS NULL;
