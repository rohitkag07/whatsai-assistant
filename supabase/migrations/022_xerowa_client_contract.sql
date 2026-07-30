-- XeroWA AI Client #1: support the parent product as a first-class SaaS tenant.

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_category_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_category_check
  CHECK (category IN (
    'real_estate',
    'clinic',
    'coaching',
    'gym',
    'local_service',
    'software_saas',
    'other'
  ));

COMMENT ON COLUMN public.businesses.category IS
  'Tenant vertical, including software_saas for the XeroWA AI dogfood tenant.';
