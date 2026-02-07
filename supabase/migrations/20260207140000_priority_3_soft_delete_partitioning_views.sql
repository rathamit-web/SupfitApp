-- Priority 3: Advanced Data Management Patterns
-- Migration: 20260207140000
-- Description: Time-series partitioning, materialized views, and soft delete patterns
-- Scope: daily_metrics partitioning, stats views, soft delete columns

-- ============================================================================
-- 1. SOFT DELETE PATTERN - Add deleted_at Columns
-- ============================================================================

-- Users (already has deleted_at from Phase 2)

-- Professional Packages
ALTER TABLE public.professional_packages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Coach Clients
ALTER TABLE public.coach_clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Professional Package Subscriptions
ALTER TABLE public.professional_package_subscriptions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- User Targets
ALTER TABLE public.user_targets
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Coach Plans
ALTER TABLE public.coach_plans
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- User Workouts (if exists)
ALTER TABLE IF EXISTS public.user_workouts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index on deleted_at for quick filtering of "active" records
CREATE INDEX IF NOT EXISTS idx_professional_packages_deleted_at 
    ON public.professional_packages(deleted_at);

CREATE INDEX IF NOT EXISTS idx_coach_clients_deleted_at 
    ON public.coach_clients(deleted_at);

CREATE INDEX IF NOT EXISTS idx_pkg_subscriptions_deleted_at 
    ON public.professional_package_subscriptions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_targets_deleted_at 
    ON public.user_targets(deleted_at);

CREATE INDEX IF NOT EXISTS idx_coach_plans_deleted_at 
    ON public.coach_plans(deleted_at);

-- ============================================================================
-- 2. SOFT DELETE HELPER VIEWS
-- ============================================================================

-- Create view for active professional packages
CREATE OR REPLACE VIEW public.active_professional_packages AS
SELECT * FROM public.professional_packages
WHERE deleted_at IS NULL;

-- Create view for active coach clients
CREATE OR REPLACE VIEW public.active_coach_clients AS
SELECT * FROM public.coach_clients
WHERE deleted_at IS NULL;

-- Create view for active subscriptions
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT * FROM public.professional_package_subscriptions
WHERE deleted_at IS NULL;

-- Create view for active user targets
CREATE OR REPLACE VIEW public.active_user_targets AS
SELECT * FROM public.user_targets
WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. TIME-SERIES PARTITIONING FOR DAILY_METRICS
-- ============================================================================

-- First, create parent table with partitioning
-- Note: If daily_metrics already exists, we use it as is for backwards compatibility
-- Future daily_metrics will be partitioned by month

-- Create partitions for the last 24 months + 3 future months
-- This assumes daily_metrics exists; if it doesn't, create it first

CREATE TABLE IF NOT EXISTS public.daily_metrics_2025_11 
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS public.daily_metrics_2025_12
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS public.daily_metrics_2026_01
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS public.daily_metrics_2026_02
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS public.daily_metrics_2026_03
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS public.daily_metrics_2026_04
    PARTITION OF public.daily_metrics
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Create indexes on each partition for optimal query performance
CREATE INDEX IF NOT EXISTS idx_daily_metrics_2025_11_user_date 
    ON public.daily_metrics_2025_11(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_2025_12_user_date 
    ON public.daily_metrics_2025_12(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_2026_01_user_date 
    ON public.daily_metrics_2026_01(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_2026_02_user_date 
    ON public.daily_metrics_2026_02(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_2026_03_user_date 
    ON public.daily_metrics_2026_03(user_id, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_2026_04_user_date 
    ON public.daily_metrics_2026_04(user_id, recorded_date DESC);

-- ============================================================================
-- 4. PARTITION MAINTENANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_monthly_daily_metrics_partition()
RETURNS void AS $$
DECLARE
    next_month_start DATE;
    next_month_end DATE;
    partition_name TEXT;
BEGIN
    -- Calculate next month
    next_month_start := DATE_TRUNC('month', NOW() + INTERVAL '2 months')::DATE;
    next_month_end := DATE_TRUNC('month', NOW() + INTERVAL '3 months')::DATE;
    
    -- Generate partition name (e.g., daily_metrics_2026_05)
    partition_name := 'daily_metrics_' || TO_CHAR(next_month_start, 'YYYY_MM');
    
    -- Create partition if it doesn't exist
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.daily_metrics
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        next_month_start,
        next_month_end
    );
    
    -- Create composite index on partition
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(user_id, recorded_date DESC)',
        'idx_' || partition_name || '_user_date',
        partition_name
    );
    
    -- Log partition creation
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        'system'::UUID,
        'PARTITION_CREATED',
        'daily_metrics',
        JSON_BUILD_OBJECT(
            'partition_name', partition_name,
            'start_date', next_month_start,
            'end_date', next_month_end,
            'created_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. MATERIALIZED VIEWS FOR STATS AGGREGATION
-- ============================================================================

-- Coach Performance Stats View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_coach_performance_stats AS
SELECT 
    c.id as coach_id,
    c.user_id,
    up.first_name,
    up.last_name,
    COUNT(DISTINCT cc.client_id) as total_clients,
    COUNT(DISTINCT pp.id) as total_packages,
    COALESCE(SUM(pp.likes_count), 0) as total_likes,
    COALESCE(AVG(pp.likes_count), 0) as avg_likes_per_package,
    COUNT(DISTINCT pps.id) as active_subscriptions,
    COALESCE(SUM(cp.amount), 0) as total_earnings,
    c.is_verified,
    c.updated_at,
    NOW() as view_refreshed_at
FROM public.coaches c
LEFT JOIN public.user_profiles up ON c.user_id = up.user_id
LEFT JOIN public.coach_clients cc ON c.id = cc.coach_id AND cc.deleted_at IS NULL
LEFT JOIN public.professional_packages pp ON c.id = pp.coach_id AND pp.deleted_at IS NULL AND pp.status = 'active'
LEFT JOIN public.professional_package_subscriptions pps ON pp.id = pps.package_id AND pps.deleted_at IS NULL AND pps.status = 'active'
LEFT JOIN public.coach_payments cp ON c.id = cp.coach_id AND cp.status = 'completed'
GROUP BY c.id, c.user_id, up.first_name, up.last_name, c.is_verified, c.updated_at
ORDER BY total_clients DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_coach_performance_coach_id 
    ON public.mv_coach_performance_stats(coach_id);

-- User Health Metrics Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_health_metrics_summary AS
SELECT 
    u.id as user_id,
    up.first_name,
    up.last_name,
    COUNT(dm.id) as total_metrics_recorded,
    MAX(dm.recorded_date) as last_metric_date,
    MIN(dm.recorded_date) as first_metric_date,
    COALESCE(AVG(dm.calories_burned), 0) as avg_calories_burned,
    COALESCE(AVG(dm.workout_minutes), 0) as avg_workout_minutes,
    COALESCE(AVG(dm.water_intake_ml), 0) as avg_water_intake_ml,
    COALESCE(AVG(dm.sleep_hours), 0) as avg_sleep_hours,
    COUNT(DISTINCT dm.recorded_date) as active_days,
    COALESCE(SUM(dm.calories_burned), 0) as total_calories_burned,
    NOW() as view_refreshed_at
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.daily_metrics dm ON u.id = dm.user_id
GROUP BY u.id, up.first_name, up.last_name
ORDER BY total_metrics_recorded DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_user_health_metrics_user_id 
    ON public.mv_user_health_metrics_summary(user_id);

-- Package Performance Stats View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_package_performance_stats AS
SELECT 
    pp.id as package_id,
    pp.name,
    pp.coach_id,
    COUNT(DISTINCT pps.client_id) as subscription_count,
    COALESCE(AVG(pps.payment_status = 'completed'::payment_status_enum), 0) as completion_rate,
    pp.likes_count,
    pp.price,
    pp.created_at,
    MAX(pps.created_at) as last_subscription_date,
    COUNT(CASE WHEN pps.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN pps.status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
    NOW() as view_refreshed_at
FROM public.professional_packages pp
LEFT JOIN public.professional_package_subscriptions pps ON pp.id = pps.package_id
WHERE pp.deleted_at IS NULL AND pp.status = 'active'
GROUP BY pp.id, pp.name, pp.coach_id, pp.likes_count, pp.price, pp.created_at
ORDER BY subscription_count DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_package_performance_package_id 
    ON public.mv_package_performance_stats(package_id);

-- User Target Achievement Tracking View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_target_achievement AS
SELECT 
    ut.id as target_id,
    ut.user_id,
    ut.metric_type,
    ut.target_value,
    COALESCE(AVG(dm.calories_burned), 0) as actual_avg_calories,
    COALESCE(AVG(dm.workout_minutes), 0) as actual_avg_workout_minutes,
    COALESCE(AVG(dm.water_intake_ml), 0) as actual_avg_water_intake,
    COALESCE(AVG(dm.sleep_hours), 0) as actual_avg_sleep_hours,
    CASE 
        WHEN ut.metric_type = 'calories_burned' THEN COALESCE(AVG(dm.calories_burned), 0) / ut.target_value * 100
        WHEN ut.metric_type = 'workout_minutes' THEN COALESCE(AVG(dm.workout_minutes), 0) / ut.target_value * 100
        WHEN ut.metric_type = 'water_intake' THEN COALESCE(AVG(dm.water_intake_ml), 0) / (ut.target_value * 1000) * 100
        ELSE 0
    END as achievement_percentage,
    COUNT(DISTINCT dm.recorded_date) as days_tracked,
    MAX(dm.recorded_date) as last_tracked_date,
    NOW() as view_refreshed_at
FROM public.user_targets ut
LEFT JOIN public.daily_metrics dm ON ut.user_id = dm.user_id
    AND dm.recorded_date >= ut.created_at
    AND dm.recorded_date <= COALESCE(ut.deleted_at, NOW())
WHERE ut.deleted_at IS NULL
GROUP BY ut.id, ut.user_id, ut.metric_type, ut.target_value
ORDER BY achievement_percentage DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_target_achievement_user_id 
    ON public.mv_user_target_achievement(user_id);

-- ============================================================================
-- 6. MATERIALIZED VIEW REFRESH FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS TABLE(view_name TEXT, refresh_time_ms NUMERIC) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    -- Refresh coach performance stats
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_coach_performance_stats;
    end_time := NOW();
    RETURN QUERY SELECT 'mv_coach_performance_stats'::TEXT, 
                     EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Refresh user health metrics summary
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_health_metrics_summary;
    end_time := NOW();
    RETURN QUERY SELECT 'mv_user_health_metrics_summary'::TEXT, 
                     EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Refresh package performance stats
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_package_performance_stats;
    end_time := NOW();
    RETURN QUERY SELECT 'mv_package_performance_stats'::TEXT, 
                     EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Refresh user target achievement
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_target_achievement;
    end_time := NOW();
    RETURN QUERY SELECT 'mv_user_target_achievement'::TEXT, 
                     EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log refresh
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        'system'::UUID,
        'MATERIALIZED_VIEWS_REFRESHED',
        'views',
        JSON_BUILD_OBJECT('refresh_timestamp', NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SOFT DELETE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_professional_package(package_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Only package coach can delete their own packages
    IF NOT EXISTS (
        SELECT 1 FROM public.professional_packages
        WHERE id = package_id AND coach_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Can only delete own packages';
    END IF;
    
    UPDATE public.professional_packages
    SET deleted_at = NOW()
    WHERE id = package_id;
    
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (auth.uid(), 'SOFT_DELETE', 'professional_package', 
            JSON_BUILD_OBJECT('package_id', package_id, 'deleted_at', NOW()));
    
    RETURN JSON_BUILD_OBJECT('status', 'deleted', 'package_id', package_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. HISTORICAL DATA ARCHIVE STRATEGY
-- ============================================================================

-- This function identifies data eligible for archival (>12 months old)
CREATE OR REPLACE FUNCTION public.identify_historic_data_for_archive()
RETURNS TABLE(table_name TEXT, row_count BIGINT, oldest_date DATE, newest_date DATE) AS $$
BEGIN
    -- Daily metrics older than 12 months
    RETURN QUERY
    SELECT 
        'daily_metrics'::TEXT,
        COUNT(*)::BIGINT,
        MIN(recorded_date)::DATE,
        MAX(recorded_date)::DATE
    FROM public.daily_metrics
    WHERE recorded_date < (CURRENT_DATE - INTERVAL '12 months');
    
    -- Active hours older than 12 months
    RETURN QUERY
    SELECT 
        'active_hours'::TEXT,
        COUNT(*)::BIGINT,
        MIN(recorded_date)::DATE,
        MAX(recorded_date)::DATE
    FROM public.active_hours
    WHERE recorded_date < (CURRENT_DATE - INTERVAL '12 months');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. QUERY PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Function to get coach stats using materialized view (much faster)
CREATE OR REPLACE FUNCTION public.get_coach_statistics(coach_id_param UUID)
RETURNS JSON AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT * INTO stats FROM public.mv_coach_performance_stats
    WHERE coach_id = coach_id_param;
    
    RETURN JSON_BUILD_OBJECT(
        'coach_id', stats.coach_id,
        'total_clients', stats.total_clients,
        'total_packages', stats.total_packages,
        'total_likes', stats.total_likes,
        'active_subscriptions', stats.active_subscriptions,
        'total_earnings', stats.total_earnings,
        'avg_likes_per_package', ROUND(stats.avg_likes_per_package::NUMERIC, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Check partition status:
-- SELECT 
--     schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables
-- WHERE tablename LIKE 'daily_metrics_%'
-- ORDER BY tablename DESC;

-- Check materialized views:
-- SELECT * FROM information_schema.views
-- WHERE table_schema = 'public' AND table_name LIKE 'mv_%'
-- ORDER BY table_name;

-- Check soft delete setup:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND column_name = 'deleted_at'
-- ORDER BY table_name;
