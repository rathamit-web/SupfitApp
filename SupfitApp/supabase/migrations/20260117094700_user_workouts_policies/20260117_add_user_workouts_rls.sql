-- Enable row level security on the workouts table and give authenticated users access to their own rows.
ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'user_own_workouts_select'
      AND polrelid = 'public.user_workouts'::regclass
  ) THEN
    CREATE POLICY user_own_workouts_select
      ON public.user_workouts
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'user_own_workouts_insert'
      AND polrelid = 'public.user_workouts'::regclass
  ) THEN
    CREATE POLICY user_own_workouts_insert
      ON public.user_workouts
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'user_own_workouts_update'
      AND polrelid = 'public.user_workouts'::regclass
  ) THEN
    CREATE POLICY user_own_workouts_update
      ON public.user_workouts
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;
