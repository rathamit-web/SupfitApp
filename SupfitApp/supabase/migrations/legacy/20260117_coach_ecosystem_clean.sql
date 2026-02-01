-- =========================================================
-- Enterprise-grade Coach Ecosystem Migration (DDL Only)
-- No DO/IF, No Duplicates, All Types/Tables in Correct Order
-- Best Practices: UUID PKs, Audit Columns, RLS, Policies
-- =========================================================

-- ---------- Enums ----------
CREATE TYPE public.coach_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE public.plan_type AS ENUM ('basic', 'premium', 'custom');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ---------- Timestamp trigger for updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Coaches ----------
CREATE TABLE public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  status public.coach_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX coaches_user_id_idx ON public.coaches (user_id);
CREATE TRIGGER coaches_set_updated_at
BEFORE UPDATE ON public.coaches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Coach Plans ----------
CREATE TABLE public.coach_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type public.plan_type NOT NULL DEFAULT 'basic',
  price numeric(10,2) NOT NULL,
  duration_days int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX coach_plans_coach_id_idx ON public.coach_plans (coach_id);
CREATE TRIGGER coach_plans_set_updated_at
BEFORE UPDATE ON public.coach_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Coach Clients ----------
CREATE TABLE public.coach_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.coach_plans(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  status public.coach_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX coach_clients_coach_id_idx ON public.coach_clients (coach_id);
CREATE INDEX coach_clients_client_id_idx ON public.coach_clients (client_id);
CREATE TRIGGER coach_clients_set_updated_at
BEFORE UPDATE ON public.coach_clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Coach Payments ----------
CREATE TABLE public.coach_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.coach_plans(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX coach_payments_client_id_idx ON public.coach_payments (client_id);
CREATE INDEX coach_payments_coach_id_idx ON public.coach_payments (coach_id);
CREATE TRIGGER coach_payments_set_updated_at
BEFORE UPDATE ON public.coach_payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Coach Stats ----------
CREATE TABLE public.coach_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid UNIQUE NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  rating float,
  average_rating float,
  total_reviews int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX coach_stats_coach_id_idx ON public.coach_stats (coach_id);
CREATE TRIGGER coach_stats_set_updated_at
BEFORE UPDATE ON public.coach_stats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Revenue ----------
CREATE TABLE public.coach_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  month int CHECK (month BETWEEN 1 AND 12),
  year int,
  revenue numeric,
  client_count int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (coach_id, month, year)
);
CREATE INDEX coach_revenue_coach_id_idx ON public.coach_revenue (coach_id);
CREATE TRIGGER coach_revenue_set_updated_at
BEFORE UPDATE ON public.coach_revenue
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Availability ----------
CREATE TABLE public.coach_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX coach_availability_coach_id_idx ON public.coach_availability (coach_id);
CREATE TRIGGER coach_availability_set_updated_at
BEFORE UPDATE ON public.coach_availability
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- RLS ----------
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- ---------- Policies ----------
-- Coaches: coach manages own profile
CREATE POLICY coaches_select_self ON public.coaches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY coaches_insert_self ON public.coaches FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY coaches_update_self ON public.coaches FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Coach Plans: coach owns
CREATE POLICY coach_plans_select_coach ON public.coach_plans FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_plans_insert_coach ON public.coach_plans FOR INSERT WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_plans_update_coach ON public.coach_plans FOR UPDATE USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())) WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));

-- Coach Clients: coach manages own relationships
CREATE POLICY coach_clients_select_coach ON public.coach_clients FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_clients_insert_coach ON public.coach_clients FOR INSERT WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_clients_update_coach ON public.coach_clients FOR UPDATE USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())) WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));

-- Coach Payments: coach or client can read
CREATE POLICY coach_payments_select_parties ON public.coach_payments FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()) OR client_id = auth.uid());

-- Coach Stats: coach can read
CREATE POLICY coach_stats_select_self ON public.coach_stats FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));

-- Coach Revenue: coach can read
CREATE POLICY coach_revenue_select_coach ON public.coach_revenue FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));

-- Coach Availability: coach manages own slots
CREATE POLICY coach_availability_select_coach ON public.coach_availability FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_availability_insert_coach ON public.coach_availability FOR INSERT WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_availability_update_coach ON public.coach_availability FOR UPDATE USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())) WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY coach_availability_delete_coach ON public.coach_availability FOR DELETE USING (coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));
