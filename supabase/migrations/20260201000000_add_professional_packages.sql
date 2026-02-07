-- 2026-02-01: Capture coach & dietician subscription packages and client sign-ups

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_type_enum') THEN
    CREATE TYPE professional_type_enum AS ENUM ('coach', 'dietician');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
    CREATE TYPE billing_cycle_enum AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'custom');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_visibility_enum') THEN
    CREATE TYPE package_visibility_enum AS ENUM ('private', 'unlisted', 'public');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('draft', 'active', 'paused', 'cancelled', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.professional_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.professional_packages
  ADD CONSTRAINT professional_packages_feature_array CHECK (jsonb_typeof(feature_list) = 'array');
ALTER TABLE public.professional_packages
  ADD CONSTRAINT professional_packages_metadata_object CHECK (jsonb_typeof(metadata) = 'object');
ALTER TABLE public.professional_packages
  ADD CONSTRAINT professional_packages_owner_package_unique UNIQUE (id, owner_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_packages_owner_slug
  ON public.professional_packages(owner_user_id, slug);
CREATE INDEX IF NOT EXISTS idx_professional_packages_owner_type
  ON public.professional_packages(owner_user_id, professional_type);
CREATE INDEX IF NOT EXISTS idx_professional_packages_status_visibility
  ON public.professional_packages(status, visibility);

COMMENT ON TABLE public.professional_packages IS 'Canonical list of packages offered by coaches or dieticians.';
COMMENT ON COLUMN public.professional_packages.feature_list IS 'Ordered list of client-facing benefits stored as JSON array.';
COMMENT ON COLUMN public.professional_packages.metadata IS 'Free-form structured data for pricing experiments or rollout flags.';

CREATE TABLE IF NOT EXISTS public.professional_package_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.professional_packages(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    REFERENCES public.professional_packages(id, owner_user_id)
    ON DELETE CASCADE
);

ALTER TABLE public.professional_package_subscriptions
  ADD CONSTRAINT professional_package_subscriptions_metadata_object CHECK (jsonb_typeof(metadata) = 'object');

CREATE INDEX IF NOT EXISTS idx_professional_package_subscriptions_owner
  ON public.professional_package_subscriptions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_package_subscriptions_client
  ON public.professional_package_subscriptions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_package_subscriptions_status
  ON public.professional_package_subscriptions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_package_subscriptions_active_unique
  ON public.professional_package_subscriptions(package_id, client_user_id)
  WHERE status IN ('active', 'paused');

COMMENT ON TABLE public.professional_package_subscriptions IS 'Client sign-ups for a professional package along with lifecycle metadata.';

ALTER TABLE public.professional_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_package_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY professional_packages_owner_manage
  ON public.professional_packages
  FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role::text = professional_type::text
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role::text = professional_type::text
    )
  );

CREATE POLICY professional_packages_public_select
  ON public.professional_packages
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR visibility IN ('public', 'unlisted')
  );

CREATE POLICY professional_package_subscriptions_owner_access
  ON public.professional_package_subscriptions
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY professional_package_subscriptions_client_read
  ON public.professional_package_subscriptions
  FOR SELECT
  USING (client_user_id = auth.uid());

CREATE POLICY professional_package_subscriptions_client_insert
  ON public.professional_package_subscriptions
  FOR INSERT
  WITH CHECK (client_user_id = auth.uid());

CREATE POLICY professional_package_subscriptions_client_update
  ON public.professional_package_subscriptions
  FOR UPDATE
  USING (client_user_id = auth.uid())
  WITH CHECK (client_user_id = auth.uid());

CREATE TRIGGER trg_set_updated_at_professional_packages
BEFORE UPDATE ON public.professional_packages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_professional_package_subscriptions
BEFORE UPDATE ON public.professional_package_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
