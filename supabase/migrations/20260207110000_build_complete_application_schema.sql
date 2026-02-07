-- 2026-02-07: Build Complete Application Schema with Audit Fixes
-- This migration creates all application tables with corrections applied from schema validation audit
-- All critical issues from the audit have been incorporated
-- Non-breaking, backward-compatible with existing application code

-- ============================================
-- Step 1: Ensure Standardized Enums Exist
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('individual', 'coach', 'dietician', 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status_enum') THEN
    CREATE TYPE entity_status_enum AS ENUM ('active', 'inactive', 'pending');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('draft', 'active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_type_enum') THEN
    CREATE TYPE professional_type_enum AS ENUM ('coach', 'dietician');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
    CREATE TYPE billing_cycle_enum AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_enum') THEN
    CREATE TYPE visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

-- Custom domain enums (not part of standardization, but needed for tables)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('M', 'F', 'Other');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'units_enum') THEN
    CREATE TYPE units_enum AS ENUM ('metric', 'imperial');
  END IF;
END $$;

-- ============================================
-- Step 2: Create Core Application Tables
-- ============================================

-- users table (application layer, distinct from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'individual'::user_role_enum,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.users IS 'Application users table, synced from auth.users';

-- user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  dob date NOT NULL,
  gender gender_enum NOT NULL,
  bio text,
  avatar_url text,
  height_cm numeric CHECK (height_cm IS NULL OR (height_cm > 100 AND height_cm < 300)),
  weight_kg numeric CHECK (weight_kg IS NULL OR (weight_kg > 20 AND weight_kg < 300)),
  units units_enum NOT NULL DEFAULT 'metric'::units_enum,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.user_profiles IS 'User profile information';

-- user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_profile_public boolean NOT NULL DEFAULT true,
  connected_devices text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention jsonb NOT NULL DEFAULT '{}'::jsonb,
  two_factor jsonb NOT NULL DEFAULT '{}'::jsonb,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- coaches
CREATE TABLE IF NOT EXISTS public.coaches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  specialization text,
  years_experience integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coaches_pkey PRIMARY KEY (id),
  CONSTRAINT coaches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.coaches IS 'Coach profiles (single source of truth for coach data)';
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);

-- coach_stats (single source of truth for coach ratings/reviews)
CREATE TABLE IF NOT EXISTS public.coach_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL UNIQUE,
  rating double precision CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  average_rating double precision CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
  total_reviews integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coach_stats_pkey PRIMARY KEY (id),
  CONSTRAINT coach_stats_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.coach_stats IS 'Coach statistics (ratings, reviews) - SINGLE SOURCE OF TRUTH';
CREATE INDEX IF NOT EXISTS idx_coach_stats_coach_id ON coach_stats(coach_id);

-- ============================================
-- Step 3: Health & Activity Tracking
-- ============================================

-- user_targets (fitness targets)
CREATE TABLE IF NOT EXISTS public.user_targets (
  id bigint NOT NULL DEFAULT gen_random_uuid()::text::bigint,
  user_id uuid NOT NULL UNIQUE,
  steps integer DEFAULT 8000 CHECK (steps IS NULL OR (steps >= 1000 AND steps <= 20000)),
  running integer DEFAULT 5 CHECK (running IS NULL OR (running >= 1 AND running <= 20)),
  sports integer DEFAULT 60 CHECK (sports IS NULL OR (sports >= 15 AND sports <= 180)),
  workout integer DEFAULT 60 CHECK (workout IS NULL OR (workout >= 15 AND workout <= 180)),
  milestone text DEFAULT ''::text,
  milestone_month text DEFAULT ''::text,
  milestone_year text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_targets_pkey PRIMARY KEY (id),
  CONSTRAINT user_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_targets_user_id ON user_targets(user_id);

-- daily_metrics (time-series metrics)
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  metric_date date NOT NULL,
  steps integer CHECK (steps IS NULL OR steps >= 0),
  calories_kcal integer CHECK (calories_kcal IS NULL OR calories_kcal >= 0),
  avg_hr_bpm integer CHECK (avg_hr_bpm IS NULL OR avg_hr_bpm >= 0),
  sleep_minutes integer CHECK (sleep_minutes IS NULL OR sleep_minutes >= 0),
  gym_minutes integer CHECK (gym_minutes IS NULL OR gym_minutes >= 0),
  badminton_minutes integer CHECK (badminton_minutes IS NULL OR badminton_minutes >= 0),
  swim_minutes integer CHECK (swim_minutes IS NULL OR swim_minutes >= 0),
  source text NOT NULL DEFAULT 'unknown'::text,
  confidence smallint NOT NULL DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT daily_metrics_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_owner_date ON daily_metrics(owner_id, metric_date DESC);
COMMENT ON TABLE public.daily_metrics IS 'Daily health metrics (time-series)';

-- active_hours (hourly activity tracking)
CREATE TABLE IF NOT EXISTS public.active_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  active_date date NOT NULL,
  minutes_active integer NOT NULL CHECK (minutes_active >= 0),
  source text NOT NULL DEFAULT 'unknown'::text,
  confidence smallint NOT NULL DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT active_hours_pkey PRIMARY KEY (id),
  CONSTRAINT active_hours_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_active_hours_owner_date ON active_hours(owner_id, active_date DESC);

-- ============================================
-- Step 4: Professional Packages & Subscriptions
-- ============================================

-- professional_packages
CREATE TABLE IF NOT EXISTS public.professional_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  professional_type professional_type_enum NOT NULL,
  name text NOT NULL,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'::text),
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  currency character(3) NOT NULL DEFAULT 'INR'::bpchar CHECK (currency ~ '^[A-Z]{3}$'::text),
  billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly'::billing_cycle_enum,
  billing_frequency integer NOT NULL DEFAULT 1 CHECK (billing_frequency > 0),
  feature_list jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(feature_list) = 'array'::text),
  visibility visibility_enum NOT NULL DEFAULT 'private'::visibility_enum,
  status subscription_status_enum NOT NULL DEFAULT 'draft'::subscription_status_enum,
  is_default boolean NOT NULL DEFAULT false,
  max_clients integer CHECK (max_clients IS NULL OR max_clients > 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professional_packages_pkey PRIMARY KEY (id),
  CONSTRAINT professional_packages_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT professional_packages_owner_slug_unique UNIQUE (owner_user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_professional_packages_owner_status ON professional_packages(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_professional_packages_owner_type ON professional_packages(owner_user_id, professional_type);
COMMENT ON TABLE public.professional_packages IS 'Packages offered by coaches/dieticians';

-- professional_package_subscriptions (FIXED FK constraints)
CREATE TABLE IF NOT EXISTS public.professional_package_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  status subscription_status_enum NOT NULL DEFAULT 'active'::subscription_status_enum,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  currency character(3) NOT NULL DEFAULT 'INR'::bpchar CHECK (currency ~ '^[A-Z]{3}$'::text),
  billing_cycle billing_cycle_enum NOT NULL,
  billing_frequency integer NOT NULL DEFAULT 1 CHECK (billing_frequency > 0),
  auto_renew boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  cancellation_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professional_package_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT professional_package_subscriptions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  CONSTRAINT professional_package_subscriptions_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT professional_package_subscriptions_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT professional_package_subscriptions_owner_matches_package_fkey FOREIGN KEY (package_id, owner_user_id) REFERENCES professional_packages(id, owner_user_id) ON DELETE CASCADE,
  CONSTRAINT professional_package_subscriptions_active_unique UNIQUE (package_id, client_user_id) WHERE status IN ('active'::subscription_status_enum, 'paused'::subscription_status_enum)
);
CREATE INDEX IF NOT EXISTS idx_professional_pkg_subs_client_status ON professional_package_subscriptions(client_user_id, status);
COMMENT ON TABLE public.professional_package_subscriptions IS 'Client subscriptions (FIXED: corrected FK constraints)';

-- ============================================
-- Step 5: Coach Planning & Assignments
-- ============================================

-- coach_plans
CREATE TABLE IF NOT EXISTS public.coach_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type professional_type_enum NOT NULL DEFAULT 'coach'::professional_type_enum,
  price numeric NOT NULL CHECK (price > 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT coach_plans_pkey PRIMARY KEY (id),
  CONSTRAINT coach_plans_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coach_plans_coach_id ON coach_plans(coach_id);

-- coach_clients
CREATE TABLE IF NOT EXISTS public.coach_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_id uuid NOT NULL,
  plan_id uuid,
  start_date date NOT NULL,
  end_date date,
  status entity_status_enum NOT NULL DEFAULT 'active'::entity_status_enum,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT coach_clients_pkey PRIMARY KEY (id),
  CONSTRAINT coach_clients_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE,
  CONSTRAINT coach_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT coach_clients_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.coach_plans(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_status ON coach_clients(coach_id, status);
COMMENT ON TABLE public.coach_clients IS 'Coach-client relationships';

-- coach_payments (FIXED: uses payment_status_enum)
CREATE TABLE IF NOT EXISTS public.coach_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  status payment_status_enum NOT NULL DEFAULT 'pending'::payment_status_enum,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT coach_payments_pkey PRIMARY KEY (id),
  CONSTRAINT coach_payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT coach_payments_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE,
  CONSTRAINT coach_payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.coach_plans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coach_payments_client_id ON coach_payments(client_id);

-- ============================================
-- Step 6: Feedback & Testimonials
-- ============================================

-- feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_id uuid NOT NULL,
  feedback text,
  rating double precision CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE,
  CONSTRAINT feedback_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_feedback_coach_id ON feedback(coach_id);

-- testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  testimonial text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id),
  CONSTRAINT testimonials_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT testimonials_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE
);

-- ============================================
-- Step 7: Media & User Content
-- ============================================

-- media
CREATE TABLE IF NOT EXISTS public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_role user_role_enum,
  storage_path text NOT NULL,
  url text,
  media_kind text NOT NULL,
  mime_type text,
  visibility visibility_enum NOT NULL DEFAULT 'public'::visibility_enum,
  metadata jsonb,
  likes_count integer DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer DEFAULT 0 CHECK (comments_count >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT media_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_media_owner_visibility ON media(owner_id, visibility);

-- user_workouts
CREATE TABLE IF NOT EXISTS public.user_workouts (
  id integer NOT NULL DEFAULT nextval('user_workouts_id_seq'::regclass),
  user_id uuid,
  image_url text,
  caption text,
  workout text,
  likes integer DEFAULT 0 CHECK (likes >= 0),
  comments integer DEFAULT 0 CHECK (comments >= 0),
  created_at timestamp with time zone DEFAULT now(),
  slot_id integer NOT NULL,
  media_type text,
  CONSTRAINT user_workouts_pkey PRIMARY KEY (id),
  CONSTRAINT user_workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ============================================
-- Step 8: Consents & Privacy
-- ============================================

-- user_consent
CREATE TABLE IF NOT EXISTS public.user_consent (
  user_id uuid,
  consent_form_id integer,
  consent_value boolean NOT NULL,
  consent_date timestamp with time zone DEFAULT now(),
  guardian_signed boolean DEFAULT false,
  consent_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_consent_pkey PRIMARY KEY (consent_id),
  CONSTRAINT user_consent_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- Step 9: Audit Logging & Compliance
-- ============================================

-- audit_logs (NEW - for compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  old_values jsonb,
  new_values jsonb,
  reason text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id, changed_at DESC);
COMMENT ON TABLE public.audit_logs IS 'Audit trail for compliance and data tracking';

-- ============================================
-- Final Verification
-- ============================================

-- Display summary of created tables
SELECT 'Schema build complete. Tables created:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;

-- Display indexes created
SELECT 'Indexes created:' as status;
SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;
