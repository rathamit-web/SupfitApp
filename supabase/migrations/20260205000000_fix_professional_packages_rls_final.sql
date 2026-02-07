-- 2026-02-05: Final fix for professional_packages RLS - Simple and working policy

-- Drop ALL existing policies on professional_packages
DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;
DROP POLICY IF EXISTS professional_packages_public_select ON public.professional_packages;

-- Create a simple, working RLS policy that allows coaches to manage their packages
-- This checks: Does the package owner match the authenticated user?
CREATE POLICY professional_packages_owner_manage
  ON public.professional_packages
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Separate read policy for public packages (optional visibility)
CREATE POLICY professional_packages_public_read
  ON public.professional_packages
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR visibility IN ('public', 'unlisted')
  );

-- Ensure the table has RLS enabled
ALTER TABLE public.professional_packages ENABLE ROW LEVEL SECURITY;

-- Create index to optimize the owner_user_id lookup
CREATE INDEX IF NOT EXISTS idx_professional_packages_owner_lookup
  ON public.professional_packages(owner_user_id);
