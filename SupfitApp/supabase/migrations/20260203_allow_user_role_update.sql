-- Allow authenticated users to update their own role in public.users
-- Needed so role selected on Landing (coach/dietician) persists instead of staying 'individual'

-- Drop old policy if exists to avoid duplicates
DROP POLICY IF EXISTS users_update_self ON public.users;

CREATE POLICY users_update_self
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
