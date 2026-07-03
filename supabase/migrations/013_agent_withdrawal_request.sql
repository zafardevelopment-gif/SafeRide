-- ============================================================
-- Lets an agent flag "I'd like my pending commissions paid out" without
-- messaging admin directly. Admin still manually marks each commission
-- paid via /admin/commissions — this is just a notice, not a state machine.
-- Cleared (set back to NULL) whenever admin marks any commission paid for
-- that agent, or the agent can implicitly re-request by clicking again.
-- ============================================================

ALTER TABLE public.ss_agents
  ADD COLUMN withdrawal_requested_at TIMESTAMPTZ;
