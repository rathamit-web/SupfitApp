-- Migration: Add Search Criteria & Preferences Schema
-- Phase: Professional Search & Discovery
-- Date: 2026-02-07

-- ============================================
-- Step 1: Extend user_profiles with search preferences
-- ============================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferred_timing TEXT[] DEFAULT '{}'::TEXT[] CHECK (preferred_timing <@ ARRAY['morning', 'evening', 'any_time']),
  ADD COLUMN IF NOT EXISTS preferred_mode TEXT[] DEFAULT '{}' CHECK (preferred_mode <@ ARRAY['in-person', 'online', 'hybrid']),
  ADD COLUMN IF NOT EXISTS search_radius_km NUMERIC DEFAULT 10 CHECK (search_radius_km > 0);

-- ============================================
-- Step 2: Create search_criteria enum
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'search_goal_category') THEN
    CREATE TYPE search_goal_category AS ENUM (
      'weight_loss',
      'muscle_gain',
      'yoga_stretching',
      'posture_therapy',
      'cardio_fitness',
      'beginner_training',
      'pilates',
      'nutrition_coaching',
      'sports_performance',
      'injury_recovery',
      'flexibility',
      'mobility',
      'core_strength',
      'endurance_training',
      'functional_fitness',
      'rehabilitation'
    );
  END IF;
END $$;

-- ============================================
-- Step 3: Create user_search_goals table (preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_search_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_category search_goal_category NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_category)
);

CREATE INDEX IF NOT EXISTS idx_user_search_goals_user_id ON public.user_search_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_goals_goal ON public.user_search_goals(goal_category);

COMMENT ON TABLE public.user_search_goals IS 'User fitness goals for search filtering and preference tracking';
COMMENT ON COLUMN public.user_search_goals.priority IS 'Priority level (0-5) where 5 is highest priority';

-- ============================================
-- Step 4: Create search_history table (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query_filters JSONB NOT NULL DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  selected_professional_id UUID,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(viewed_at DESC);

COMMENT ON TABLE public.search_history IS 'Tracks user search queries and results for analytics and personalization';

-- ============================================
-- Step 5: Enable RLS on new tables
-- ============================================
ALTER TABLE public.user_search_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 6: Create RLS policies for user_search_goals
-- ============================================
CREATE POLICY "user_search_goals_select_own" 
  ON public.user_search_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "user_search_goals_insert_own" 
  ON public.user_search_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_search_goals_update_own" 
  ON public.user_search_goals FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_search_goals_delete_own" 
  ON public.user_search_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Step 7: Create RLS policies for search_history
-- ============================================
CREATE POLICY "search_history_select_own" 
  ON public.search_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "search_history_insert_own" 
  ON public.search_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Step 8: Create search_professionals function
-- ============================================
CREATE OR REPLACE FUNCTION public.search_professionals_by_goals(
  p_user_id UUID,
  p_goal_categories TEXT[],
  p_preferred_mode TEXT[] DEFAULT NULL,
  p_preferred_timing TEXT[] DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT 0,
  p_max_price NUMERIC DEFAULT 999999,
  p_radius_km NUMERIC DEFAULT 10,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  professional_id UUID,
  owner_user_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  specialties TEXT[],
  mode TEXT[],
  available_slots JSONB,
  distance_km NUMERIC,
  match_score INT
) AS $$
DECLARE
  v_user_location GEOGRAPHY;
  v_goal_count INT;
  v_matched_goals INT;
BEGIN
  -- Get user's location
  SELECT location_geo INTO v_user_location
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  IF v_user_location IS NULL THEN
    RAISE EXCEPTION 'User profile not found or location not set';
  END IF;
  
  -- Search professionals matching criteria
  RETURN QUERY
  SELECT
    pp.id,
    pp.owner_user_id,
    pp.name,
    pp.description,
    pp.price,
    pp.rating,
    pp.review_count,
    pp.specialties,
    pp.mode,
    pp.available_slots,
    ROUND(ST_Distance(v_user_location, pp.location_geo) / 1000.0, 2) as distance_km,
    -- Calculate match score: higher = better match
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
        (array_length(array_intersect(pp.specialties, (
          SELECT array_agg(professional_type::TEXT)
          FROM (SELECT UNNEST(p_goal_categories::TEXT[]) as professional_type) t
        )), 1) COALESCE 0) * 5
      )
    ) as match_score
  FROM public.professional_packages pp
  WHERE
    pp.status = 'active' AND
    pp.visibility = 'public' AND
    pp.rating >= p_min_rating AND
    pp.price <= p_max_price AND
    -- Location filter: within radius_km
    ST_Distance(v_user_location, pp.location_geo) / 1000.0 <= p_radius_km AND
    -- Goals/specialties filter: at least one specialty matches
    (pp.specialties && p_goal_categories::TEXT[] OR array_length(p_goal_categories, 1) IS NULL) AND
    -- Mode filter (if specified)
    (p_preferred_mode IS NULL OR pp.mode && p_preferred_mode)
  ORDER BY match_score DESC, pp.rating DESC, distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.search_professionals_by_goals IS 'Search professionals with multi-criteria filtering (goals, mode, rating, price, distance)';

-- ============================================
-- Step 9: Create search goal category reference table
-- ============================================
CREATE TABLE IF NOT EXISTS public.search_goal_categories (
  id search_goal_category PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  priority_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.search_goal_categories (id, label, description, icon_name, priority_index)
VALUES
  ('weight_loss', 'Weight Loss', 'Lose weight safely and sustainably', 'weight', 1),
  ('muscle_gain', 'Muscle Gain', 'Build and strengthen muscles', 'dumbbell', 2),
  ('yoga_stretching', 'Yoga & Stretching', 'Improve flexibility and mindfulness', 'yoga', 3),
  ('posture_therapy', 'Posture Therapy', 'Correct posture and alignment', 'spine', 4),
  ('cardio_fitness', 'Cardio Fitness', 'Improve cardiovascular endurance', 'heart', 5),
  ('beginner_training', 'Beginner Training', 'Start your fitness journey', 'play-circle', 6),
  ('pilates', 'Pilates', 'Core strength and body control', 'hexagon', 7),
  ('nutrition_coaching', 'Nutrition Coaching', 'Personalized diet guidance', 'apple', 8),
  ('sports_performance', 'Sports Performance', 'Enhance athletic performance', 'zap', 9),
  ('injury_recovery', 'Injury Recovery', 'Rehabilitation and recovery', 'heart-handshake', 10),
  ('flexibility', 'Flexibility', 'Increase range of motion', 'wind', 11),
  ('mobility', 'Mobility', 'Improve joint mobility', 'move', 12),
  ('core_strength', 'Core Strength', 'Strengthen core muscles', 'square', 13),
  ('endurance_training', 'Endurance Training', 'Build stamina and endurance', 'zap', 14),
  ('functional_fitness', 'Functional Fitness', 'Real-world functional movements', 'activity', 15),
  ('rehabilitation', 'Rehabilitation', 'Professional rehabilitation services', 'shield', 16)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.search_goal_categories IS 'Reference table for fitness goal categories in search';

-- ============================================
-- Step 10: Create helper function for array intersection
-- ============================================
CREATE OR REPLACE FUNCTION array_intersect(arr1 TEXT[], arr2 TEXT[])
RETURNS TEXT[] AS $$
SELECT array_agg(DISTINCT x)::TEXT[]
FROM (
  SELECT UNNEST(arr1) AS x
  INTERSECT
  SELECT UNNEST(arr2)
) AS t;
$$ LANGUAGE SQL IMMUTABLE;

RAISE NOTICE '✓ Search criteria schema migration completed';
