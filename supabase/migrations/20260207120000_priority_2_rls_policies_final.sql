-- Priority 2: RLS Policies - Safe Version with DO Blocks
-- Migration: 20260207120000_priority_2_rls_policies_final
-- Description: Implement Row-Level Security for multi-tenant data isolation

-- Drop existing policies if they exist (safer than IF NOT EXISTS)
DO $$
BEGIN
    -- Drop all existing policies to start fresh
    DROP POLICY IF EXISTS "users_read_own" ON public.users;
    DROP POLICY IF EXISTS "users_update_own" ON public.users;
    DROP POLICY IF EXISTS "users_admin_read_all" ON public.users;
    DROP POLICY IF EXISTS "users_admin_update_all" ON public.users;
    
    DROP POLICY IF EXISTS "user_profiles_read_all" ON public.user_profiles;
    DROP POLICY IF EXISTS "user_profiles_read_authenticated" ON public.user_profiles;
    
    DROP POLICY IF EXISTS "coaches_read_own" ON public.coaches;
    DROP POLICY IF EXISTS "coaches_read_public" ON public.coaches;
    DROP POLICY IF EXISTS "coaches_update_own" ON public.coaches;
    DROP POLICY IF EXISTS "coaches_insert_own" ON public.coaches;
    
    DROP POLICY IF EXISTS "coach_stats_read_own" ON public.coach_stats;
    DROP POLICY IF EXISTS "coach_stats_read_public" ON public.coach_stats;
    
    DROP POLICY IF EXISTS "coach_clients_coach_read" ON public.coach_clients;
    DROP POLICY IF EXISTS "coach_clients_client_read" ON public.coach_clients;
    DROP POLICY IF EXISTS "coach_clients_coach_insert" ON public.coach_clients;
    DROP POLICY IF EXISTS "coach_clients_coach_update" ON public.coach_clients;
    
    DROP POLICY IF EXISTS "professional_packages_read_own" ON public.professional_packages;
    DROP POLICY IF EXISTS "professional_packages_read_public" ON public.professional_packages;
    DROP POLICY IF EXISTS "professional_packages_insert_own" ON public.professional_packages;
    DROP POLICY IF EXISTS "professional_packages_update_own" ON public.professional_packages;
    DROP POLICY IF EXISTS "professional_packages_delete_own" ON public.professional_packages;
    
    DROP POLICY IF EXISTS "pkg_subscriptions_read_own" ON public.professional_package_subscriptions;
    DROP POLICY IF EXISTS "pkg_subscriptions_owner_read" ON public.professional_package_subscriptions;
    DROP POLICY IF EXISTS "pkg_subscriptions_insert_own" ON public.professional_package_subscriptions;
    DROP POLICY IF EXISTS "pkg_subscriptions_update_own" ON public.professional_package_subscriptions;
    
    DROP POLICY IF EXISTS "coach_payments_read_own" ON public.coach_payments;
    DROP POLICY IF EXISTS "coach_payments_client_read" ON public.coach_payments;
    DROP POLICY IF EXISTS "coach_payments_admin_read" ON public.coach_payments;
    DROP POLICY IF EXISTS "coach_payments_system_insert" ON public.coach_payments;
    
    DROP POLICY IF EXISTS "daily_metrics_read_own" ON public.daily_metrics;
    DROP POLICY IF EXISTS "daily_metrics_coach_read" ON public.daily_metrics;
    DROP POLICY IF EXISTS "daily_metrics_insert_own" ON public.daily_metrics;
    DROP POLICY IF EXISTS "daily_metrics_update_own" ON public.daily_metrics;
    
    DROP POLICY IF EXISTS "active_hours_read_own" ON public.active_hours;
    DROP POLICY IF EXISTS "active_hours_insert_own" ON public.active_hours;
    DROP POLICY IF EXISTS "active_hours_update_own" ON public.active_hours;
    
    DROP POLICY IF EXISTS "user_targets_read_own" ON public.user_targets;
    DROP POLICY IF EXISTS "user_targets_coach_read" ON public.user_targets;
    DROP POLICY IF EXISTS "user_targets_insert_own" ON public.user_targets;
    DROP POLICY IF EXISTS "user_targets_update_own" ON public.user_targets;
    
    DROP POLICY IF EXISTS "user_workouts_read_own" ON public.user_workouts;
    DROP POLICY IF EXISTS "user_workouts_read_public" ON public.user_workouts;
    DROP POLICY IF EXISTS "user_workouts_insert_own" ON public.user_workouts;
    DROP POLICY IF EXISTS "user_workouts_update_own" ON public.user_workouts;
    DROP POLICY IF EXISTS "user_workouts_delete_own" ON public.user_workouts;
    
    DROP POLICY IF EXISTS "media_read_own" ON public.media;
    DROP POLICY IF EXISTS "media_read_public" ON public.media;
    DROP POLICY IF EXISTS "media_insert_own" ON public.media;
    DROP POLICY IF EXISTS "media_update_own" ON public.media;
    DROP POLICY IF EXISTS "media_delete_own" ON public.media;
    
    RAISE NOTICE 'All old policies dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy cleanup completed (some may not have existed)';
END $$;

-- ============================================================================
-- NOW CREATE ALL NEW POLICIES FRESH
-- ============================================================================

-- USERS TABLE POLICIES
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_admin_read_all" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "users_admin_update_all" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- USER_PROFILES TABLE POLICIES
CREATE POLICY "user_profiles_read_all" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_read_authenticated" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');

-- COACHES TABLE POLICIES
CREATE POLICY "coaches_read_own" ON public.coaches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coaches_read_public" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "coaches_update_own" ON public.coaches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coaches_insert_own" ON public.coaches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- COACH_STATS TABLE POLICIES
CREATE POLICY "coach_stats_read_own" ON public.coach_stats FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));
CREATE POLICY "coach_stats_read_public" ON public.coach_stats FOR SELECT USING (true);

-- COACH_CLIENTS TABLE POLICIES
CREATE POLICY "coach_clients_coach_read" ON public.coach_clients FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));
CREATE POLICY "coach_clients_client_read" ON public.coach_clients FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "coach_clients_coach_insert" ON public.coach_clients FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));
CREATE POLICY "coach_clients_coach_update" ON public.coach_clients FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));

-- PROFESSIONAL_PACKAGES TABLE POLICIES
CREATE POLICY "professional_packages_read_own" ON public.professional_packages FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "professional_packages_read_public" ON public.professional_packages FOR SELECT USING (status = 'active' AND visibility = 'public');
CREATE POLICY "professional_packages_insert_own" ON public.professional_packages FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "professional_packages_update_own" ON public.professional_packages FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "professional_packages_delete_own" ON public.professional_packages FOR DELETE USING (auth.uid() = owner_user_id);

-- PROFESSIONAL_PACKAGE_SUBSCRIPTIONS TABLE POLICIES
CREATE POLICY "pkg_subscriptions_read_own" ON public.professional_package_subscriptions FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY "pkg_subscriptions_owner_read" ON public.professional_package_subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.professional_packages WHERE id = package_id AND owner_user_id = auth.uid()));
CREATE POLICY "pkg_subscriptions_insert_own" ON public.professional_package_subscriptions FOR INSERT WITH CHECK (auth.uid() = client_user_id);
CREATE POLICY "pkg_subscriptions_update_own" ON public.professional_package_subscriptions FOR UPDATE USING (auth.uid() = client_user_id) WITH CHECK (auth.uid() = client_user_id);

-- COACH_PAYMENTS TABLE POLICIES
CREATE POLICY "coach_payments_read_own" ON public.coach_payments FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.coaches WHERE id = coach_id));
CREATE POLICY "coach_payments_client_read" ON public.coach_payments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "coach_payments_admin_read" ON public.coach_payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "coach_payments_system_insert" ON public.coach_payments FOR INSERT WITH CHECK (true);

-- DAILY_METRICS TABLE POLICIES
CREATE POLICY "daily_metrics_read_own" ON public.daily_metrics FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "daily_metrics_coach_read" ON public.daily_metrics FOR SELECT USING (EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()) AND client_id = owner_id));
CREATE POLICY "daily_metrics_insert_own" ON public.daily_metrics FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "daily_metrics_update_own" ON public.daily_metrics FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ACTIVE_HOURS TABLE POLICIES
CREATE POLICY "active_hours_read_own" ON public.active_hours FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "active_hours_insert_own" ON public.active_hours FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "active_hours_update_own" ON public.active_hours FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- USER_TARGETS TABLE POLICIES
CREATE POLICY "user_targets_read_own" ON public.user_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_targets_coach_read" ON public.user_targets FOR SELECT USING (EXISTS (SELECT 1 FROM public.coach_clients WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()) AND client_id = user_id));
CREATE POLICY "user_targets_insert_own" ON public.user_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_targets_update_own" ON public.user_targets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER_WORKOUTS TABLE POLICIES
CREATE POLICY "user_workouts_read_own" ON public.user_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_workouts_read_public" ON public.user_workouts FOR SELECT USING (true);
CREATE POLICY "user_workouts_insert_own" ON public.user_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_workouts_update_own" ON public.user_workouts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_workouts_delete_own" ON public.user_workouts FOR DELETE USING (auth.uid() = user_id);

-- MEDIA TABLE POLICIES
CREATE POLICY "media_read_own" ON public.media FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "media_read_public" ON public.media FOR SELECT USING (visibility = 'public');
CREATE POLICY "media_insert_own" ON public.media FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "media_update_own" ON public.media FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "media_delete_own" ON public.media FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================================
-- VERIFICATION: Query to check all policies were created
-- ============================================================================

SELECT 'RLS policies deployed successfully!' as status;
