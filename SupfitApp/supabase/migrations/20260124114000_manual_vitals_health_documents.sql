-- =========================================================
-- Manual Vitals + Health Documents
-- =========================================================

CREATE TABLE IF NOT EXISTS public.manual_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  value text NOT NULL,
  unit text,
  date date NOT NULL,
  purpose text,
  consent_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_vitals_user_id_idx
  ON public.manual_vitals (user_id);

CREATE INDEX IF NOT EXISTS manual_vitals_user_id_type_date_idx
  ON public.manual_vitals (user_id, type, date);

CREATE INDEX IF NOT EXISTS manual_vitals_user_id_purpose_idx
  ON public.manual_vitals (user_id, purpose);

CREATE TABLE IF NOT EXISTS public.health_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_documents_user_id_idx
  ON public.health_documents (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'manual_vitals_set_updated_at'
  ) THEN
    CREATE TRIGGER manual_vitals_set_updated_at
    BEFORE UPDATE ON public.manual_vitals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'health_documents_set_updated_at'
  ) THEN
    CREATE TRIGGER health_documents_set_updated_at
    BEFORE UPDATE ON public.health_documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

ALTER TABLE public.manual_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_vitals' AND policyname = 'manual_vitals_select_own'
  ) THEN
    CREATE POLICY manual_vitals_select_own
      ON public.manual_vitals
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_vitals' AND policyname = 'manual_vitals_insert_own'
  ) THEN
    CREATE POLICY manual_vitals_insert_own
      ON public.manual_vitals
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_vitals' AND policyname = 'manual_vitals_update_own'
  ) THEN
    CREATE POLICY manual_vitals_update_own
      ON public.manual_vitals
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_vitals' AND policyname = 'manual_vitals_delete_own'
  ) THEN
    CREATE POLICY manual_vitals_delete_own
      ON public.manual_vitals
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'health_documents' AND policyname = 'health_documents_select_own'
  ) THEN
    CREATE POLICY health_documents_select_own
      ON public.health_documents
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'health_documents' AND policyname = 'health_documents_insert_own'
  ) THEN
    CREATE POLICY health_documents_insert_own
      ON public.health_documents
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'health_documents' AND policyname = 'health_documents_update_own'
  ) THEN
    CREATE POLICY health_documents_update_own
      ON public.health_documents
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'health_documents' AND policyname = 'health_documents_delete_own'
  ) THEN
    CREATE POLICY health_documents_delete_own
      ON public.health_documents
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_vitals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_documents TO authenticated;
