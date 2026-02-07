-- 2026-02-07: Standardize all enums for roles, statuses, and visibility
-- This migration consolidates conflicting enum definitions across the codebase

-- ============================================
-- ROLE ENUM STANDARDIZATION
-- ============================================

-- Create unified user_role_enum (source of truth)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('individual', 'coach', 'dietician', 'admin');
  END IF;
END $$;

-- Verify professional_type_enum exists (used for coach/dietician type designation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_type_enum') THEN
    CREATE TYPE professional_type_enum AS ENUM ('coach', 'dietician');
  END IF;
END $$;

-- ============================================
-- STATUS ENUM STANDARDIZATION
-- ============================================

-- 1. Unified subscription status for all subscriptions (professional packages, coach plans, etc.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('draft', 'active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

-- 2. Unified payment status for all payment transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

-- 3. Unified client/coach entity status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status_enum') THEN
    CREATE TYPE entity_status_enum AS ENUM ('active', 'inactive', 'pending');
  END IF;
END $$;

-- ============================================
-- VISIBILITY ENUM STANDARDIZATION
-- ============================================

-- Unified visibility for packages and other shared resources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_enum') THEN
    CREATE TYPE visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

-- ============================================
-- BILLING CYCLE ENUM (ALREADY STANDARDIZED)
-- ============================================

-- Verify billing_cycle_enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
    CREATE TYPE billing_cycle_enum AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
  END IF;
END $$;

-- ============================================
-- REFERENCE TABLE: ENUM STANDARDIZATION
-- ============================================
-- 
-- PREVIOUS (Legacy/Conflicting)         | CURRENT (Standardized)
-- =======================================|=======================
-- user_role                             | user_role_enum
-- professional_type_enum (2026-...)     | professional_type_enum ✓
-- coach_status                          | entity_status_enum
-- client_status                         | entity_status_enum
-- subscription_status (legacy)          | subscription_status_enum
-- subscription_status_enum (2026-...)   | subscription_status_enum ✓
-- payment_status (legacy)               | payment_status_enum
-- payment_status (2026-...)             | payment_status_enum ✓
-- status_enum (generic)                 | DEPRECATED - use specific status enums
-- package_visibility_enum               | visibility_enum
-- plan_type, plan_type_enum             | DOMAIN-SPECIFIC (not standardized here)
-- gender_enum, units_enum, meal_type... | DOMAIN-SPECIFIC (not standardized here)
-- billing_cycle_enum                    | billing_cycle_enum ✓
--
-- ============================================
-- MIGRATION NOTES
-- ============================================
--
-- All new tables should use:
-- - user_role_enum for user role assignments
-- - professional_type_enum for coach/dietician type designation
-- - subscription_status_enum for all subscription statuses
-- - payment_status_enum for payment states
-- - entity_status_enum for coach/client entity states
-- - visibility_enum for resource visibility
-- - billing_cycle_enum for billing periods
--
-- Existing tables should migrate to these standardized enums in subsequent migrations.
--
-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TYPE user_role_enum IS 'Unified enum for user roles: individual (client), coach, dietician, or admin';
COMMENT ON TYPE professional_type_enum IS 'Professional classification: coach or dietician for package ownership';
COMMENT ON TYPE subscription_status_enum IS 'Lifecycle states for all subscription types (draft->active->cancelled/expired)';
COMMENT ON TYPE payment_status_enum IS 'Payment transaction states (pending->completed/failed->refunded)';
COMMENT ON TYPE entity_status_enum IS 'Status for coach/client entities: active, inactive, or pending';
COMMENT ON TYPE visibility_enum IS 'Resource visibility levels: private, unlisted, or public';
COMMENT ON TYPE billing_cycle_enum IS 'Billing frequency periods: weekly, monthly, quarterly, yearly, or custom';
