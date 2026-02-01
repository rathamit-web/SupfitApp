-- Extend user_workouts for richer media metadata (image/video support)
ALTER TABLE user_workouts
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Migrate existing image_url to media_url and set media_type='image' for all current rows
UPDATE user_workouts SET media_url = image_url WHERE image_url IS NOT NULL AND (media_url IS NULL OR media_url = '');
UPDATE user_workouts SET media_type = 'image' WHERE image_url IS NOT NULL AND (media_type IS NULL OR media_type = '');
-- RLS Policy: Only coaches can assign plans

-- Coach Ecosystem ENUMS
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_status') THEN
    CREATE TYPE coach_status AS ENUM ('active', 'inactive', 'pending');
  END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('basic', 'premium', 'custom');
  END IF;
END $$;
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('M', 'F', 'Other');
  END IF;
-- COACHES TABLE
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status coach_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches(user_id);
COMMENT ON TABLE public.coaches IS 'Stores coach profiles and metadata';
COMMENT ON COLUMN public.coaches.status IS 'Coach account status';
-- COACH_PLANS TABLE
CREATE TABLE IF NOT EXISTS public.coach_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type plan_type NOT NULL DEFAULT 'basic',
  price NUMERIC(10,2) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_coach_plans_coach_id ON public.coach_plans(coach_id);
COMMENT ON TABLE public.coach_plans IS 'Coach subscription plans';
-- COACH_CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.coach_plans(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
);
CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_id ON public.coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client_id ON public.coach_clients(client_id);
-- COACH_PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.coach_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.coach_plans(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_coach_payments_client_id ON public.coach_payments(client_id);
COMMENT ON TABLE public.coach_payments IS 'Payments for coach plans';
-- RLS POLICIES (EXAMPLES)
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS coaches_select_own ON public.coaches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS coach_clients_select_own ON public.coach_clients
  FOR SELECT USING (client_id = auth.uid() OR coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
-- Add more policies as needed for INSERT/UPDATE/DELETE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'units_enum') THEN
    CREATE TYPE units_enum AS ENUM ('metric', 'imperial');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    CREATE TYPE status_enum AS ENUM ('active', 'inactive', 'pending', 'paid', 'unpaid', 'cancelled', 'completed', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type_enum') THEN
    CREATE TYPE plan_type_enum AS ENUM ('workout', 'diet', 'custom');
  END IF;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type_enum') THEN
    CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
    CREATE TYPE message_type_enum AS ENUM ('coach', 'dietician', 'system', 'user');
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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_visibility_enum') THEN
    CREATE TYPE package_visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('draft', 'active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
    CREATE TYPE schedule_type_enum AS ENUM ('workout', 'diet', 'reminder');
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_type_enum') THEN
    CREATE TYPE target_type_enum AS ENUM ('steps', 'weight', 'distance', 'calories', 'sleep', 'custom');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM ('login', 'logout', 'workout', 'payment', 'profile_update', 'vital_entry', 'subscription', 'message', 'assignment', 'other');
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'coach', 'dietician', 'admin')),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  is_minor boolean DEFAULT false,
  guardian_name text,
  guardian_email text,
  CONSTRAINT guardian_required_if_minor CHECK (
    (NOT is_minor) OR (guardian_name IS NOT NULL AND guardian_email IS NOT NULL)
  )
);
CREATE INDEX idx_users_email ON users(email);

-- USER PROFILES
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  full_name text NOT NULL,
  dob date NOT NULL,
  gender gender_enum NOT NULL,
  bio text,
  avatar_url text,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  units units_enum NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_user_profiles_dob ON user_profiles(dob);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
-- HEALTH VITALS (partitioned)
CREATE TABLE health_vitals (
  id bigserial,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  type text NOT NULL, -- bp, sugar, hr, etc.
  value jsonb NOT NULL, -- { systolic, diastolic, ... }
  source text NOT NULL, -- manual/device
  device_id text,
  confidence_score numeric(3,2),
  recorded_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
  , PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);
CREATE INDEX idx_health_vitals_user_id ON health_vitals(user_id);
CREATE INDEX idx_health_vitals_type ON health_vitals(type);
CREATE INDEX idx_health_vitals_recorded_at ON health_vitals(recorded_at);

-- Example partition (monthly)
CREATE TABLE health_vitals_2026_01 PARTITION OF health_vitals
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- RETENTION ENFORCEMENT: Scheduled Purge Job Example
-- Use pg_cron, pgAgent, or Supabase Edge Functions to run this monthly.
-- Purge health_vitals older than 7 years, unless legal_hold=true (if column added in future)
-- Example SQL (run as admin):
-- DELETE FROM health_vitals WHERE recorded_at < (now() - interval '7 years');
-- For future: If legal_hold column is added, use:
-- DELETE FROM health_vitals WHERE recorded_at < (now() - interval '7 years') AND (legal_hold IS NULL OR legal_hold = false);

-- RLS
ALTER TABLE health_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_vitals ON health_vitals FOR SELECT USING (user_id = auth.uid());

-- MEDICAL HISTORY
[Corrected schema below:]
  diagnosed_at date,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_medical_history_user_id ON medical_history(user_id);
CREATE INDEX idx_medical_history_condition ON medical_history(condition);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_medical_history ON medical_history FOR SELECT USING (user_id = auth.uid());

CREATE TABLE connected_devices (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  device_type text NOT NULL,
  device_uid text NOT NULL,
  connected_at timestamptz DEFAULT now(),
  last_sync timestamptz
);
CREATE INDEX idx_connected_devices_device_uid ON connected_devices(device_uid);

ALTER TABLE connected_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_devices ON connected_devices FOR SELECT USING (user_id = auth.uid());
  -- WORKOUTS
  CREATE TABLE workouts (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    type text NOT NULL,
    duration_min int,
    calories int,
    distance_km numeric(5,2),
    device_id text,
    started_at timestamptz NOT NULL,
    ended_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_workouts_user_id ON workouts(user_id);
  CREATE INDEX idx_workouts_type ON workouts(type);
  CREATE INDEX idx_workouts_started_at ON workouts(started_at);

  ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_workouts ON workouts FOR SELECT USING (user_id = auth.uid());

  -- WORKOUT SESSIONS
  CREATE TABLE workout_sessions (
    id bigserial PRIMARY KEY,
    session_type text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);

  ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_workout_sessions ON workout_sessions FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

  -- NUTRITION LOGS
  CREATE TABLE nutrition_logs (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    meal_type meal_type_enum NOT NULL,
    source text NOT NULL,
    food_items jsonb NOT NULL,
    total_calories int,
    logged_at timestamptz NOT NULL,
  );
  CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs(user_id);
  CREATE INDEX idx_nutrition_logs_meal_type ON nutrition_logs(meal_type);
  CREATE INDEX idx_nutrition_logs_logged_at ON nutrition_logs(logged_at);

  ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_nutrition_logs ON nutrition_logs FOR SELECT USING (user_id = auth.uid());

  -- DIET PLANS
  CREATE TABLE diet_plans (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    plan_name text NOT NULL,
    start_date date NOT NULL,
    details jsonb,
    created_by uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
  CREATE INDEX idx_diet_plans_start_date ON diet_plans(start_date);

  ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_diet_plans ON diet_plans FOR SELECT USING (user_id = auth.uid());

  -- PLANS
  CREATE TABLE plans (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    plan_type plan_type_enum NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date),
    created_by uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_plans_user_id ON plans(user_id);
  CREATE INDEX idx_plans_plan_type ON plans(plan_type);
  CREATE INDEX idx_plans_start_date ON plans(start_date);

  ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_plans ON plans FOR SELECT USING (user_id = auth.uid());

  -- TARGETS
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    target_type target_type_enum NOT NULL,
    value numeric(8,2) NOT NULL,
    CONSTRAINT positive_value CHECK (value >= 0),
    unit text NOT NULL,
    due_date date,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_targets_user_id ON targets(user_id);
  CREATE INDEX idx_targets_target_type ON targets(target_type);

  ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_targets ON targets FOR SELECT USING (user_id = auth.uid());
  -- SCHEDULES
  CREATE TABLE schedules (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    plan_id bigint REFERENCES plans(id) ON UPDATE CASCADE ON DELETE CASCADE,
    schedule_type schedule_type_enum NOT NULL,
    scheduled_at timestamptz NOT NULL,
    status status_enum NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_schedules_user_id ON schedules(user_id);
  CREATE INDEX idx_schedules_plan_id ON schedules(plan_id);
  CREATE INDEX idx_schedules_scheduled_at ON schedules(scheduled_at);

  ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_schedules ON schedules FOR SELECT USING (user_id = auth.uid());
  -- SUBSCRIPTIONS
  CREATE TABLE subscriptions (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    type text NOT NULL,
    entity_id uuid,
    status status_enum NOT NULL,
    amount int,
    CONSTRAINT positive_amount CHECK (amount >= 0),
    valid_upto date,
    package_name text,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
  CREATE INDEX idx_subscriptions_type ON subscriptions(type);

  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_subscriptions ON subscriptions FOR SELECT USING (user_id = auth.uid());

  -- PROFESSIONAL PACKAGES (Coach & Dietician)
  CREATE TABLE professional_packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_type professional_type_enum NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    currency char(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
    billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly',
    billing_frequency int NOT NULL DEFAULT 1 CHECK (billing_frequency > 0),
    feature_list jsonb NOT NULL DEFAULT '[]'::jsonb,
    visibility package_visibility_enum NOT NULL DEFAULT 'private',
    status subscription_status_enum NOT NULL DEFAULT 'draft',
    is_default boolean NOT NULL DEFAULT FALSE,
    max_clients int CHECK (max_clients IS NULL OR max_clients > 0),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT professional_packages_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
  );
  ALTER TABLE professional_packages
    ADD CONSTRAINT professional_packages_feature_array CHECK (jsonb_typeof(feature_list) = 'array');
  ALTER TABLE professional_packages
    ADD CONSTRAINT professional_packages_metadata_object CHECK (jsonb_typeof(metadata) = 'object');
  ALTER TABLE professional_packages
    ADD CONSTRAINT professional_packages_owner_package_unique UNIQUE (id, owner_user_id);

  CREATE UNIQUE INDEX idx_professional_packages_owner_slug
    ON professional_packages(owner_user_id, slug);
  CREATE INDEX idx_professional_packages_owner_type
    ON professional_packages(owner_user_id, professional_type);
  CREATE INDEX idx_professional_packages_status_visibility
    ON professional_packages(status, visibility);

  COMMENT ON TABLE professional_packages IS 'Canonical list of packages offered by coaches or dieticians.';
  COMMENT ON COLUMN professional_packages.feature_list IS 'Ordered list of client-facing benefits stored as JSON array.';
  COMMENT ON COLUMN professional_packages.metadata IS 'Free-form structured data for pricing experiments or rollout flags.';

  ALTER TABLE professional_packages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY professional_packages_owner_manage
    ON professional_packages
    FOR ALL
    USING (
      owner_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND u.role::text = professional_type::text
      )
    )
    WITH CHECK (
      owner_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND u.role::text = professional_type::text
      )
    );
  CREATE POLICY professional_packages_public_select
    ON professional_packages
    FOR SELECT
    USING (
      owner_user_id = auth.uid()
      OR visibility IN ('public', 'unlisted')
    );

  -- PROFESSIONAL PACKAGE SUBSCRIPTIONS
  CREATE TABLE professional_package_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES professional_packages(id) ON DELETE CASCADE,
    owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status subscription_status_enum NOT NULL DEFAULT 'active',
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
    billing_cycle billing_cycle_enum NOT NULL,
    billing_frequency int NOT NULL DEFAULT 1 CHECK (billing_frequency > 0),
    auto_renew boolean NOT NULL DEFAULT true,
    start_date date NOT NULL DEFAULT current_date,
    end_date date,
    cancellation_reason text,
    notes text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT subscription_owner_matches_package
      FOREIGN KEY (package_id, owner_user_id)
      REFERENCES professional_packages(id, owner_user_id)
      ON DELETE CASCADE
  );
  ALTER TABLE professional_package_subscriptions
    ADD CONSTRAINT professional_package_subscriptions_metadata_object CHECK (jsonb_typeof(metadata) = 'object');

  CREATE INDEX idx_professional_package_subscriptions_owner
    ON professional_package_subscriptions(owner_user_id);
  CREATE INDEX idx_professional_package_subscriptions_client
    ON professional_package_subscriptions(client_user_id);
  CREATE INDEX idx_professional_package_subscriptions_status
    ON professional_package_subscriptions(status);
  CREATE UNIQUE INDEX idx_professional_package_subscriptions_active_unique
    ON professional_package_subscriptions(package_id, client_user_id)
    WHERE status IN ('active', 'paused');

  ALTER TABLE professional_package_subscriptions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY professional_package_subscriptions_owner_access
    ON professional_package_subscriptions
    FOR ALL
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());
  CREATE POLICY professional_package_subscriptions_client_read
    ON professional_package_subscriptions
    FOR SELECT
    USING (client_user_id = auth.uid());
  CREATE POLICY professional_package_subscriptions_client_insert
    ON professional_package_subscriptions
    FOR INSERT
    WITH CHECK (client_user_id = auth.uid());
  CREATE POLICY professional_package_subscriptions_client_update
    ON professional_package_subscriptions
    FOR UPDATE
    USING (client_user_id = auth.uid())
    WITH CHECK (client_user_id = auth.uid());

  -- PAYMENTS
  CREATE TABLE payments (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    subscription_id bigint REFERENCES subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
    amount int NOT NULL,
    CONSTRAINT positive_amount CHECK (amount >= 0),
    payment_date timestamptz NOT NULL,
    status status_enum NOT NULL,
    method text,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_payments_user_id ON payments(user_id);
  CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);

  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_payments ON payments FOR SELECT USING (user_id = auth.uid());

  -- MESSAGES
  CREATE TABLE messages (
    id bigserial PRIMARY KEY,
    from_user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    to_user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    message text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    message_type message_type_enum NOT NULL
  );
  CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
  CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);

  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_messages ON messages FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

  -- ASSIGNMENTS
  CREATE TABLE assignments (
    id bigserial PRIMARY KEY,
    coach_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    client_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    plan_id bigint REFERENCES plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    assigned_at timestamptz DEFAULT now(),
    status status_enum NOT NULL
  );
  CREATE INDEX idx_assignments_coach_id ON assignments(coach_id);
  CREATE INDEX idx_assignments_client_id ON assignments(client_id);
  CREATE INDEX idx_assignments_plan_id ON assignments(plan_id);

  ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY coach_or_client_assignments ON assignments FOR SELECT USING (coach_id = auth.uid() OR client_id = auth.uid());

  -- AUDIT LOGS (partitioned)
  CREATE TABLE audit_logs (
    id bigserial,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now(),
    legal_hold boolean DEFAULT false
    , PRIMARY KEY (id, created_at)
  ) PARTITION BY RANGE (created_at);
  CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
  CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

  -- Example partition (monthly)
  CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

  -- RETENTION ENFORCEMENT: Scheduled Purge Job Example
  -- Use pg_cron, pgAgent, or Supabase Edge Functions to run this monthly.
  -- Purge audit_logs older than 7 years, unless legal_hold=true
  -- Example SQL (run as admin):
  -- DELETE FROM audit_logs WHERE created_at < (now() - interval '7 years') AND legal_hold = false;

  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY admin_read_audit_logs ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active));

  -- ANALYTICS EVENTS (partitioned)
  CREATE TABLE analytics_events (
    id bigserial,
    user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    event_type event_type_enum NOT NULL,
    event_subtype text, -- extensible: e.g. 'cardio', 'strength', 'profile_picture', etc.
    event_tags text[], -- extensible: e.g. ['mobile', 'web', 'A/B', 'premium']
    event_data jsonb,
    occurred_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id, occurred_at)
  ) PARTITION BY RANGE (occurred_at);
  CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
  CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
  CREATE INDEX idx_analytics_events_occurred_at ON analytics_events(occurred_at);

  -- Example partition (monthly)
  CREATE TABLE analytics_events_2026_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

  -- Analytics Event Extensibility:
  -- event_subtype: For custom event taxonomy, e.g. 'cardio', 'profile_picture', 'referral', etc.
  -- event_tags: For segmentation, e.g. ['mobile', 'web', 'A/B', 'premium']
  -- Use these columns for richer analytics, future-proofing, and custom segmentation.

  -- RETENTION ENFORCEMENT: Scheduled Purge Job Example
  -- Use pg_cron, pgAgent, or Supabase Edge Functions to run this monthly.
  -- Purge analytics_events older than 7 years
  -- Example SQL (run as admin):
  -- DELETE FROM analytics_events WHERE occurred_at < (now() - interval '7 years');

-- Retention Policy: Purge health_vitals, audit_logs, analytics_events after 7 years unless legal_hold=true. Implement with scheduled jobs (pg_cron/pgAgent) or Supabase Edge Functions.

  CREATE POLICY admin_read_analytics_events ON analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active));


-- AUTH PROVIDERS
CREATE TABLE auth_providers (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  provider text NOT NULL,
  provider_uid text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_auth_providers_user_id ON auth_providers(user_id);
CREATE INDEX idx_auth_providers_provider_uid ON auth_providers(provider_uid);

-- USER CONSENT

CREATE TABLE consent_forms (
  id serial PRIMARY KEY,
  consent_type text NOT NULL,
  version int NOT NULL,
  form_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_consent (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  consent_form_id int REFERENCES consent_forms(id) ON UPDATE CASCADE ON DELETE SET NULL,
  consent_value boolean NOT NULL,
  consent_date timestamptz DEFAULT now(),
  guardian_signed boolean DEFAULT false
);
CREATE INDEX idx_user_consent_user_id ON user_consent(user_id);
CREATE INDEX idx_user_consent_form_id ON user_consent(consent_form_id);

-- TESTIMONIALS (Ratings & Reviews)
CREATE TABLE testimonials (
  id bigserial PRIMARY KEY,
  reviewer_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  reviewed_type text NOT NULL CHECK (reviewed_type IN ('coach', 'gym', 'dietician')),
  reviewed_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_testimonials_reviewed_id ON testimonials(reviewed_id);
CREATE INDEX idx_testimonials_reviewed_type ON testimonials(reviewed_type);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviewer_own_testimonials ON testimonials FOR SELECT USING (reviewer_id = auth.uid());

-- HEALTH DASHBOARD PREFERENCES (optional, for widget order/customization)
CREATE TABLE health_dashboard_prefs (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  widget_order jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE health_dashboard_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_dashboard_prefs ON health_dashboard_prefs FOR SELECT USING (user_id = auth.uid());

-- REVENUE TRACKER (for professionals)
CREATE TABLE revenue_tracker (
  id bigserial PRIMARY KEY,
  professional_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  period_end date NOT NULL,
  total_revenue numeric(12,2) NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_revenue_tracker_professional_id ON revenue_tracker(professional_id);

ALTER TABLE revenue_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY professional_own_revenue ON revenue_tracker FOR SELECT USING (professional_id = auth.uid());

CREATE TABLE recommendations (
  id bigserial PRIMARY KEY,
  professional_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('supplement', 'workout', 'diet')),
  title text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_recommendations_client_id ON recommendations(client_id);
CREATE INDEX idx_recommendations_professional_id ON recommendations(professional_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_own_recommendations ON recommendations FOR SELECT USING (client_id = auth.uid() OR professional_id = auth.uid());

-- WORKOUT MEDIA (images/videos for posts)
CREATE TABLE workout_media (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  workout_id bigint REFERENCES workouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  url text NOT NULL,
  thumbnail_url text,
  uploaded_at timestamptz DEFAULT now()
);
CREATE INDEX idx_workout_media_user_id ON workout_media(user_id);
CREATE INDEX idx_workout_media_workout_id ON workout_media(workout_id);

ALTER TABLE workout_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_workout_media ON workout_media FOR SELECT USING (user_id = auth.uid());

-- WORKOUT LIKES (Instagram-like likes)
CREATE TABLE workout_likes (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  workout_id bigint REFERENCES workouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  liked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, workout_id)
);
CREATE INDEX idx_workout_likes_user_id ON workout_likes(user_id);
CREATE INDEX idx_workout_likes_workout_id ON workout_likes(workout_id);

ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_workout_likes ON workout_likes FOR SELECT USING (user_id = auth.uid());

-- WORKOUT COMMENTS (Instagram-like comments)
CREATE TABLE workout_comments (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  workout_id bigint REFERENCES workouts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  message text NOT NULL,
  commented_at timestamptz DEFAULT now()
);
CREATE INDEX idx_workout_comments_user_id ON workout_comments(user_id);
CREATE INDEX idx_workout_comments_workout_id ON workout_comments(workout_id);

ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_workout_comments ON workout_comments FOR SELECT USING (user_id = auth.uid());

-- TRIGGERS: Auto-update updated_at
-- TRIGGER: Block deletion if legal_hold = true
CREATE OR REPLACE FUNCTION block_delete_if_legal_hold()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.legal_hold THEN
    RAISE EXCEPTION 'Cannot delete row: legal_hold is true.';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_delete_users
BEFORE DELETE ON users
FOR EACH ROW EXECUTE FUNCTION block_delete_if_legal_hold();

CREATE TRIGGER trg_block_delete_audit_logs
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION block_delete_if_legal_hold();
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_user_profiles
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_medical_history
BEFORE UPDATE ON medical_history
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_connected_devices
BEFORE UPDATE ON connected_devices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_workouts
BEFORE UPDATE ON workouts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_workout_sessions
BEFORE UPDATE ON workout_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_nutrition_logs
BEFORE UPDATE ON nutrition_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_diet_plans
BEFORE UPDATE ON diet_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_plans
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_targets
BEFORE UPDATE ON targets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_schedules
BEFORE UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_subscriptions
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_professional_packages
BEFORE UPDATE ON professional_packages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_professional_package_subscriptions
BEFORE UPDATE ON professional_package_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_messages
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_assignments
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_audit_logs
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_analytics_events
BEFORE UPDATE ON analytics_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_row ON users FOR SELECT USING (id = auth.uid());

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_profile ON user_profiles FOR SELECT USING (id = auth.uid());

ALTER TABLE auth_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_auth ON auth_providers FOR SELECT USING (user_id = auth.uid());

ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_consent ON user_consent FOR SELECT USING (user_id = auth.uid());
