-- 2026-02-04: Fix professional_packages RLS policy for proper INSERT/UPDATE support

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;

-- Create a new, more permissive policy that properly handles role comparison
-- The issue was with ENUM type casting - we now explicitly handle the conversion
CREATE POLICY professional_packages_owner_manage
  ON public.professional_packages
  FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND (
      -- Check if user role matches professional type (handle ENUM comparison)
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND (u.role = 'coach' OR u.role = 'dietician')
        AND (
          (u.role = 'coach' AND professional_type = 'coach'::professional_type_enum)
          OR
          (u.role = 'dietician' AND professional_type = 'dietician'::professional_type_enum)
        )
      )
      OR
      -- Fallback: text comparison for flexibility
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role::text = professional_type::text
      )
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND (
      -- Check if user role matches professional type (handle ENUM comparison)
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND (u.role = 'coach' OR u.role = 'dietician')
        AND (
          (u.role = 'coach' AND professional_type = 'coach'::professional_type_enum)
          OR
          (u.role = 'dietician' AND professional_type = 'dietician'::professional_type_enum)
        )
      )
      OR
      -- Fallback: text comparison for flexibility
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role::text = professional_type::text
      )
    )
  );

-- Re-create the public select policy (unchanged)
DROP POLICY IF EXISTS professional_packages_public_select ON public.professional_packages;
CREATE POLICY professional_packages_public_select
  ON public.professional_packages
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR visibility IN ('public', 'unlisted')
  );

-- Verify the user has a valid role in the users table
-- Create an index to speed up the role lookup
CREATE INDEX IF NOT EXISTS idx_users_role_lookup
  ON public.users(id, role);
