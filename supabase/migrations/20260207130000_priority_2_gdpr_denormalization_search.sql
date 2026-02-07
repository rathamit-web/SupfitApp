-- Priority 2: GDPR Data Export/Deletion & Advanced Features
-- Migration: 20260207130000
-- Description: Add GDPR compliance functions, denormalization triggers, and text search indexes
-- Scope: GDPR functions, likes_count denormalization, full-text search

-- ============================================================================
-- 1. GDPR DATA EXPORT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_data RECORD;
    profile_data RECORD;
    coach_data RECORD;
    packages_data JSON;
    subscriptions_data JSON;
    metrics_data JSON;
    targets_data JSON;
    payments_data JSON;
    result JSON;
BEGIN
    -- Verify user requesting export is the target user
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Users can only export their own data';
    END IF;

    -- Fetch user record
    SELECT * INTO user_data FROM public.users WHERE id = target_user_id;
    
    -- Fetch user profile
    SELECT * INTO profile_data FROM public.user_profiles WHERE user_id = target_user_id;
    
    -- Fetch coach profile if applicable
    SELECT * INTO coach_data FROM public.coaches WHERE user_id = target_user_id;
    
    -- Fetch professional packages created by user (if coach)
    SELECT JSON_AGG(row_to_json(t)) INTO packages_data
    FROM public.professional_packages t
    WHERE coach_id = target_user_id;
    
    -- Fetch subscription history
    SELECT JSON_AGG(row_to_json(t)) INTO subscriptions_data
    FROM public.professional_package_subscriptions t
    WHERE client_id = target_user_id;
    
    -- Fetch daily metrics
    SELECT JSON_AGG(row_to_json(t)) INTO metrics_data
    FROM public.daily_metrics t
    WHERE user_id = target_user_id
    ORDER BY recorded_date DESC
    LIMIT 365;
    
    -- Fetch user targets
    SELECT JSON_AGG(row_to_json(t)) INTO targets_data
    FROM public.user_targets t
    WHERE user_id = target_user_id;
    
    -- Fetch payment history
    SELECT JSON_AGG(row_to_json(t)) INTO payments_data
    FROM public.coach_payments t
    WHERE coach_id = target_user_id;
    
    -- Build comprehensive export
    result := JSON_BUILD_OBJECT(
        'export_date', NOW(),
        'export_version', '1.0',
        'user',
        (SELECT row_to_json(user_data)),
        'profile',
        (SELECT row_to_json(profile_data)),
        'coach_profile',
        (SELECT row_to_json(coach_data)),
        'professional_packages',
        COALESCE(packages_data, '[]'::JSON),
        'package_subscriptions',
        COALESCE(subscriptions_data, '[]'::JSON),
        'daily_metrics',
        COALESCE(metrics_data, '[]'::JSON),
        'user_targets',
        COALESCE(targets_data, '[]'::JSON),
        'payment_history',
        COALESCE(payments_data, '[]'::JSON)
    );
    
    -- Log GDPR export for compliance
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (target_user_id, 'GDPR_EXPORT', 'user_data', 
            JSON_BUILD_OBJECT('export_timestamp', NOW()));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. GDPR DATA DELETION FUNCTION (Soft Delete Pattern)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_request_user_deletion(target_user_id UUID, reason TEXT DEFAULT 'User requested')
RETURNS JSON AS $$
DECLARE
    deletion_scheduled_date TIMESTAMP;
    result JSON;
BEGIN
    -- Verify user requesting deletion is the target user
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Users can only request deletion of their own account';
    END IF;
    
    -- Set deletion to 30 days from now (GDPR grace period)
    deletion_scheduled_date := NOW() + INTERVAL '30 days';
    
    -- Update user status to mark for deletion
    UPDATE public.users
    SET 
        status = 'pending'::entity_status_enum,
        deleted_at = deletion_scheduled_date,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Anonymize sensitive profile data immediately
    UPDATE public.user_profiles
    SET 
        first_name = 'Deleted',
        last_name = 'User',
        bio = NULL,
        avatar_url = NULL,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log deletion request
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        target_user_id,
        'GDPR_DELETION_REQUESTED',
        'user_account',
        JSON_BUILD_OBJECT(
            'reason', reason,
            'scheduled_deletion_date', deletion_scheduled_date,
            'request_timestamp', NOW()
        )
    );
    
    result := JSON_BUILD_OBJECT(
        'status', 'deletion_requested',
        'scheduled_deletion_date', deletion_scheduled_date,
        'grace_period_days', 30,
        'message', 'Your account will be permanently deleted in 30 days. Contact support to cancel.'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GDPR DATA DELETION EXECUTION (Run by internal process)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_execute_user_deletion_batch()
RETURNS TABLE(deleted_user_id UUID, deletion_status TEXT) AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find all users scheduled for deletion that have passed grace period
    FOR v_record IN
        SELECT id FROM public.users
        WHERE status = 'pending' AND deleted_at IS NOT NULL AND deleted_at <= NOW()
    LOOP
        -- Permanently delete user data
        DELETE FROM public.coach_clients WHERE coach_id = v_record.id OR client_id = v_record.id;
        DELETE FROM public.daily_metrics WHERE user_id = v_record.id;
        DELETE FROM public.active_hours WHERE user_id = v_record.id;
        DELETE FROM public.user_targets WHERE user_id = v_record.id;
        DELETE FROM public.professional_package_subscriptions WHERE client_id = v_record.id;
        DELETE FROM public.professional_packages WHERE coach_id = v_record.id;
        DELETE FROM public.coach_payments WHERE coach_id = v_record.id;
        DELETE FROM public.coach_stats WHERE coach_id = v_record.id;
        DELETE FROM public.coaches WHERE user_id = v_record.id;
        DELETE FROM public.user_profiles WHERE user_id = v_record.id;
        DELETE FROM public.users WHERE id = v_record.id;
        
        -- Log deletion execution
        INSERT INTO public.audit_logs (user_id, action, resource_type, details)
        VALUES (
            v_record.id,
            'GDPR_DELETION_EXECUTED',
            'user_account',
            JSON_BUILD_OBJECT('execution_timestamp', NOW())
        );
        
        RETURN QUERY SELECT v_record.id::UUID, 'deleted'::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. GDPR DATA RECTIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_rectify_user_data(
    target_user_id UUID,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verify user is rectifying their own data
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Users can only rectify their own data';
    END IF;
    
    UPDATE public.user_profiles
    SET 
        first_name = COALESCE(first_name, public.user_profiles.first_name),
        last_name = COALESCE(last_name, public.user_profiles.last_name),
        bio = COALESCE(bio, public.user_profiles.bio),
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log rectification
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        target_user_id,
        'GDPR_DATA_RECTIFIED',
        'user_profile',
        JSON_BUILD_OBJECT('rectification_timestamp', NOW())
    );
    
    RETURN JSON_BUILD_OBJECT(
        'status', 'success',
        'message', 'Your data has been updated'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. LIKES_COUNT DENORMALIZATION TRIGGER SETUP
-- ============================================================================

-- First, add likes_count column to professional_packages (if not exists)
ALTER TABLE public.professional_packages
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Add updated_at to track denormalization freshness
ALTER TABLE public.professional_packages
ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMP DEFAULT NOW();

-- Create likes tracking table (if not exists)
CREATE TABLE IF NOT EXISTS public.package_likes (
    id BIGSERIAL PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(package_id, user_id)
);

-- Add RLS to likes table
ALTER TABLE public.package_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_likes_read"
    ON public.package_likes FOR SELECT
    USING (true);

CREATE POLICY "package_likes_insert_own"
    ON public.package_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "package_likes_delete_own"
    ON public.package_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_likes_package_id 
    ON public.package_likes(package_id);

CREATE INDEX IF NOT EXISTS idx_package_likes_user_id 
    ON public.package_likes(user_id);

-- ============================================================================
-- 6. LIKES_COUNT DENORMALIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_package_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the packages table with current likes count
    UPDATE public.professional_packages
    SET 
        likes_count = (SELECT COUNT(*) FROM public.package_likes WHERE package_id = NEW.package_id),
        stats_updated_at = NOW()
    WHERE id = NEW.package_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT on likes
DROP TRIGGER IF EXISTS trigger_update_likes_count_insert ON public.package_likes;
CREATE TRIGGER trigger_update_likes_count_insert
    AFTER INSERT ON public.package_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_package_likes_count();

-- Create trigger for DELETE on likes
DROP TRIGGER IF EXISTS trigger_update_likes_count_delete ON public.package_likes;
CREATE TRIGGER trigger_update_likes_count_delete
    AFTER DELETE ON public.package_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_package_likes_count();

-- ============================================================================
-- 7. BULK UPDATE LIKES COUNT (Run once to backfill)
-- ============================================================================

-- Execute this to backfill likes_count with current data:
-- UPDATE public.professional_packages
-- SET likes_count = COALESCE((SELECT COUNT(*) FROM public.package_likes WHERE package_id = professional_packages.id), 0),
--     stats_updated_at = NOW();

-- ============================================================================
-- 8. TEXT SEARCH INDEXES FOR PROFESSIONAL_PACKAGES
-- ============================================================================

-- Add tsvector column for full-text search
ALTER TABLE public.professional_packages
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
    SETWEIGHT(TO_TSVECTOR('english', COALESCE(name, '')), 'A') ||
    SETWEIGHT(TO_TSVECTOR('english', COALESCE(description, '')), 'B') ||
    SETWEIGHT(TO_TSVECTOR('english', COALESCE(tags, '')), 'C')
) STORED;

-- Create GIN index for text search (for fast full-text queries)
CREATE INDEX IF NOT EXISTS idx_professional_packages_search 
    ON public.professional_packages USING GIN (search_vector);

-- Create B-Tree index for sorting by relevant fields
CREATE INDEX IF NOT EXISTS idx_professional_packages_active_status
    ON public.professional_packages(status, visibility, created_at DESC)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_professional_packages_coach_active
    ON public.professional_packages(coach_id, status, created_at DESC);

-- ============================================================================
-- 9. TEXT SEARCH FUNCTION FOR PROFESSIONAL_PACKAGES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_professional_packages(
    search_query TEXT,
    v_limit INTEGER DEFAULT 20,
    v_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    coach_id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    likes_count INTEGER,
    created_at TIMESTAMP,
    tsrank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.coach_id,
        pp.name,
        pp.description,
        pp.price,
        pp.likes_count,
        pp.created_at,
        TS_RANK(pp.search_vector, PLAINTO_TSQUERY('english', search_query)) as tsrank
    FROM public.professional_packages pp
    WHERE 
        pp.status = 'active' AND
        pp.visibility IN ('public', 'unlisted') AND
        pp.search_vector @@ PLAINTO_TSQUERY('english', search_query)
    ORDER BY tsrank DESC, pp.likes_count DESC, pp.created_at DESC
    LIMIT v_limit
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. VERIFY MIGRATIONS
-- ============================================================================

-- Query to verify tables have new columns:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('professional_packages', 'package_likes')
-- ORDER BY table_name, ordinal_position;

-- Query to verify functions created:
-- SELECT routine_name, routine_type FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name LIKE '%gdpr%'
-- ORDER BY routine_name;

-- Query to verify indexes:
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'professional_packages'
-- ORDER BY indexname;
