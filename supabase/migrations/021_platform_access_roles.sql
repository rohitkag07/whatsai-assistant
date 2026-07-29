ALTER TABLE public.business_members
  DROP CONSTRAINT IF EXISTS business_members_role_check;

ALTER TABLE public.business_members
  ADD CONSTRAINT business_members_role_check
  CHECK (role IN ('owner', 'manager', 'agent', 'client', 'admin', 'dev'));
