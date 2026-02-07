-- Fix: Change user_id to uuid in user_consent by dropping/recreating policies

-- 1. Drop policies referencing user_id
DROP POLICY IF EXISTS insert_own_consent ON public.user_consent;
DROP POLICY IF EXISTS select_own_consent ON public.user_consent;
DROP POLICY IF EXISTS update_own_consent ON public.user_consent;

-- 2. Alter the column type
ALTER TABLE public.user_consent ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- 3. Recreate the policies
CREATE POLICY insert_own_consent ON public.user_consent FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY select_own_consent ON public.user_consent FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY update_own_consent ON public.user_consent FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- End of fix
