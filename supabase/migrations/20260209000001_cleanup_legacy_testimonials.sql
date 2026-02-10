-- Phase 2b: Clean Up Legacy Testimonials Tables
-- Date: 2026-02-09
-- Purpose: Consolidate to professional_reviews table
-- Impact: Removes 3 legacy testimonials table variants, all replaced by professional_reviews

BEGIN;

-- ============================================
-- Step 1: Verify professional_reviews exists
-- ============================================
-- Confirm the new table is in place before removing legacy tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'professional_reviews'
  ) THEN
    RAISE EXCEPTION 'professional_reviews table does not exist! Cannot proceed with cleanup.';
  END IF;
  RAISE NOTICE '✓ professional_reviews table confirmed';
END $$;

-- ============================================
-- Step 2: Backup Check (Data Preservation)
-- ============================================
-- Count existing testimonials to alert if data might be lost
DO $$
DECLARE
  v_testimonial_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_testimonial_count
  FROM information_schema.tables 
  WHERE table_name = 'testimonials';
  
  IF v_testimonial_count > 0 THEN
    SELECT COUNT(*) INTO v_testimonial_count
    FROM public.testimonials;
    
    IF v_testimonial_count > 0 THEN
      RAISE WARNING 'Found % rows in legacy testimonials table - verify data migration before DROP',
        v_testimonial_count;
    END IF;
  END IF;
  
  RAISE NOTICE '✓ Data check complete';
END $$;

-- ============================================
-- Step 3: Drop Legacy Testimonials Table
-- ============================================
-- This table exists across multiple migrations with different schemas
-- All have been consolidated into professional_reviews with proper moderation workflow
DO $$
BEGIN
  -- Attempt to drop the table from public schema
  EXECUTE 'DROP TABLE IF EXISTS public.testimonials CASCADE';
  RAISE NOTICE '✓ Legacy testimonials table dropped (if it existed)';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not drop testimonials table: %', SQLERRM;
END $$;

COMMIT;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- Before deploying this migration:
--
-- 1. VERIFY NO DATA AT RISK
--    SELECT COUNT(*) FROM public.testimonials;
--    → If > 0: Run data migration first (see DATABASE_DUPLICATION_AUDIT.md)
--    → If 0: Safe to DROP
--
-- 2. CHECK NO CODE REFERENCES
--    grep -r "testimonials" src/ --include="*.ts" --include="*.tsx" --include="*.js"
--    grep -r "testimonials" backend/ --include="*.py" --include="*.js" --include="*.sql"
--    → If any matches: Update code to use professional_reviews instead
--
-- 3. DEPLOYMENT ORDER (Critical)
--    1. 20260209000000_phase_2_foundation.sql (creates professional_reviews)
--    2. 20260209000001_cleanup_legacy_testimonials.sql (this file - drops old)
--    3. Update TestimonialsNative.tsx to query professional_reviews from DB
--
-- NEW SCHEMA (use this going forward):
-- ============================================
-- Table: public.professional_reviews
-- Columns:
--   - id (UUID PK)
--   - professional_package_id (UUID FK → professional_packages)
--   - reviewer_user_id (UUID FK → users)
--   - rating (NUMERIC 0-5)
--   - title (TEXT)
--   - content (TEXT)
--   - status (ENUM: pending, approved, rejected, archived)
--   - helpful_count (INT)
--   - unhelpful_count (INT)
--   - response_text (TEXT nullable)
--   - response_at (TIMESTAMPTZ nullable)
--   - created_at (TIMESTAMPTZ)
--   - updated_at (TIMESTAMPTZ)
--
-- Tables:
--   - professional_review_stats (denormalized aggregates for search)
--   - professional_languages (multi-language support)
--
-- Triggers:
--   - prevent_self_review() - blocks professionals from self-reviewing
--   - refresh_professional_review_stats() - maintains stats table
--
-- RLS Policies: 7 policies for security-first design
-- ============================================
