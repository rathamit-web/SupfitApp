-- Debugging & Administrative Scripts for Coach/Professional Packages

-- ===== VIEW: Check sync status between auth.users and public.users =====
-- Run this to see which auth users are missing from public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.role,
  pu.created_at as public_created_at,
  CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'OK' END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- ===== VIEW: Coach/Dietician users and their packages =====
-- Shows which coaches/dieticians have created packages
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(pp.id) as package_count,
  MAX(pp.created_at) as last_package_created
FROM public.users u
LEFT JOIN public.professional_packages pp ON u.id = pp.owner_user_id
WHERE u.role IN ('coach', 'dietician')
GROUP BY u.id, u.email, u.role
ORDER BY u.created_at DESC;

-- ===== VIEW: Packages with role mismatch (likely RLS failures) =====
-- Shows packages where professional_type doesn't match owner's role
SELECT 
  pp.id,
  pp.name,
  pp.professional_type,
  u.email,
  u.role,
  pp.created_at,
  CASE 
    WHEN pp.professional_type::text = u.role::text THEN 'MATCH'
    ELSE 'MISMATCH'
  END as status
FROM public.professional_packages pp
JOIN public.users u ON pp.owner_user_id = u.id
WHERE pp.professional_type::text != u.role::text
ORDER BY pp.created_at DESC;

-- ===== ACTION: Promote a user to coach (run this with caution!) =====
-- Example: Update user with email 'coach@example.com' to role 'coach'
-- Uncomment and modify the email below:
/*
UPDATE public.users
SET role = 'coach'::public.user_role,
    updated_at = NOW()
WHERE email = 'your-coach-email@example.com'
  AND role != 'coach';
*/

-- ===== ACTION: Promote a user to dietician (run this with caution!) =====
-- Example: Update user with email 'dietician@example.com' to role 'dietician'
/*
UPDATE public.users
SET role = 'dietician'::public.user_role,
    updated_at = NOW()
WHERE email = 'your-dietician-email@example.com'
  AND role != 'dietician';
*/

-- ===== ACTION: Create a test coach user (for development) =====
-- Creates both auth user and public.users record
-- Note: This requires authenticated session from app; here's SQL alternative:
/*
INSERT INTO public.users (id, email, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test-coach-' || floor(random() * 10000)::text || '@example.com',
  'coach'::public.user_role,
  NOW(),
  NOW()
)
RETURNING id, email, role;
*/

-- ===== VIEW: Check RLS policy eligibility =====
-- Shows users and whether they can manage professional_packages
-- (i.e., whether they have matching role for the professional_type)
SELECT 
  u.id,
  u.email,
  u.role,
  EXISTS (
    SELECT 1 FROM public.users check_u
    WHERE check_u.id = u.id 
    AND check_u.role::text = 'coach'::text
  ) as can_manage_coach_packages,
  EXISTS (
    SELECT 1 FROM public.users check_u
    WHERE check_u.id = u.id 
    AND check_u.role::text = 'dietician'::text
  ) as can_manage_dietician_packages
FROM public.users u
WHERE u.role IN ('coach', 'dietician')
ORDER BY u.email;

-- ===== VIEW: Packages and their RLS access =====
-- Simulates the RLS check for a given auth.uid()
-- Replace 'YOUR-USER-ID' with actual UUID
/*
SELECT 
  pp.id,
  pp.name,
  pp.owner_user_id,
  (pp.owner_user_id = 'YOUR-USER-ID'::uuid) as owns_package,
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = 'YOUR-USER-ID'::uuid 
    AND u.role::text = pp.professional_type::text
  ) as has_matching_role,
  (pp.owner_user_id = 'YOUR-USER-ID'::uuid 
   AND EXISTS (
     SELECT 1 FROM public.users u
     WHERE u.id = 'YOUR-USER-ID'::uuid 
     AND u.role::text = pp.professional_type::text
   )) as rls_allows_access
FROM public.professional_packages pp
ORDER BY pp.created_at DESC;
*/

-- ===== DEBUG: Check what current session can see =====
-- Run this while authenticated as coach/dietician to verify RLS
-- Should show only packages owned by current user with matching role
SELECT 
  pp.id,
  pp.name,
  pp.professional_type,
  pp.status,
  pp.price,
  pp.created_at
FROM public.professional_packages pp
WHERE pp.owner_user_id = auth.uid()
ORDER BY pp.created_at DESC
LIMIT 10;

-- ===== CLEANUP: Delete packages (if needed for testing) =====
-- WARNING: This is destructive! Use only for development/testing
-- Deletes all packages for a specific user
/*
DELETE FROM public.professional_packages
WHERE owner_user_id = 'YOUR-USER-ID'::uuid;
*/
