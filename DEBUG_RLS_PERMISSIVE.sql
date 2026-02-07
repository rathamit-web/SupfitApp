-- Temporary debug RLS policy to test data storage
-- This allows any authenticated user to manage professional packages
-- ONLY use for debugging; remove before production

-- Backup existing policy (if needed):
-- DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;

-- Create permissive debug policy:
CREATE POLICY professional_packages_debug_any_auth
  ON public.professional_packages
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- To revert to strict RLS:
-- DROP POLICY IF EXISTS professional_packages_debug_any_auth ON public.professional_packages;
-- And re-enable the original professional_packages_owner_manage policy
