-- Priority 2: RLS Policies for Data Isolation
-- Migration: 20260207120000
-- Description: Implement Row-Level Security for multi-tenant data isolation
-- Scope: users, user_profiles, coaches, coach_clients, professional_packages, coach_payments

-- ============================================================================
-- 1. ENABLE RLS ON CORE TABLES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_package_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. USER TABLE POLICIES
-- ============================================================================

-- Users can only read their own record
CREATE POLICY "users_read_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own record
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "users_admin_read_all"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any user
CREATE POLICY "users_admin_update_all"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 3. USER PROFILES TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "user_profiles_read_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read public profiles
CREATE POLICY "user_profiles_read_public"
  ON public.user_profiles FOR SELECT
  USING (visibility = 'public');

-- Users can read profiles of coaches they're connected to
CREATE POLICY "user_profiles_read_connected"
  ON public.user_profiles FOR SELECT
  USING (
    visibility IN ('public', 'unlisted') OR
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.coach_clients
      WHERE coach_id = user_id AND client_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. COACHES TABLE POLICIES
-- ============================================================================

-- Coaches can read their own record
CREATE POLICY "coaches_read_own"
  ON public.coaches FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can view other coaches based on visibility
CREATE POLICY "coaches_read_public"
  ON public.coaches FOR SELECT
  USING (is_verified = true);

-- Coaches can update their own record
CREATE POLICY "coaches_update_own"
  ON public.coaches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read/update all coaches
CREATE POLICY "coaches_admin_read_all"
  ON public.coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "coaches_admin_update_all"
  ON public.coaches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. COACH_CLIENTS TABLE POLICIES
-- ============================================================================

-- Coaches can read their own clients
CREATE POLICY "coach_clients_coach_read"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = coach_id);

-- Clients can read their own coach relationships
CREATE POLICY "coach_clients_client_read"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = client_id);

-- Coaches can only insert clients they're assigned to
CREATE POLICY "coach_clients_coach_insert"
  ON public.coach_clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own client relationships
CREATE POLICY "coach_clients_coach_update"
  ON public.coach_clients FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- ============================================================================
-- 6. PROFESSIONAL_PACKAGES TABLE POLICIES
-- ============================================================================

-- Coaches can read their own packages
CREATE POLICY "professional_packages_read_own"
  ON public.professional_packages FOR SELECT
  USING (auth.uid() = coach_id);

-- Public can read active, public packages
CREATE POLICY "professional_packages_read_public"
  ON public.professional_packages FOR SELECT
  USING (
    status = 'active' AND visibility = 'public'
  );

-- Coaches can insert their own packages
CREATE POLICY "professional_packages_insert_own"
  ON public.professional_packages FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- Coaches can edit their own packages
CREATE POLICY "professional_packages_update_own"
  ON public.professional_packages FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Coaches can delete their own packages
CREATE POLICY "professional_packages_delete_own"
  ON public.professional_packages FOR DELETE
  USING (auth.uid() = coach_id);

-- ============================================================================
-- 7. PROFESSIONAL_PACKAGE_SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can read their own subscriptions
CREATE POLICY "pkg_subscriptions_read_own"
  ON public.professional_package_subscriptions FOR SELECT
  USING (auth.uid() = client_id);

-- Coaches can read subscriptions to their packages
CREATE POLICY "pkg_subscriptions_coach_read"
  ON public.professional_package_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_packages
      WHERE id = package_id AND coach_id = auth.uid()
    )
  );

-- Users can insert their own subscriptions
CREATE POLICY "pkg_subscriptions_insert_own"
  ON public.professional_package_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Users can update their own subscriptions (pause, resume)
CREATE POLICY "pkg_subscriptions_update_own"
  ON public.professional_package_subscriptions FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- ============================================================================
-- 8. COACH_PAYMENTS TABLE POLICIES
-- ============================================================================

-- Coaches can read their own payments
CREATE POLICY "coach_payments_read_own"
  ON public.coach_payments FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can read all payments
CREATE POLICY "coach_payments_admin_read"
  ON public.coach_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert payments (trigger/function)
CREATE POLICY "coach_payments_system_insert"
  ON public.coach_payments FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. DAILY_METRICS TABLE POLICIES
-- ============================================================================

-- Users can read their own metrics
CREATE POLICY "daily_metrics_read_own"
  ON public.daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can read metrics of their clients
CREATE POLICY "daily_metrics_coach_read"
  ON public.daily_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_clients
      WHERE coach_id = auth.uid() AND client_id = user_id
    )
  );

-- Users can insert their own metrics
CREATE POLICY "daily_metrics_insert_own"
  ON public.daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own metrics
CREATE POLICY "daily_metrics_update_own"
  ON public.daily_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. ACTIVE_HOURS TABLE POLICIES
-- ============================================================================

-- Users can read their own active hours
CREATE POLICY "active_hours_read_own"
  ON public.active_hours FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own active hours
CREATE POLICY "active_hours_insert_own"
  ON public.active_hours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own active hours
CREATE POLICY "active_hours_update_own"
  ON public.active_hours FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 11. USER_TARGETS TABLE POLICIES
-- ============================================================================

-- Users can read their own targets
CREATE POLICY "user_targets_read_own"
  ON public.user_targets FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can read targets of their clients
CREATE POLICY "user_targets_coach_read"
  ON public.user_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_clients
      WHERE coach_id = auth.uid() AND client_id = user_id
    )
  );

-- Users can insert their own targets
CREATE POLICY "user_targets_insert_own"
  ON public.user_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own targets
CREATE POLICY "user_targets_update_own"
  ON public.user_targets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. ADMIN BYPASS POLICIES (Optional - For trusted admins only)
-- ============================================================================

-- Note: If you want to allow admins to completely bypass RLS:
-- SET ROLE postgres; -- Only for trusted admin operations
-- This is NOT enabled by default. Use sparingly and with audit logging.

-- ============================================================================
-- 3. VERIFY RLS STATUS
-- ============================================================================

-- Query to check RLS status on all tables:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
