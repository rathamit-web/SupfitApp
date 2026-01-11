-- Compliance-first schema and RLS for Supfit
-- Run in Supabase (PostgreSQL 15 + TimescaleDB available by default in Supabase Pro/Team). All tables live in public schema.

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1) Core master data
CREATE TABLE IF NOT EXISTS public.user_profile (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    region text,
    language text DEFAULT 'en',
    consent_status text DEFAULT 'unknown',
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coaches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    certifications jsonb,
    specialties text[],
    org_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dietitians (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    credentials jsonb,
    specialties text[],
    org_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id uuid REFERENCES public.coaches(id) ON DELETE CASCADE,
    dietitian_id uuid REFERENCES public.dietitians(id) ON DELETE CASCADE,
    purpose text NOT NULL,
    scope jsonb NOT NULL DEFAULT jsonb_build_object('read_vitals', true, 'read_nutrition', false, 'write_notes', false),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON public.client_assignments(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_coach ON public.client_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_dietitian ON public.client_assignments(dietitian_id);

  -- Coach-specific assignments (explicit) with scoped permissions
  CREATE TABLE IF NOT EXISTS public.coach_client_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope jsonb NOT NULL DEFAULT jsonb_build_object('read_vitals', true, 'read_nutrition', true, 'write_notes', false),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach ON public.coach_client_assignments(coach_id);
  CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client ON public.coach_client_assignments(client_user_id);

  -- Dietitian-specific assignments (explicit) with scoped permissions
  CREATE TABLE IF NOT EXISTS public.dietitian_client_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    dietitian_id uuid NOT NULL REFERENCES public.dietitians(id) ON DELETE CASCADE,
    client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope jsonb NOT NULL DEFAULT jsonb_build_object('read_vitals', true, 'read_nutrition', true, 'write_notes', false),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_dietitian_client_assignments_dietitian ON public.dietitian_client_assignments(dietitian_id);
  CREATE INDEX IF NOT EXISTS idx_dietitian_client_assignments_client ON public.dietitian_client_assignments(client_user_id);

-- 2) Consent & guardian
CREATE TABLE IF NOT EXISTS public.consents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purpose text NOT NULL,
    consent_version text NOT NULL,
    policy_url text,
    language text DEFAULT 'en',
    validity_period interval,
    accepted_at timestamptz NOT NULL DEFAULT now(),
    withdrawn_at timestamptz,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consents_user_purpose ON public.consents(user_id, purpose);

CREATE TABLE IF NOT EXISTS public.guardian_consents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    minor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_name text NOT NULL,
    guardian_relation text NOT NULL,
    guardian_email text,
    guardian_phone text,
    consent_id uuid NOT NULL REFERENCES public.consents(id) ON DELETE CASCADE,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3) Audit log (append-only with hash chaining)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    actor_id uuid REFERENCES auth.users(id),
    actor_role text NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    purpose text,
    ip_address inet,
    device_info jsonb,
    timestamp timestamptz NOT NULL DEFAULT now(),
    hash_chain text
) PARTITION BY RANGE (timestamp);

CREATE TABLE IF NOT EXISTS public.audit_log_default PARTITION OF public.audit_log
FOR VALUES FROM ('2020-01-01') TO ('2030-01-01');

CREATE OR REPLACE FUNCTION public.audit_log_set_hash()
RETURNS trigger AS $$
DECLARE
    prev_hash text;
BEGIN
    SELECT hash_chain INTO prev_hash FROM public.audit_log
    WHERE timestamp < NEW.timestamp
    ORDER BY timestamp DESC
    LIMIT 1;

    NEW.hash_chain := encode(digest(coalesce(prev_hash, '') || NEW.user_id || NEW.actor_id || NEW.action || NEW.table_name || coalesce(NEW.record_id::text, '') || NEW.timestamp::text, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_hash ON public.audit_log_default;
CREATE TRIGGER trg_audit_log_hash
BEFORE INSERT ON public.audit_log_default
FOR EACH ROW EXECUTE FUNCTION public.audit_log_set_hash();

-- 4) Data deletion and export
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    status text NOT NULL DEFAULT 'pending',
    deletion_scope text NOT NULL,
    legal_hold boolean DEFAULT false,
    deletion_report jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_exports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    export_format text DEFAULT 'json',
    signed_url text,
    expires_at timestamptz,
    status text DEFAULT 'pending'
);

-- 5) Health vitals (time-series)
CREATE TABLE IF NOT EXISTS public.health_vitals_raw (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ts timestamptz NOT NULL DEFAULT now(),
    type text NOT NULL,
    value numeric NOT NULL,
    unit text,
    purpose text NOT NULL,
    consent_version text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
SELECT public.create_hypertable('public.health_vitals_raw', 'ts', if_not_exists => TRUE, migrate_data => TRUE);
CREATE INDEX IF NOT EXISTS idx_health_vitals_user_ts ON public.health_vitals_raw (user_id, ts DESC);

-- Continuous aggregates (examples)
-- Daily
CREATE MATERIALIZED VIEW IF NOT EXISTS public.health_vitals_daily
WITH (timescaledb.continuous) AS
SELECT user_id, type, time_bucket('1 day', ts) AS bucket, avg(value) AS avg_value
FROM public.health_vitals_raw
GROUP BY user_id, type, bucket;

-- Weekly
CREATE MATERIALIZED VIEW IF NOT EXISTS public.health_vitals_weekly
WITH (timescaledb.continuous) AS
SELECT user_id, type, time_bucket('7 days', ts) AS bucket, avg(value) AS avg_value
FROM public.health_vitals_raw
GROUP BY user_id, type, bucket;

-- Retention/compression policies (example: keep 2 years)
SELECT add_retention_policy('public.health_vitals_raw', INTERVAL '2 years', if_not_exists => TRUE);
SELECT add_compression_policy('public.health_vitals_raw', INTERVAL '30 days', if_not_exists => TRUE);

-- 6) RLS enablement
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietitians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietitian_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals_raw ENABLE ROW LEVEL SECURITY;

-- 7) Policies (self + scoped access)
-- Users manage their profile
CREATE POLICY IF NOT EXISTS user_profile_self ON public.user_profile
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Coaches/Dietitians manage their own records
CREATE POLICY IF NOT EXISTS coaches_self ON public.coaches
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS coaches_self_write ON public.coaches
FOR INSERT WITH CHECK (auth.uid() = user_id)
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS dietitians_self ON public.dietitians
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS dietitians_self_write ON public.dietitians
FOR INSERT WITH CHECK (auth.uid() = user_id)
FOR UPDATE USING (auth.uid() = user_id);

-- Consents: user can see own; admins can audit via future role checks
CREATE POLICY IF NOT EXISTS consents_self ON public.consents
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS consents_self_write ON public.consents
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guardian consents: user (minor) and guardian not modeled via auth; limit to minor
CREATE POLICY IF NOT EXISTS guardian_self ON public.guardian_consents
FOR SELECT USING (auth.uid() = minor_user_id);

-- Assignments: client sees their own; coach/dietitian sees assigned
CREATE POLICY IF NOT EXISTS client_assignments_self ON public.client_assignments
FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY IF NOT EXISTS client_assignments_coach ON public.client_assignments
FOR SELECT USING (
  (coach_id IS NOT NULL) AND EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY IF NOT EXISTS client_assignments_dietitian ON public.client_assignments
FOR SELECT USING (
  (dietitian_id IS NOT NULL) AND EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
);

-- Allow creation/update of combined assignments by coach/dietitian owning the assignment
CREATE POLICY IF NOT EXISTS client_assignments_write_coach ON public.client_assignments
FOR INSERT WITH CHECK (
  coach_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
)
FOR UPDATE USING (
  coach_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS client_assignments_write_dietitian ON public.client_assignments
FOR INSERT WITH CHECK (
  dietitian_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
)
FOR UPDATE USING (
  dietitian_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
);

-- Coach-specific assignments
CREATE POLICY IF NOT EXISTS coach_assignments_self ON public.coach_client_assignments
FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY IF NOT EXISTS coach_assignments_owner ON public.coach_client_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY IF NOT EXISTS coach_assignments_write ON public.coach_client_assignments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
)
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()
  )
);

-- Dietitian-specific assignments
CREATE POLICY IF NOT EXISTS dietitian_assignments_self ON public.dietitian_client_assignments
FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY IF NOT EXISTS dietitian_assignments_owner ON public.dietitian_client_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
);
CREATE POLICY IF NOT EXISTS dietitian_assignments_write ON public.dietitian_client_assignments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
)
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.dietitians d WHERE d.id = dietitian_id AND d.user_id = auth.uid()
  )
);

-- Health vitals: owner, plus assigned coach/dietitian with scope.read_vitals = true
CREATE POLICY IF NOT EXISTS health_vitals_self ON public.health_vitals_raw
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS health_vitals_coach ON public.health_vitals_raw
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.client_assignments ca
    JOIN public.coaches c ON ca.coach_id = c.id
    WHERE ca.client_user_id = health_vitals_raw.user_id
      AND c.user_id = auth.uid()
      AND coalesce(ca.scope->>'read_vitals','false')::boolean = true
      AND (ca.expires_at IS NULL OR ca.expires_at > now())
  )
);

CREATE POLICY IF NOT EXISTS health_vitals_dietitian ON public.health_vitals_raw
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.client_assignments ca
    JOIN public.dietitians d ON ca.dietitian_id = d.id
    WHERE ca.client_user_id = health_vitals_raw.user_id
      AND d.user_id = auth.uid()
      AND coalesce(ca.scope->>'read_vitals','false')::boolean = true
      AND (ca.expires_at IS NULL OR ca.expires_at > now())
  )
);

-- Audit log: restrict SELECT to admin role check placeholder; here deny all by default
CREATE POLICY IF NOT EXISTS audit_log_deny_all ON public.audit_log
FOR SELECT USING (false);

-- Data deletion/export: owner only
CREATE POLICY IF NOT EXISTS data_deletion_self ON public.data_deletion_requests
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS data_exports_self ON public.data_exports
FOR SELECT USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Helper to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profile_updated BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_coaches_updated BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dietitians_updated BEFORE UPDATE ON public.dietitians FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_client_assignments_updated BEFORE UPDATE ON public.client_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_coach_client_assignments_updated BEFORE UPDATE ON public.coach_client_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dietitian_client_assignments_updated BEFORE UPDATE ON public.dietitian_client_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
*** End Patch