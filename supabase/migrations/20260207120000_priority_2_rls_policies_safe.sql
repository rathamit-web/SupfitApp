-- Priority 2: RLS Policies for Data Isolation (SAFE VERSION WITH IF NOT EXISTS)
-- Migration: 20260207120000_priority_2_rls_policies_safe
-- Description: Implement Row-Level Security for multi-tenant data isolation
-- Updated to match actual database structure with safe CREATE IF NOT EXISTS

-- ============================================================================
-- 1. ENABLE RLS ON CORE TABLES (Safe - will not error if already enabled)
-- ============================================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professional_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professional_package_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.active_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. USERS TABLE POLICIES (IF NOT EXISTS SAFE)
-- ============================================================================

CREATE POLICY IF NOT EXISTS "users_read_own" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_update_own" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_admin_read_all" 
  ON public.users FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "users_admin_update_all" 
  ON public.users FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 3. USER_PROFILES TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "user_profiles_read_all" 
  ON public.user_profiles FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "user_profiles_read_authenticated" 
  ON public.user_profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 4. COACHES TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "coaches_read_own" 
  ON public.coaches FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "coaches_read_public" 
  ON public.coaches FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "coaches_update_own" 
  ON public.coaches FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "coaches_insert_own" 
  ON public.coaches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. COACH_STATS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "coach_stats_read_own" 
  ON public.coach_stats FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

CREATE POLICY IF NOT EXISTS "coach_stats_read_public" 
  ON public.coach_stats FOR SELECT 
  USING (true);

-- ============================================================================
-- 6. COACH_CLIENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "coach_clients_coach_read" 
  ON public.coach_clients FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

CREATE POLICY IF NOT EXISTS "coach_clients_client_read" 
  ON public.coach_clients FOR SELECT 
  USING (auth.uid() = client_id);

CREATE POLICY IF NOT EXISTS "coach_clients_coach_insert" 
  ON public.coach_clients FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

CREATE POLICY IF NOT EXISTS "coach_clients_coach_update" 
  ON public.coach_clients FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id)) 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

-- ============================================================================
-- 7. PROFESSIONAL_PACKAGES TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "professional_packages_read_own" 
  ON public.professional_packages FOR SELECT 
  USING (auth.uid() = owner_user_id);

CREATE POLICY IF NOT EXISTS "professional_packages_read_public" 
  ON public.professional_packages FOR SELECT 
  USING (status = 'active' AND visibility = 'public');

CREATE POLICY IF NOT EXISTS "professional_packages_insert_own" 
  ON public.professional_packages FOR INSERT 
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY IF NOT EXISTS "professional_packages_update_own" 
  ON public.professional_packages FOR UPDATE 
  USING (auth.uid() = owner_user_id) 
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY IF NOT EXISTS "professional_packages_delete_own" 
  ON public.professional_packages FOR DELETE 
  USING (auth.uid() = owner_user_id);

-- ============================================================================
-- 8. PROFESSIONAL_PACKAGE_SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "pkg_subscriptions_read_own" 
  ON public.professional_package_subscriptions FOR SELECT 
  USING (auth.uid() = client_user_id);

CREATE POLICY IF NOT EXISTS "pkg_subscriptions_owner_read" 
  ON public.professional_package_subscriptions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.professional_packages WHERE id = package_id AND owner_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "pkg_subscriptions_insert_own" 
  ON public.professional_package_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY IF NOT EXISTS "pkg_subscriptions_update_own" 
  ON public.professional_package_subscriptions FOR UPDATE 
  USING (auth.uid() = client_user_id) 
  WITH CHECK (auth.uid() = client_user_id);

-- ============================================================================
-- 9. COACH_PAYMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "coach_payments_read_own" 
  ON public.coach_payments FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

CREATE POLICY IF NOT EXISTS "coach_payments_client_read" 
  ON public.coach_payments FOR SELECT 
  USING (auth.uid() = client_id);

CREATE POLICY IF NOT EXISTS "coach_payments_admin_read" 
  ON public.coach_payments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "coach_payments_system_insert" 
  ON public.coach_payments FOR INSERT 
  WITH CHECK (true);

-- ============================================================================
-- 10. DAILY_METRICS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "daily_metrics_read_own" 
  ON public.daily_metrics FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "daily_metrics_coach_read" 
  ON public.daily_metrics FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()) AND client_id = owner_id));

CREATE POLICY IF NOT EXISTS "daily_metrics_insert_own" 
  ON public.daily_metrics FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "daily_metrics_update_own" 
  ON public.daily_metrics FOR UPDATE 
  USING (auth.uid() = owner_id) 
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- 11. ACTIVE_HOURS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "active_hours_read_own" 
  ON public.active_hours FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "active_hours_insert_own" 
  ON public.active_hours FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "active_hours_update_own" 
  ON public.active_hours FOR UPDATE 
  USING (auth.uid() = owner_id) 
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- 12. USER_TARGETS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "user_targets_read_own" 
  ON public.user_targets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_targets_coach_read" 
  ON public.user_targets FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()) AND client_id = user_id));

CREATE POLICY IF NOT EXISTS "user_targets_insert_own" 
  ON public.user_targets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_targets_update_own" 
  ON public.user_targets FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. USER_WORKOUTS TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "user_workouts_read_own" 
  ON public.user_workouts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_workouts_read_public" 
  ON public.user_workouts FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "user_workouts_insert_own" 
  ON public.user_workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_workouts_update_own" 
  ON public.user_workouts FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "user_workouts_delete_own" 
  ON public.user_workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 14. MEDIA TABLE POLICIES
-- ============================================================================

CREATE POLICY IF NOT EXISTS "media_read_own" 
  ON public.media FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "media_read_public" 
  ON public.media FOR SELECT 
  USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "media_insert_own" 
  ON public.media FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "media_update_own" 
  ON public.media FOR UPDATE 
  USING (auth.uid() = owner_id) 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "media_delete_own" 
  ON public.media FOR DELETE 
  USING (auth.uid() = owner_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

-- If you see "no rows" below, all policies were created/verified successfully!
-- SELECT 'RLS policies deployed successfully!' as status;
