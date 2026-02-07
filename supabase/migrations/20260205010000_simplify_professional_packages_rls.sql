-- PRAGMATIC FIX: Simplest possible RLS policy that works
-- This removes the complex EXISTS check that's likely failing

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;
DROP POLICY IF EXISTS professional_packages_public_select ON public.professional_packages;

-- Step 2: Create a SIMPLE owner management policy (no EXISTS subquery)
-- Just check: user can manage packages they own
CREATE POLICY professional_packages_owner_manage
  ON public.professional_packages
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Step 3: Allow anyone to view public/unlisted packages
CREATE POLICY professional_packages_public_view
  ON public.professional_packages
  FOR SELECT
  USING (visibility IN ('public', 'unlisted'));

-- Step 4: Verify policies exist
SELECT tablename, policyname, permissive, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'professional_packages' 
ORDER BY policyname;

-- Step 5: Test query - check if any packages exist
SELECT COUNT(*) as total_packages, 
       COUNT(DISTINCT owner_user_id) as unique_owners
FROM public.professional_packages;

-- Step 6: Check recent packages (last 10)
SELECT id, name, owner_user_id, professional_type, status, created_at 
FROM public.professional_packages 
ORDER BY created_at DESC 
LIMIT 10;
