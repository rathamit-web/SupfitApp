-- =========================================================
-- Enterprise-grade schema: identity, profiles, coach domain,
-- plans, communication, revenue, availability, RLS & policies
-- =========================================================

-- ---------- Enums ----------
CREATE TYPE public.user_role AS ENUM ('individual','coach','dietician');
CREATE TYPE public.client_status AS ENUM ('active','inactive','pending');
CREATE TYPE public.subscription_status AS ENUM ('active','expired','unpaid');
CREATE TYPE public.payment_status AS ENUM ('paid','unpaid','failed');

-- ---------- Timestamp trigger for updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Core identity ----------
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role public.user_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX users_email_idx ON public.users (email);

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- General profile (single source of truth for name/avatar) ----------
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  dob date,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX user_profiles_user_id_idx ON public.user_profiles (user_id);

CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialization text,
  years_experience int,
  rating float,
  average_rating float,
  total_reviews int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX coaches_user_id_idx ON public.coaches (user_id);

CREATE TRIGGER coaches_set_updated_at
BEFORE UPDATE ON public.coaches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migration: Enterprise-grade Coach Ecosystem
-- Only create tables not present in schema.sql; adjust FKs to reference UUID PKs

-- ENUMS
CREATE TYPE coach_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE plan_type AS ENUM ('basic', 'premium', 'custom');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- COACHES TABLE
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
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
  status coach_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_id ON public.coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client_id ON public.coach_clients(client_id);
COMMENT ON TABLE public.coach_clients IS 'Coach-client relationships';

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
CREATE INDEX IF NOT EXISTS idx_coach_payments_coach_id ON public.coach_payments(coach_id);
COMMENT ON TABLE public.coach_payments IS 'Payments for coach plans';

-- RLS POLICIES (EXAMPLES)
-- Enable RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;

-- Example RLS: Only allow users to see their own coach profile
CREATE POLICY coaches_select_own ON public.coaches
  FOR SELECT USING (user_id = auth.uid());

-- Example RLS: Only allow users to see their own client records
CREATE POLICY coach_clients_select_own ON public.coach_clients
  FOR SELECT USING (client_id = auth.uid() OR coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid()));

-- Add more policies as needed for INSERT/UPDATE/DELETE
CREATE TABLE public.coach_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ---------- Clients (relationship coach ↔ client) ----------
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.client_status NOT NULL DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (coach_id, user_id)
);
CREATE INDEX clients_coach_id_idx ON public.clients (coach_id);
CREATE INDEX clients_user_id_idx ON public.clients (user_id);

CREATE TRIGGER clients_set_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Plans & assignments ----------
CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX workout_plans_coach_id_idx ON public.workout_plans (coach_id);

CREATE TRIGGER workout_plans_set_updated_at
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX diet_plans_coach_id_idx ON public.diet_plans (coach_id);

CREATE TRIGGER diet_plans_set_updated_at
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, plan_id)
);
CREATE INDEX user_workout_plans_user_id_idx ON public.user_workout_plans (user_id);
CREATE INDEX user_workout_plans_plan_id_idx ON public.user_workout_plans (plan_id);

CREATE TRIGGER user_workout_plans_set_updated_at
BEFORE UPDATE ON public.user_workout_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, plan_id)
);
CREATE INDEX user_diet_plans_user_id_idx ON public.user_diet_plans (user_id);
CREATE INDEX user_diet_plans_plan_id_idx ON public.user_diet_plans (plan_id);

CREATE TRIGGER user_diet_plans_set_updated_at
BEFORE UPDATE ON public.user_diet_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Progress references either plan type; keep plan_id generic for flexibility
CREATE TABLE public.user_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL,
  progress jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX user_plan_progress_user_id_idx ON public.user_plan_progress (user_id);
CREATE INDEX user_plan_progress_plan_id_idx ON public.user_plan_progress (plan_id);

CREATE TRIGGER user_plan_progress_set_updated_at
BEFORE UPDATE ON public.user_plan_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Communication ----------
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX coach_messages_coach_id_idx ON public.coach_messages (coach_id);
CREATE INDEX coach_messages_client_id_idx ON public.coach_messages (client_id);

CREATE TRIGGER coach_messages_set_updated_at
BEFORE UPDATE ON public.coach_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback text,
  rating float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX feedback_coach_id_idx ON public.feedback (coach_id);
CREATE INDEX feedback_client_id_idx ON public.feedback (client_id);

CREATE TRIGGER feedback_set_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  testimonial text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX testimonials_coach_id_idx ON public.testimonials (coach_id);
CREATE INDEX testimonials_client_id_idx ON public.testimonials (client_id);

CREATE TRIGGER testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coach_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  suggestion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX coach_suggestions_coach_id_idx ON public.coach_suggestions (coach_id);
CREATE INDEX coach_suggestions_client_id_idx ON public.coach_suggestions (client_id);

CREATE TRIGGER coach_suggestions_set_updated_at
BEFORE UPDATE ON public.coach_suggestions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Revenue & payments ----------
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  cost numeric NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (coach_id, client_id, package_name, started_at)
);
CREATE INDEX subscriptions_coach_id_idx ON public.subscriptions (coach_id);
CREATE INDEX subscriptions_client_id_idx ON public.subscriptions (client_id);

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status public.payment_status NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX payments_subscription_id_idx ON public.payments (subscription_id);
CREATE INDEX payments_status_idx ON public.payments (status);

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (payment_id, client_id)
);
CREATE INDEX payment_reminders_payment_id_idx ON public.payment_reminders (payment_id);
CREATE INDEX payment_reminders_coach_id_idx ON public.payment_reminders (coach_id);
CREATE INDEX payment_reminders_client_id_idx ON public.payment_reminders (client_id);

CREATE TRIGGER payment_reminders_set_updated_at
BEFORE UPDATE ON public.payment_reminders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coach_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ---------- Enable RLS ----------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- ---------- Policies ----------
-- Users: read own identity
CREATE POLICY users_select_self
ON public.users FOR SELECT
USING (id = auth.uid());

-- User profiles: public read of safe fields; owner write
CREATE POLICY user_profiles_public_read
ON public.user_profiles FOR SELECT
USING (true);

CREATE POLICY user_profiles_insert_owner
ON public.user_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_profiles_update_owner
ON public.user_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Coaches: coach manages own profile
CREATE POLICY coaches_select_self
ON public.coaches FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY coaches_insert_self
ON public.coaches FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY coaches_update_self
ON public.coaches FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Coach stats: coach can read; writes via service role/jobs
CREATE POLICY coach_stats_select_self
ON public.coach_stats FOR SELECT
USING (coach_id = auth.uid());

-- Clients: coach reads/manages own relationships
CREATE POLICY clients_select_coach
ON public.clients FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY clients_insert_coach
ON public.clients FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY clients_update_coach
ON public.clients FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY clients_delete_coach
ON public.clients FOR DELETE
USING (coach_id = auth.uid());

-- Workout plans: coach owns
CREATE POLICY workout_plans_select_coach
ON public.workout_plans FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY workout_plans_insert_coach
ON public.workout_plans FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY workout_plans_update_coach
ON public.workout_plans FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY workout_plans_delete_coach
ON public.workout_plans FOR DELETE
USING (coach_id = auth.uid());

-- Diet plans: coach owns
CREATE POLICY diet_plans_select_coach
ON public.diet_plans FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY diet_plans_insert_coach
ON public.diet_plans FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY diet_plans_update_coach
ON public.diet_plans FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY diet_plans_delete_coach
ON public.diet_plans FOR DELETE
USING (coach_id = auth.uid());

-- Assignments: user owns their assignment rows
CREATE POLICY user_workout_plans_select_self
ON public.user_workout_plans FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_workout_plans_insert_self
ON public.user_workout_plans FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_workout_plans_update_self
ON public.user_workout_plans FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_diet_plans_select_self
ON public.user_diet_plans FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_diet_plans_insert_self
ON public.user_diet_plans FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_diet_plans_update_self
ON public.user_diet_plans FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Progress: user reads own progress
CREATE POLICY user_plan_progress_select_self
ON public.user_plan_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_plan_progress_insert_self
ON public.user_plan_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_plan_progress_update_self
ON public.user_plan_progress FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Messages: coach or client in relationship
CREATE POLICY coach_messages_insert_parties
ON public.coach_messages FOR INSERT
WITH CHECK (
  (coach_id = auth.uid() OR client_id = auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.coach_id = coach_messages.coach_id
      AND c.user_id = coach_messages.client_id
      AND c.status = 'active'
  )
);

CREATE POLICY coach_messages_select_parties
ON public.coach_messages FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

-- Feedback: client writes; coach reads
CREATE POLICY feedback_insert_client
ON public.feedback FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY feedback_select_coach_or_client
ON public.feedback FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

-- Testimonials: client writes; coach reads
CREATE POLICY testimonials_insert_client
ON public.testimonials FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY testimonials_update_client
ON public.testimonials FOR UPDATE
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

CREATE POLICY testimonials_select_coach_or_client
ON public.testimonials FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

-- Suggestions: coach writes; both can read
CREATE POLICY coach_suggestions_insert_coach
ON public.coach_suggestions FOR INSERT
WITH CHECK (
  coach_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.coach_id = coach_suggestions.coach_id
      AND c.user_id = coach_suggestions.client_id
      AND c.status = 'active'
  )
);

CREATE POLICY coach_suggestions_update_coach
ON public.coach_suggestions FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY coach_suggestions_select_parties
ON public.coach_suggestions FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

-- Subscriptions: coach manages; client reads own
CREATE POLICY subscriptions_select_parties
ON public.subscriptions FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY subscriptions_insert_coach
ON public.subscriptions FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY subscriptions_update_coach
ON public.subscriptions FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Payments: read by coach/client; writes via service role or payment processor
CREATE POLICY payments_select_parties
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = payments.subscription_id
      AND (s.coach_id = auth.uid() OR s.client_id = auth.uid())
  )
);

-- Payment reminders: coach inserts; both read
CREATE POLICY payment_reminders_insert_coach
ON public.payment_reminders FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY payment_reminders_select_parties
ON public.payment_reminders FOR SELECT
USING (coach_id = auth.uid() OR client_id = auth.uid());

-- Coach revenue: coach reads; writes via jobs
CREATE POLICY coach_revenue_select_coach
ON public.coach_revenue FOR SELECT
USING (coach_id = auth.uid());

-- Availability: coach manages own slots
CREATE POLICY coach_availability_select_coach
ON public.coach_availability FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY coach_availability_insert_coach
ON public.coach_availability FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY coach_availability_update_coach
ON public.coach_availability FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY coach_availability_delete_coach
ON public.coach_availability FOR DELETE
USING (coach_id = auth.uid());
