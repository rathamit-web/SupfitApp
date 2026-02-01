-- =========================================================
-- User Details (profile health settings)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_composition jsonb,
  medical_history jsonb,
  milestone_targets jsonb,
  workout_activity jsonb,
  diet_nutrition jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_details_user_id_idx
  ON public.user_details (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'user_details_set_updated_at'
  ) THEN
    CREATE TRIGGER user_details_set_updated_at
    BEFORE UPDATE ON public.user_details
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_details'
      AND policyname = 'user_details_select_own'
  ) THEN
    CREATE POLICY user_details_select_own
      ON public.user_details
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_details'
      AND policyname = 'user_details_insert_own'
  ) THEN
    CREATE POLICY user_details_insert_own
      ON public.user_details
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_details'
      AND policyname = 'user_details_update_own'
  ) THEN
    CREATE POLICY user_details_update_own
      ON public.user_details
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;
