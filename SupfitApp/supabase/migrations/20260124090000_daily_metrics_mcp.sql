-- =========================================================
-- Daily Metrics (derived-only) + MCP governance scaffolding
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
-- Daily Metrics (derived)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  steps int CHECK (steps >= 0),
  calories_kcal int CHECK (calories_kcal >= 0),
  avg_hr_bpm int CHECK (avg_hr_bpm >= 0),
  sleep_minutes int CHECK (sleep_minutes >= 0),
  gym_minutes int CHECK (gym_minutes >= 0),
  badminton_minutes int CHECK (badminton_minutes >= 0),
  swim_minutes int CHECK (swim_minutes >= 0),
  source text NOT NULL DEFAULT 'unknown',
  confidence smallint NOT NULL DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, metric_date)
);

CREATE INDEX IF NOT EXISTS daily_metrics_owner_date_idx
  ON public.daily_metrics (owner_id, metric_date);

CREATE TRIGGER daily_metrics_set_updated_at
BEFORE UPDATE ON public.daily_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_metrics'
      AND policyname = 'daily_metrics_select_own'
  ) THEN
    CREATE POLICY daily_metrics_select_own
      ON public.daily_metrics
      FOR SELECT
      USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_metrics'
      AND policyname = 'daily_metrics_insert_own'
  ) THEN
    CREATE POLICY daily_metrics_insert_own
      ON public.daily_metrics
      FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_metrics'
      AND policyname = 'daily_metrics_update_own'
  ) THEN
    CREATE POLICY daily_metrics_update_own
      ON public.daily_metrics
      FOR UPDATE
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;

  -- Coach read-only access to assigned clients (derived from coach_clients + coaches)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_metrics'
      AND policyname = 'daily_metrics_select_coach'
  ) THEN
    CREATE POLICY daily_metrics_select_coach
      ON public.daily_metrics
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.coach_clients cc
          JOIN public.coaches c ON c.id = cc.coach_id
          WHERE c.user_id = auth.uid()
            AND cc.client_id = daily_metrics.owner_id
            AND COALESCE(cc.is_deleted, false) = false
        )
      );
  END IF;
END
$$;
