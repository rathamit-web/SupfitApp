-- Phase 2: Professional Directory Foundation
-- 2026-02-09: Reviews, Languages, and Professional Profile Enhancements
-- Enables: Professional reviews & ratings, multilingual support, profile discovery

BEGIN;

-- ============================================
-- Step 1: Create Reviews ENUM
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
    CREATE TYPE review_status_enum AS ENUM ('pending', 'approved', 'rejected', 'archived');
  END IF;
END $$;

-- ============================================
-- Step 2: Professional Reviews Table
-- ============================================
-- Stores client reviews/ratings for professionals

-- Drop existing table if it exists (from partial deployment)
DROP TABLE IF EXISTS public.professional_reviews CASCADE;

CREATE TABLE public.professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_package_id UUID NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status review_status_enum NOT NULL DEFAULT 'pending',
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_professional_reviews_package
  ON public.professional_reviews(professional_package_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewer
  ON public.professional_reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_status
  ON public.professional_reviews(professional_package_id, status);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_created
  ON public.professional_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_rating
  ON public.professional_reviews(professional_package_id, rating DESC);

COMMENT ON TABLE public.professional_reviews IS 'Client reviews and ratings for professional packages';
COMMENT ON COLUMN public.professional_reviews.reviewer_user_id IS 'User who submitted the review (cross-checked as client)';
COMMENT ON COLUMN public.professional_reviews.rating IS 'Rating from 0-5 stars; used in match scoring and professional rating calc';
COMMENT ON COLUMN public.professional_reviews.status IS 'pending: awaiting mod, approved: visible, rejected: hidden, archived: old/deleted';
COMMENT ON COLUMN public.professional_reviews.response_text IS 'Professional response to review';

-- ============================================
-- Step 3: Professional Languages Table
-- ============================================
-- Stores languages a professional communicates in

-- Drop existing table if it exists (from partial deployment)
DROP TABLE IF EXISTS public.professional_languages CASCADE;

CREATE TABLE public.professional_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_package_id UUID NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL, -- e.g., 'en', 'hi', 'es', 'fr'
  language_name TEXT NOT NULL,       -- e.g., 'English', 'Hindi', 'Spanish'
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('native', 'fluent', 'intermediate', 'basic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_professional_language UNIQUE (professional_package_id, language_code)
);

-- Index for language-based search
CREATE INDEX IF NOT EXISTS idx_professional_languages_package
  ON public.professional_languages(professional_package_id);
CREATE INDEX IF NOT EXISTS idx_professional_languages_code
  ON public.professional_languages(language_code);

COMMENT ON TABLE public.professional_languages IS 'Languages supported by professionals; enables language-based search filtering';
COMMENT ON COLUMN public.professional_languages.language_code IS 'ISO 639-1 code: en, hi, es, fr, de, etc.';
COMMENT ON COLUMN public.professional_languages.proficiency_level IS 'native: mother tongue, fluent: business/professional, intermediate: conversational, basic: limited';

-- ============================================
-- Step 4: Professional Review Stats (Denorm)
-- ============================================
-- Aggregate stats for performance (auto-maintained via trigger)

-- Drop existing table if it exists (from partial deployment)
DROP TABLE IF EXISTS public.professional_review_stats CASCADE;

CREATE TABLE public.professional_review_stats (
  professional_package_id UUID PRIMARY KEY REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  avg_rating NUMERIC(3, 2) DEFAULT 0,
  rating_distribution JSONB DEFAULT '{
    "5": 0, "4": 0, "3": 0, "2": 0, "1": 0
  }'::jsonb,
  recent_reviews_3m INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  last_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for stats lookups
CREATE INDEX IF NOT EXISTS idx_professional_review_stats_avg_rating
  ON public.professional_review_stats(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_professional_review_stats_total_reviews
  ON public.professional_review_stats(total_reviews DESC);

COMMENT ON TABLE public.professional_review_stats IS 'Denormalized review aggregates for fast search ranking and scoring';
COMMENT ON COLUMN public.professional_review_stats.rating_distribution IS 'Count by star: {"5": 42, "4": 18, "3": 5, "2": 0, "1": 1}';
COMMENT ON COLUMN public.professional_review_stats.recent_reviews_3m IS 'Count of reviews in last 90 days (activity signal)';

-- ============================================
-- Step 5: Trigger to Auto-Maintain Review Stats
-- ============================================
-- Function: Update review stats when a review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.refresh_professional_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_reviews INTEGER;
  v_avg_rating NUMERIC(3, 2);
  v_recent_3m INTEGER;
  v_distribution JSONB;
BEGIN
  -- Determine package_id based on operation
  DECLARE
    v_package_id UUID := COALESCE(NEW.professional_package_id, OLD.professional_package_id);
  BEGIN
    -- Count total approved reviews
    SELECT COUNT(*) INTO v_total_reviews
    FROM public.professional_reviews
    WHERE professional_package_id = v_package_id AND status = 'approved';

    -- Calculate average rating
    SELECT AVG(rating)::NUMERIC(3, 2) INTO v_avg_rating
    FROM public.professional_reviews
    WHERE professional_package_id = v_package_id AND status = 'approved';

    -- Count reviews from last 90 days
    SELECT COUNT(*) INTO v_recent_3m
    FROM public.professional_reviews
    WHERE professional_package_id = v_package_id 
      AND status = 'approved'
      AND created_at >= NOW() - INTERVAL '90 days';

    -- Build rating distribution
    WITH rating_counts AS (
      SELECT
        COALESCE(FLOOR(rating)::INT, 5) AS star,
        COUNT(*) AS cnt
      FROM public.professional_reviews
      WHERE professional_package_id = v_package_id AND status = 'approved'
      GROUP BY FLOOR(rating)::INT
    )
    SELECT jsonb_object_agg(
      CAST(star AS TEXT),
      cnt::TEXT
    )
    INTO v_distribution
    FROM (
      SELECT 5 AS star, COALESCE(cnt, 0) AS cnt FROM rating_counts WHERE star = 5
      UNION ALL
      SELECT 4 AS star, COALESCE(cnt, 0) AS cnt FROM rating_counts WHERE star = 4
      UNION ALL
      SELECT 3 AS star, COALESCE(cnt, 0) AS cnt FROM rating_counts WHERE star = 3
      UNION ALL
      SELECT 2 AS star, COALESCE(cnt, 0) AS cnt FROM rating_counts WHERE star = 2
      UNION ALL
      SELECT 1 AS star, COALESCE(cnt, 0) AS cnt FROM rating_counts WHERE star = 1
    ) AS full_distribution;

    -- Upsert stats
    INSERT INTO public.professional_review_stats (
      professional_package_id,
      total_reviews,
      avg_rating,
      rating_distribution,
      recent_reviews_3m,
      last_review_at
    )
    VALUES (
      v_package_id,
      v_total_reviews,
      v_avg_rating,
      COALESCE(v_distribution, '{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}'),
      v_recent_3m,
      (SELECT MAX(created_at) FROM public.professional_reviews 
       WHERE professional_package_id = v_package_id AND status = 'approved')
    )
    ON CONFLICT (professional_package_id) DO UPDATE SET
      total_reviews = v_total_reviews,
      avg_rating = v_avg_rating,
      rating_distribution = COALESCE(v_distribution, '{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}'),
      recent_reviews_3m = v_recent_3m,
      last_review_at = (SELECT MAX(created_at) FROM public.professional_reviews 
                         WHERE professional_package_id = v_package_id AND status = 'approved'),
      updated_at = now();

    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert/update/delete
DROP TRIGGER IF EXISTS trigger_refresh_review_stats_on_review_change ON public.professional_reviews;
CREATE TRIGGER trigger_refresh_review_stats_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.professional_reviews
FOR EACH ROW
EXECUTE FUNCTION public.refresh_professional_review_stats();

COMMENT ON FUNCTION public.refresh_professional_review_stats() IS 'Auto-maintains professional_review_stats when reviews are created/updated/deleted';

-- ============================================
-- Step 5b: Trigger to Prevent Self-Reviews
-- ============================================
-- Function: Validate that reviewer is not the package owner
CREATE OR REPLACE FUNCTION public.prevent_self_review()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get the package owner
  SELECT owner_user_id INTO v_owner_id
  FROM public.professional_packages
  WHERE id = NEW.professional_package_id;

  -- Prevent if reviewer is the owner
  IF NEW.reviewer_user_id = v_owner_id THEN
    RAISE EXCEPTION 'Professionals cannot review their own packages';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert/update
DROP TRIGGER IF EXISTS trigger_prevent_self_review ON public.professional_reviews;
CREATE TRIGGER trigger_prevent_self_review
BEFORE INSERT OR UPDATE ON public.professional_reviews
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_review();

COMMENT ON FUNCTION public.prevent_self_review() IS 'Prevents professionals from reviewing their own packages';

-- ============================================
-- Step 7: RLS Policies for Reviews
-- ============================================
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
DROP POLICY IF EXISTS professional_reviews_select_approved ON public.professional_reviews;
CREATE POLICY professional_reviews_select_approved ON public.professional_reviews
FOR SELECT USING (
  status = 'approved' 
  OR reviewer_user_id = auth.uid() 
  OR EXISTS(SELECT 1 FROM public.professional_packages pp WHERE pp.id = professional_package_id AND pp.owner_user_id = auth.uid())
);

-- Policy: Users can insert reviews for packages they've subscribed to
DROP POLICY IF EXISTS professional_reviews_insert ON public.professional_reviews;
CREATE POLICY professional_reviews_insert ON public.professional_reviews
FOR INSERT WITH CHECK (
  reviewer_user_id = auth.uid()
);

-- Policy: Users can update own reviews
DROP POLICY IF EXISTS professional_reviews_update_own ON public.professional_reviews;
CREATE POLICY professional_reviews_update_own ON public.professional_reviews
FOR UPDATE USING (reviewer_user_id = auth.uid())
WITH CHECK (reviewer_user_id = auth.uid());

-- Policy: Professionals can respond to reviews
DROP POLICY IF EXISTS professional_reviews_respond ON public.professional_reviews;
CREATE POLICY professional_reviews_respond ON public.professional_reviews
FOR UPDATE 
USING (
  EXISTS(SELECT 1 FROM public.professional_packages pp 
         WHERE pp.id = professional_package_id AND pp.owner_user_id = auth.uid())
)
WITH CHECK (
  EXISTS(SELECT 1 FROM public.professional_packages pp 
         WHERE pp.id = professional_package_id AND pp.owner_user_id = auth.uid())
);

-- ============================================
-- Step 8: RLS Policies for Languages
-- ============================================
ALTER TABLE public.professional_languages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read languages
DROP POLICY IF EXISTS professional_languages_select ON public.professional_languages;
CREATE POLICY professional_languages_select ON public.professional_languages
FOR SELECT USING (TRUE);

-- Policy: Professionals can manage their languages
DROP POLICY IF EXISTS professional_languages_manage ON public.professional_languages;
CREATE POLICY professional_languages_manage ON public.professional_languages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.professional_packages pp
    WHERE pp.id = professional_package_id AND pp.owner_user_id = auth.uid()
  )
);

-- ============================================
-- Step 9: RLS Policies for Stats
-- ============================================
ALTER TABLE public.professional_review_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read stats (for search results)
DROP POLICY IF EXISTS professional_review_stats_select ON public.professional_review_stats;
CREATE POLICY professional_review_stats_select ON public.professional_review_stats
FOR SELECT USING (TRUE);

-- ============================================
-- Step 10: Initialize Stats for Existing Packages
-- ============================================
-- Insert initial stat rows for all existing packages (if any)
INSERT INTO public.professional_review_stats (professional_package_id, total_reviews, avg_rating)
SELECT DISTINCT pp.id, 0, 0
FROM public.professional_packages pp
WHERE NOT EXISTS (
  SELECT 1 FROM public.professional_review_stats prs 
  WHERE prs.professional_package_id = pp.id
)
ON CONFLICT (professional_package_id) DO NOTHING;

COMMIT;
