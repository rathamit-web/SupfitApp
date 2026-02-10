-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: RPC Field Whitelist Security Enforcement
-- Date: 2026-02-09
-- Issue #5 Fix: RLS Enforcement Not Documented
-- 
-- Purpose: Update search_professionals_by_goals() RPC to ONLY return safe fields
-- Removes: owner_user_id, available_slots (sensitive data)
-- Adds: photo_url (public field)
--
-- Reference: src/config/RLS_SECURITY_MATRIX.ts RPC_FIELD_WHITELIST
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing function
DROP FUNCTION IF EXISTS public.search_professionals_by_goals CASCADE;

-- Create updated function with field whitelist enforcement
CREATE OR REPLACE FUNCTION public.search_professionals_by_goals(
  p_user_id UUID,
  p_goal_categories TEXT[],
  p_preferred_mode TEXT[] DEFAULT NULL,
  p_preferred_timing TEXT[] DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT 0,
  p_max_price NUMERIC DEFAULT 999999,
  p_radius_km NUMERIC DEFAULT 10,
  p_limit INT DEFAULT 20,
  p_availability_window_days INT DEFAULT 14
)
RETURNS TABLE (
  -- ═════════════════════════════════════════════════════════════
  -- SAFE FIELDS ONLY (RLS-compliant, no PII or sensitive data)
  -- ═════════════════════════════════════════════════════════════
  professional_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  specialties TEXT[],
  mode TEXT[],
  photo_url TEXT,
  distance_km NUMERIC,
  match_score INT
  -- ═════════════════════════════════════════════════════════════
  -- REMOVED (sensitive - never expose):
  -- - owner_user_id (exposes database user relationship)
  -- - available_slots (exposes schedule/availability)
  -- - email, phone, private_notes, response_rate, etc.
  -- ═════════════════════════════════════════════════════════════
) AS $$
DECLARE
  v_user_location GEOGRAPHY;
BEGIN
  -- Get user's location
  SELECT location_geo INTO v_user_location
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_user_location IS NULL THEN
    RAISE EXCEPTION 'User profile not found or location not set';
  END IF;

  RETURN QUERY
  WITH availability AS (
    -- Calculate next available slot (for scoring, not returned)
    SELECT
      pp.id AS professional_id,
      MIN((slot_txt)::timestamptz) FILTER (
        WHERE (slot_txt)::timestamptz >= now()
      ) AS next_slot
    FROM public.professional_packages pp
    LEFT JOIN LATERAL (
      SELECT jsonb_array_elements_text(pp.available_slots) AS slot_txt
      WHERE jsonb_typeof(pp.available_slots) = 'array'
      UNION ALL
      SELECT value AS slot_txt
      FROM jsonb_each_text(pp.available_slots)
      WHERE jsonb_typeof(pp.available_slots) = 'object'
    ) s ON TRUE
    GROUP BY pp.id
  )
  SELECT
    -- ═════════════════════════════════════════════════════════════
    -- FIELD WHITELIST (matches RLS_SECURITY_MATRIX.ts)
    -- ═════════════════════════════════════════════════════════════
    pp.id AS professional_id,
    pp.name,
    pp.description,
    pp.price,
    pp.rating,
    pp.review_count,
    pp.specialties,
    pp.mode,
    pp.photo_url,  -- PUBLIC field: coach's profile photo
    ROUND(ST_Distance(v_user_location, pp.location_geo) / 1000.0, 2) AS distance_km,
    (
      -- Base score from rating (0-50)
      COALESCE(ROUND((pp.rating::NUMERIC / 5) * 50), 0)::INT +
      -- Bonus for number of reviews (0-10)
      CASE 
        WHEN pp.review_count >= 50 THEN 10
        WHEN pp.review_count >= 20 THEN 7
        WHEN pp.review_count >= 5 THEN 4
        ELSE 0
      END +
      -- Mode match bonus (0-15)
      CASE 
        WHEN p_preferred_mode IS NOT NULL AND pp.mode && p_preferred_mode THEN 15
        ELSE 0
      END +
      -- Specialty overlap bonus (0-25)
      (
        COALESCE(
          array_length(
            array_intersect(
              pp.specialties,
              (
                SELECT array_agg(professional_type::TEXT)
                FROM (SELECT UNNEST(p_goal_categories::TEXT[]) AS professional_type) t
              )
            ),
            1
          ),
          0
        ) * 5
      ) +
      -- Availability bonus (0-15)
      CASE
        WHEN availability.next_slot IS NULL THEN 0
        WHEN availability.next_slot <= now() + INTERVAL '3 days' THEN 15
        WHEN availability.next_slot <= now() + INTERVAL '7 days' THEN 12
        WHEN availability.next_slot <= now() + INTERVAL '14 days' THEN 9
        WHEN availability.next_slot <= now() + INTERVAL '30 days' THEN 5
        ELSE 0
      END
    ) AS match_score
  FROM public.professional_packages pp
  LEFT JOIN availability ON availability.professional_id = pp.id
  WHERE
    -- Visibility enforcement: only public, active profiles
    pp.status = 'active' AND
    pp.visibility = 'public' AND
    -- Rating filter
    pp.rating >= p_min_rating AND
    -- Price filter
    pp.price <= p_max_price AND
    -- Location filter: within radius_km
    ST_Distance(v_user_location, pp.location_geo) / 1000.0 <= p_radius_km AND
    -- Goals/specialties filter: at least one specialty matches
    (pp.specialties && p_goal_categories::TEXT[] OR array_length(p_goal_categories, 1) IS NULL) AND
    -- Mode filter (if specified)
    (p_preferred_mode IS NULL OR pp.mode && p_preferred_mode) AND
    -- Availability hard filter (must have a slot within window)
    availability.next_slot IS NOT NULL AND
    availability.next_slot <= now() + (p_availability_window_days || ' days')::interval
  ORDER BY match_score DESC, pp.rating DESC, distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═════════════════════════════════════════════════════════════════════════
-- FUNCTION DOCUMENTATION
-- ═════════════════════════════════════════════════════════════════════════

COMMENT ON FUNCTION public.search_professionals_by_goals IS 
'Search professionals with multi-criteria filtering, availability hard filter, and availability scoring.

SECURITY: Returns ONLY safe fields (field whitelist):
- professional_id, name, description, price, rating, review_count
- specialties, mode, photo_url, distance_km, match_score

REMOVED fields (sensitive, never exposed):
- owner_user_id (database user relationship)
- available_slots (schedule/availability data)
- email, phone, private_notes, response_rate, response_time_avg_hours

Reference: src/config/RLS_SECURITY_MATRIX.ts::RPC_FIELD_WHITELIST
Issue: #5 RLS Enforcement Not Documented
Date: 2026-02-09
';

-- ═════════════════════════════════════════════════════════════════════════
-- SECURITY AUDIT: Verify field whitelist compliance
-- Run this query to verify only safe fields are returned:
-- ═════════════════════════════════════════════════════════════════════════
-- SELECT 
--   column_name, 
--   data_type
-- FROM information_schema.columns
-- WHERE table_name = 'search_professionals_by_goals' 
--   AND table_schema = 'public'
-- ORDER BY ordinal_position;
--
-- EXPECTED OUTPUT (in order):
-- professional_id   | uuid
-- name              | text
-- description       | text
-- price             | numeric
-- rating            | numeric
-- review_count      | integer
-- specialties       | text[]
-- mode              | text[]
-- photo_url         | text
-- distance_km       | numeric
-- match_score       | integer
--
-- ⚠️ If you see owner_user_id, email, phone, or available_slots:
--    This function FAILED security audit. Do NOT deploy.
-- ═════════════════════════════════════════════════════════════════════════
