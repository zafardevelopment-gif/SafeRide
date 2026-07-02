-- Emergency contacts (relatives) can now also be notified by email, not
-- just phone/WhatsApp. Optional — many contacts won't have one on hand.

ALTER TABLE public.ss_emergency_contacts
  ADD COLUMN email TEXT;
