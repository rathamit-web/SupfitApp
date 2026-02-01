-- =========================================================
-- Daily Active Hours (derived-only) + MCP governance scaffolding
-- Option A: store daily totals only (no raw samples)
-- =========================================================

-- Ensure common updated_at trigger exists (safe to re-create)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------
-- Active Hours (derived)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.active_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_date date NOT NULL,
  minutes_active int NOT NULL CHECK (minutes_active >= 0),
  source text NOT NULL DEFAULT 'unknown',
  confidence smallint NOT NULL DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, active_date)
);

CREATE INDEX IF NOT EXISTS active_hours_owner_date_idx
  ON public.active_hours (owner_id, active_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'active_hours_set_updated_at'
  ) THEN
    CREATE TRIGGER active_hours_set_updated_at
    BEFORE UPDATE ON public.active_hours
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

ALTER TABLE public.active_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hours'
      AND policyname = 'active_hours_select_own'
  ) THEN
    CREATE POLICY active_hours_select_own
      ON public.active_hours
      FOR SELECT
      USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hours'
      AND policyname = 'active_hours_insert_own'
  ) THEN
    CREATE POLICY active_hours_insert_own
      ON public.active_hours
      FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hours'
      AND policyname = 'active_hours_update_own'
  ) THEN
    CREATE POLICY active_hours_update_own
      ON public.active_hours
      FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;

  -- Coach read-only access to assigned clients (derived from coach_clients + coaches)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'active_hours'
      AND policyname = 'active_hours_select_coach'
  ) THEN
    CREATE POLICY active_hours_select_coach
      ON public.active_hours
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.coach_clients cc
          JOIN public.coaches c ON c.id = cc.coach_id
          WHERE c.user_id = auth.uid()
            AND cc.client_id = active_hours.owner_id
            AND COALESCE(cc.is_deleted, false) = false
        )
      );
  END IF;
END
$$;

-- -------------------------
-- Source Connections (token vault metadata)
-- Stored encrypted by server-side functions only.
-- -------------------------
CREATE TABLE IF NOT EXISTS public.source_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);

CREATE INDEX IF NOT EXISTS source_connections_owner_provider_idx
  ON public.source_connections (owner_id, provider);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'source_connections_set_updated_at'
  ) THEN
    CREATE TRIGGER source_connections_set_updated_at
    BEFORE UPDATE ON public.source_connections
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

ALTER TABLE public.source_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'source_connections'
      AND policyname = 'source_connections_select_own'
  ) THEN
    CREATE POLICY source_connections_select_own
      ON public.source_connections
      FOR SELECT
      USING (owner_id = auth.uid());
  END IF;

  -- No INSERT/UPDATE policies by default: writes should happen via service role
END
$$;

-- -------------------------
-- MCP Envelopes (immutable-ish governance record)
-- Inserted by server-side functions only.
-- -------------------------
CREATE TABLE IF NOT EXISTS public.mcp_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  subject_table text NOT NULL,
  subject_key text NOT NULL,
  request_hash text NOT NULL,
  envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcp_envelopes_owner_created_idx
  ON public.mcp_envelopes (owner_id, created_at DESC);

ALTER TABLE public.mcp_envelopes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mcp_envelopes'
      AND policyname = 'mcp_envelopes_select_own'
  ) THEN
    CREATE POLICY mcp_envelopes_select_own
      ON public.mcp_envelopes
      FOR SELECT
      USING (owner_id = auth.uid());
  END IF;

  -- No INSERT/UPDATE/DELETE policies by default (service role only).
END
$$;

-- -------------------------
-- Model Access Logs (auditing)
-- Inserted by model gateway only.
-- -------------------------
CREATE TABLE IF NOT EXISTS public.model_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  envelope_id uuid REFERENCES public.mcp_envelopes(id) ON DELETE SET NULL,
  model_name text NOT NULL,
  input_hash text NOT NULL,
  output_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_access_logs_owner_created_idx
  ON public.model_access_logs (owner_id, created_at DESC);

ALTER TABLE public.model_access_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'model_access_logs'
      AND policyname = 'model_access_logs_select_own'
  ) THEN
    CREATE POLICY model_access_logs_select_own
      ON public.model_access_logs
      FOR SELECT
      USING (owner_id = auth.uid());
  END IF;

  -- No INSERT/UPDATE/DELETE policies by default (service role only).
END
$$;
