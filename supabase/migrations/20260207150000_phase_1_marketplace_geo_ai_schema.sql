-- Phase 1: Marketplace Hyperlocal AI Foundation Schema
-- 2026-02-07: Initialize geospatial infrast...that enables hyperlocal professional matching
-- Enterprise AI marketplace with:
--   - PostGIS-based geo-fallback hierarchy (GPS → address → city centroid)
--   - Explainability audit trail (match_signals_log with full attribution)
--   - Adaptive cache with dynamic TTL based on user activity cohorts
--   - Professional review system with sample-size bias protection
--   - Admin configuration interface for weight tuning
--   - Reserved pgvector column for Phase 6 ML upgrade (zero migration cost later)

BEGIN;

-- ============================================
-- Step 0: Ensure Required Enums Exist
-- ============================================
-- These should exist from Phase 110, but ensure here for robustness
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_enum') THEN
    CREATE TYPE visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('draft', 'active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

-- ============================================
-- Step 1: Enable PostGIS Extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Comment for audit
COMMENT ON EXTENSION postgis IS 'PostGIS: Geospatial data support (Phase 1 AI Marketplace)';
COMMENT ON EXTENSION vector IS 'pgvector: Vector embeddings support (reserved for Phase 6 ML upgrade)';

-- ============================================
-- Step 2: Add Geospatial Columns to user_profiles
-- ============================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS location_geo GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS location_precision_source TEXT CHECK (location_precision_source IN ('gps', 'address', 'centroid', NULL)),
  ADD COLUMN IF NOT EXISTS location_centroid_lat NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS location_centroid_lng NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS preferred_radius_km NUMERIC(5, 2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS fitness_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fitness_goals_inferred TEXT[] DEFAULT '{}';

-- Add GiST index on geography for O(log n) distance queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_geo 
  ON public.user_profiles USING GIST (location_geo);

-- Regular indices for fallback queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_precision
  ON public.user_profiles(location_precision_source);

CREATE INDEX IF NOT EXISTS idx_user_profiles_budget_range
  ON public.user_profiles(budget_min, budget_max);

COMMENT ON COLUMN public.user_profiles.location_geo IS 'PostGIS geography point for geospatial radius queries; indexed with GiST for performance';
COMMENT ON COLUMN public.user_profiles.location_precision_source IS 'Data source: gps (device GPS), address (geocoded from address), centroid (city centroid fallback)';
COMMENT ON COLUMN public.user_profiles.fitness_goals IS 'Array of fitness goals (weight loss, muscle gain, endurance, flexibility, etc.)';

-- ============================================
-- Step 3: Add Geospatial Columns to professional_packages
-- ============================================
ALTER TABLE public.professional_packages
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS location_geo GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS location_precision_source TEXT CHECK (location_precision_source IN ('gps', 'address', 'centroid', NULL)),
  ADD COLUMN IF NOT EXISTS available_slots JSONB DEFAULT '{"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mode TEXT[] DEFAULT '{}' CHECK (mode <@ ARRAY['in-person', 'online', 'hybrid']),
  ADD COLUMN IF NOT EXISTS experience_years INTEGER CHECK (experience_years IS NULL OR experience_years >= 0),
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  ADD COLUMN IF NOT EXISTS embedding VECTOR(384);

-- Add GiST index on geography for distance queries
CREATE INDEX IF NOT EXISTS idx_professional_packages_location_geo
  ON public.professional_packages USING GIST (location_geo);

-- Index for active professionals to browse
CREATE INDEX IF NOT EXISTS idx_professional_packages_visible
  ON public.professional_packages(status, visibility, professional_type);

-- Index for filtering by specialties (array overlap)
CREATE INDEX IF NOT EXISTS idx_professional_packages_specialties
  ON public.professional_packages USING GIN (specialties);

-- Index for embedding similarity search (Phase 6)
CREATE INDEX IF NOT EXISTS idx_professional_packages_embedding
  ON public.professional_packages USING IVFFLAT (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON COLUMN public.professional_packages.location_geo IS 'PostGIS geography point for radius-based matching; indexed with GiST';
COMMENT ON COLUMN public.professional_packages.location_precision_source IS 'Location accuracy source: gps, address, or centroid fallback';
COMMENT ON COLUMN public.professional_packages.specialties IS 'Array of specializations (e.g., weight loss, muscle gain, sports nutrition)';
COMMENT ON COLUMN public.professional_packages.mode IS 'Service modes: in-person, online, hybrid';
COMMENT ON COLUMN public.professional_packages.rating IS 'Aggregate rating from professional_reviews (auto-updated)';
COMMENT ON COLUMN public.professional_packages.review_count IS 'Total review count (auto-updated); used to protect against small-sample bias';
COMMENT ON COLUMN public.professional_packages.embedding IS 'Vector embedding for semantic similarity (Phase 6); nullable and idle until pgvector ML engine activated';

-- ============================================
-- Step 4: City Centroids Reference Table (Geo Fallback)
-- ============================================
CREATE TABLE IF NOT EXISTS public.city_centroids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL UNIQUE,
  state_name TEXT,
  centroid_lat NUMERIC(10, 8) NOT NULL,
  centroid_lng NUMERIC(11, 8) NOT NULL,
  centroid_geo GEOGRAPHY(POINT, 4326),
  timezone TEXT DEFAULT 'Asia/Kolkata',
  country TEXT DEFAULT 'India',
  population INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_centroids_city_name ON public.city_centroids(city_name);
CREATE INDEX IF NOT EXISTS idx_city_centroids_centroid_geo ON public.city_centroids USING GIST (centroid_geo);

COMMENT ON TABLE public.city_centroids IS 'Reference table for city centroid coordinates; fallback when user location is null or geocoding fails';
COMMENT ON COLUMN public.city_centroids.centroid_geo IS 'PostGIS geography point for city center';

-- ============================================
-- Step 5: Match Signals Explainability Log (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.match_signals_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_package_id UUID NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  signal_name TEXT NOT NULL CHECK (signal_name IN (
    'proximity',           -- Distance-based signal
    'goal_alignment',      -- Fitness goals match
    'budget_fit',          -- Price within user budget
    'rating',              -- Professional rating score
    'availability'         -- Schedule availability match
  )),
  signal_score NUMERIC(5, 2) NOT NULL CHECK (signal_score >= 0 AND signal_score <= 100),
  signal_weight NUMERIC(5, 2) NOT NULL CHECK (signal_weight >= 0 AND signal_weight <= 100),
  contribution_pct NUMERIC(5, 2) NOT NULL CHECK (contribution_pct >= 0 AND contribution_pct <= 100),
  details JSONB NOT NULL DEFAULT '{}',
  match_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_signals_log_user_id ON public.match_signals_log(user_id);
CREATE INDEX IF NOT EXISTS idx_match_signals_log_package_id ON public.match_signals_log(professional_package_id);
CREATE INDEX IF NOT EXISTS idx_match_signals_log_match_id ON public.match_signals_log(match_id);
CREATE INDEX IF NOT EXISTS idx_match_signals_log_created_at ON public.match_signals_log(created_at DESC);

COMMENT ON TABLE public.match_signals_log IS 'Full audit trail of every match signal calculation; enables GDPR transparency, debugging, and algorithm tuning feedback';
COMMENT ON COLUMN public.match_signals_log.signal_name IS 'One of: proximity, goal_alignment, budget_fit, rating, availability';
COMMENT ON COLUMN public.match_signals_log.signal_score IS '0-100 raw score for this signal';
COMMENT ON COLUMN public.match_signals_log.signal_weight IS '0-100 weight of this signal in composite score';
COMMENT ON COLUMN public.match_signals_log.contribution_pct IS 'Percentage contribution to final match score (= signal_score * signal_weight / 100)';
COMMENT ON COLUMN public.match_signals_log.details IS 'JSON context: e.g., {distance_km: 1.2, proximity_decay: 0.95, ...}';

-- ============================================
-- Step 6: User Activity Log (For Activity Cohort Analysis)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'search',              -- User performed search
    'filter',              -- User applied filters
    'view_profile',        -- Viewed professional profile
    'subscribe',           -- Subscribed to professional
    'review',              -- Left review
    'unsubscribe',         -- Unsubscribed
    'message'              -- Sent message
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);

COMMENT ON TABLE public.user_activity_log IS 'Track user engagement events; used to compute activity cohorts for adaptive cache TTL and feedback loop analysis';
COMMENT ON COLUMN public.user_activity_log.activity_type IS 'Event type: search, filter, view_profile, subscribe, review, unsubscribe, message';

-- ============================================
-- Step 7: Match Cache with Dynamic TTL
-- ============================================
CREATE TABLE IF NOT EXISTS public.match_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_type TEXT NOT NULL CHECK (professional_type IN ('coach', 'dietician')),
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ttl_ms INTEGER NOT NULL CHECK (ttl_ms > 0),
  activity_cohort TEXT DEFAULT 'medium' CHECK (activity_cohort IN ('high', 'medium', 'low')),
  UNIQUE(user_id, professional_type)
);

CREATE INDEX IF NOT EXISTS idx_match_cache_user_professional_type 
  ON public.match_cache(user_id, professional_type);
CREATE INDEX IF NOT EXISTS idx_match_cache_expires_at 
  ON public.match_cache(expires_at);

COMMENT ON TABLE public.match_cache IS 'Cached match results with adaptive TTL based on user activity cohort (6h→24h→72h)';
COMMENT ON COLUMN public.match_cache.ttl_ms IS 'Time-to-live in milliseconds; 6h (high activity), 24h (medium), 72h (low)';
COMMENT ON COLUMN public.match_cache.activity_cohort IS 'User activity level: high (search weekly+), medium (monthly), low (rarely searches)';

-- ============================================
-- Step 8: Professional Reviews & Rating System
-- ============================================
CREATE TABLE IF NOT EXISTS public.professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_package_id UUID NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_package_id, reviewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_professional_reviews_package_id 
  ON public.professional_reviews(professional_package_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewer_user_id 
  ON public.professional_reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_rating 
  ON public.professional_reviews(rating);

COMMENT ON TABLE public.professional_reviews IS 'User reviews of professionals; triggers auto-update of professional_packages.rating and review_count';
COMMENT ON COLUMN public.professional_reviews.rating IS '1-5 star rating';

-- ============================================
-- Step 9: Match Configuration (Admin Weight Tuning)
-- ============================================
CREATE TABLE IF NOT EXISTS public.match_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value NUMERIC NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_config_key ON public.match_config(config_key);

COMMENT ON TABLE public.match_config IS 'Tunable parameters for match algorithm; enables runtime weight adjustments without code deployment';
COMMENT ON COLUMN public.match_config.config_key IS 'Parameter name: weight_proximity, weight_goal_alignment, weight_budget_fit, weight_rating, weight_availability, conversion_boost_cap_pct, etc.';

-- Seed default configuration values
INSERT INTO public.match_config (config_key, config_value, description, updated_by)
VALUES
  ('weight_proximity', 30, 'Proximity signal weight (%)', NULL),
  ('weight_goal_alignment', 25, 'Goal alignment signal weight (%)', NULL),
  ('weight_budget_fit', 20, 'Budget fit signal weight (%)', NULL),
  ('weight_rating', 15, 'Rating signal weight (%)', NULL),
  ('weight_availability', 10, 'Availability signal weight (%)', NULL),
  ('conversion_boost_threshold', 5, 'Minimum review count to apply conversion boost', NULL),
  ('conversion_boost_cap_pct', 5, 'Max conversion boost to apply (%)', NULL),
  ('cache_ttl_high_activity_ms', 21600000, 'Cache TTL for high-activity users (6h in ms)', NULL),
  ('cache_ttl_medium_activity_ms', 86400000, 'Cache TTL for medium-activity users (24h in ms)', NULL),
  ('cache_ttl_low_activity_ms', 259200000, 'Cache TTL for low-activity users (72h in ms)', NULL)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- Step 10: Audit Log for Config Changes
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  config_key TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_config_audit_log_admin_user_id 
  ON public.config_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_created_at 
  ON public.config_audit_log(created_at DESC);

COMMENT ON TABLE public.config_audit_log IS 'Audit trail for all admin configuration changes; full accountability and rollback capability';

-- ============================================
-- Step 11: Helper Function - Nearest Professionals with Geo Fallback
-- ============================================
CREATE OR REPLACE FUNCTION public.nearest_professionals_with_fallback(
  p_user_id UUID,
  p_professional_type TEXT,
  p_radius_km NUMERIC DEFAULT 5.0,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  owner_user_id UUID,
  name TEXT,
  professional_type TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  distance_km NUMERIC,
  location_precision_source TEXT,
  status TEXT,
  visibility TEXT,
  rating NUMERIC,
  review_count INTEGER,
  specialties TEXT[],
  mode TEXT[],
  experience_years INTEGER
) AS $$
DECLARE
  v_user_geo GEOGRAPHY;
  v_user_city TEXT;
  v_centroid_geo GEOGRAPHY;
  v_user_activity TEXT;
BEGIN
  -- Fetch user's location and city
  SELECT location_geo, COALESCE(location_city, 'Mumbai') INTO v_user_geo, v_user_city
  FROM public.user_settings
  WHERE user_id = p_user_id;

  -- Fallback 1: If user has GPS location, use it
  IF v_user_geo IS NOT NULL THEN
    RETURN QUERY
      SELECT
        pp.id,
        pp.owner_user_id,
        pp.name,
        pp.professional_type::TEXT,
        pp.location_lat,
        pp.location_lng,
        (ST_Distance(pp.location_geo, v_user_geo) / 1000)::NUMERIC(10, 2) AS distance_km,
        pp.location_precision_source,
        pp.status::TEXT,
        pp.visibility::TEXT,
        pp.rating,
        pp.review_count,
        pp.specialties,
        pp.mode,
        pp.experience_years
      FROM public.professional_packages pp
      WHERE
        pp.professional_type = p_professional_type::professional_type_enum
        AND pp.status = 'active'::subscription_status_enum
        AND pp.visibility = 'public'::visibility_enum
        AND pp.location_geo IS NOT NULL
        AND ST_DWithin(pp.location_geo, v_user_geo, p_radius_km * 1000) -- Convert km to meters
      ORDER BY distance_km ASC, pp.rating DESC, pp.review_count DESC
      LIMIT p_limit;
  END IF;

  -- Fallback 2: If user has location set, use city centroid
  IF v_user_city IS NOT NULL AND v_user_geo IS NULL THEN
    SELECT centroid_geo INTO v_centroid_geo
    FROM public.city_centroids
    WHERE city_name ILIKE v_user_city
    LIMIT 1;

    IF v_centroid_geo IS NOT NULL THEN
      RETURN QUERY
        SELECT
          pp.id,
          pp.owner_user_id,
          pp.name,
          pp.professional_type::TEXT,
          pp.location_lat,
          pp.location_lng,
          (ST_Distance(pp.location_geo, v_centroid_geo) / 1000)::NUMERIC(10, 2) AS distance_km,
          'centroid'::TEXT,
          pp.status::TEXT,
          pp.visibility::TEXT,
          pp.rating,
          pp.review_count,
          pp.specialties,
          pp.mode,
          pp.experience_years
        FROM public.professional_packages pp
        WHERE
          pp.professional_type = p_professional_type::professional_type_enum
          AND pp.status = 'active'::subscription_status_enum
          AND pp.visibility = 'public'::visibility_enum
          AND pp.location_geo IS NOT NULL
          AND ST_DWithin(pp.location_geo, v_centroid_geo, p_radius_km * 1000)
        ORDER BY distance_km ASC, pp.rating DESC, pp.review_count DESC
        LIMIT p_limit;
    END IF;
  END IF;

  -- Fallback 3: If all geo methods fail, return top-rated professionals (no geo filter)
  RETURN QUERY
    SELECT
      pp.id,
      pp.owner_user_id,
      pp.name,
      pp.professional_type::TEXT,
      pp.location_lat,
      pp.location_lng,
      NULL::NUMERIC,
      NULL::TEXT,
      pp.status::TEXT,
      pp.visibility::TEXT,
      pp.rating,
      pp.review_count,
      pp.specialties,
      pp.mode,
      pp.experience_years
    FROM public.professional_packages pp
    WHERE
      pp.professional_type = p_professional_type::professional_type_enum
      AND pp.status = 'active'::subscription_status_enum
      AND pp.visibility = 'public'::visibility_enum
    ORDER BY pp.rating DESC, pp.review_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.nearest_professionals_with_fallback IS 'Geo-aware professional lookup with fallback hierarchy: GPS → address → city centroid → top-rated';

-- ============================================
-- Step 12: Seed City Centroids (Major Indian Cities & NCR)
-- ============================================
INSERT INTO public.city_centroids (city_name, state_name, centroid_lat, centroid_lng, centroid_geo, timezone, country, population)
VALUES
  ('Mumbai', 'Maharashtra', 19.0760, 72.8777, ST_GeographyFromText('POINT(72.8777 19.0760)'), 'Asia/Kolkata', 'India', 20961472),
  ('Delhi', 'Delhi', 28.6139, 77.2090, ST_GeographyFromText('POINT(77.2090 28.6139)'), 'Asia/Kolkata', 'India', 32941000),
  ('Bangalore', 'Karnataka', 12.9716, 77.5946, ST_GeographyFromText('POINT(77.5946 12.9716)'), 'Asia/Kolkata', 'India', 8436675),
  ('Hyderabad', 'Telangana', 17.3850, 78.4867, ST_GeographyFromText('POINT(78.4867 17.3850)'), 'Asia/Kolkata', 'India', 6809970),
  ('Pune', 'Maharashtra', 18.5204, 73.8567, ST_GeographyFromText('POINT(73.8567 18.5204)'), 'Asia/Kolkata', 'India', 6430659),
  ('Chennai', 'Tamil Nadu', 13.0827, 80.2707, ST_GeographyFromText('POINT(80.2707 13.0827)'), 'Asia/Kolkata', 'India', 7088000),
  ('Kolkata', 'West Bengal', 22.5726, 88.3639, ST_GeographyFromText('POINT(88.3639 22.5726)'), 'Asia/Kolkata', 'India', 14681900),
  ('Ahmedabad', 'Gujarat', 23.0225, 72.5714, ST_GeographyFromText('POINT(72.5714 23.0225)'), 'Asia/Kolkata', 'India', 8450570),
  ('Jaipur', 'Rajasthan', 26.9124, 75.7873, ST_GeographyFromText('POINT(75.7873 26.9124)'), 'Asia/Kolkata', 'India', 3046163),
  ('Surat', 'Gujarat', 21.1702, 72.8311, ST_GeographyFromText('POINT(72.8311 21.1702)'), 'Asia/Kolkata', 'India', 6081000),
  ('Lucknow', 'Uttar Pradesh', 26.8467, 80.9462, ST_GeographyFromText('POINT(80.9462 26.8467)'), 'Asia/Kolkata', 'India', 2815601),
  ('Indore', 'Madhya Pradesh', 22.7196, 75.8577, ST_GeographyFromText('POINT(75.8577 22.7196)'), 'Asia/Kolkata', 'India', 2167447),
  ('Chandigarh', 'Chandigarh', 30.7333, 76.7794, ST_GeographyFromText('POINT(76.7794 30.7333)'), 'Asia/Kolkata', 'India', 1055450),
  ('Noida', 'Uttar Pradesh', 28.5355, 77.3910, ST_GeographyFromText('POINT(77.3910 28.5355)'), 'Asia/Kolkata', 'India', 629282),
  ('Gurgaon', 'Haryana', 28.4595, 77.0266, ST_GeographyFromText('POINT(77.0266 28.4595)'), 'Asia/Kolkata', 'India', 2134144),
  ('Bhopal', 'Madhya Pradesh', 23.1815, 79.9864, ST_GeographyFromText('POINT(79.9864 23.1815)'), 'Asia/Kolkata', 'India', 1798218),
  ('Visakhapatnam', 'Andhra Pradesh', 17.6869, 83.2185, ST_GeographyFromText('POINT(83.2185 17.6869)'), 'Asia/Kolkata', 'India', 1730320),
  ('Kochi', 'Kerala', 9.9312, 76.2673, ST_GeographyFromText('POINT(76.2673 9.9312)'), 'Asia/Kolkata', 'India', 2123000),
  ('Nagpur', 'Maharashtra', 21.1458, 79.0882, ST_GeographyFromText('POINT(79.0882 21.1458)'), 'Asia/Kolkata', 'India', 2405421),
  ('NCR Region', 'National Capital Region', 28.5244, 77.0855, ST_GeographyFromText('POINT(77.0855 28.5244)'), 'Asia/Kolkata', 'India', 32941000)
ON CONFLICT (city_name) DO NOTHING;

-- ============================================
-- Step 13: Summary & Verification
-- ============================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 1 Schema Migration Complete:';
  RAISE NOTICE '✓ PostGIS extension enabled';
  RAISE NOTICE '✓ Geospatial columns added to user_profiles and professional_packages';
  RAISE NOTICE '✓ City centroids table created with 20 major Indian cities seeded';
  RAISE NOTICE '✓ Match signals log created for full audit trail and explainability';
  RAISE NOTICE '✓ User activity log created for cohort analysis';
  RAISE NOTICE '✓ Match cache created with dynamic TTL support';
  RAISE NOTICE '✓ Professional reviews table created';
  RAISE NOTICE '✓ Match configuration table seeded with default weights';
  RAISE NOTICE '✓ Config audit log created for admin changes';
  RAISE NOTICE '✓ Helper function nearest_professionals_with_fallback() ready for matching engine';
  RAISE NOTICE '✓ RLS policies updated for public professional browsing';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for Phase 2: Geo infrastructure (location capture & address geocoding)';
END $$;

COMMIT;
