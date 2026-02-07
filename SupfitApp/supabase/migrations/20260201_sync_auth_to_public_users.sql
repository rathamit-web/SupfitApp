-- 2026-02-01: Sync auth.users to public.users with proper role handling

-- Create function to handle auth -> public.users sync
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  determined_role public.user_role;
BEGIN
  -- Try to read role from auth metadata (set by signup with selected role)
  determined_role := 'individual'::public.user_role;
  
  IF NEW.raw_user_meta_data ? 'role' THEN
    CASE NEW.raw_user_meta_data->>'role'
      WHEN 'coach' THEN determined_role := 'coach'::public.user_role;
      WHEN 'dietician' THEN determined_role := 'dietician'::public.user_role;
      WHEN 'individual' THEN determined_role := 'individual'::public.user_role;
      ELSE determined_role := 'individual'::public.user_role;
    END CASE;
    RAISE LOG '[handle_auth_user_created] Role from metadata: %', determined_role;
  ELSE
    RAISE LOG '[handle_auth_user_created] No role in metadata, using default: individual';
  END IF;

  -- Upsert into public.users to ensure record exists
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, determined_role, NEW.created_at, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    email = NEW.email,
    role = EXCLUDED.role,
    updated_at = NOW()
  WHERE users.id = NEW.id;

  RAISE LOG '[handle_auth_user_created] User synced: id=%, email=%, role=%', NEW.id, NEW.email, determined_role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Sync existing auth users to public.users if not already present
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'individual'::public.user_role,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

COMMENT ON FUNCTION public.handle_auth_user_created() IS 'Automatically sync auth.users to public.users table on signup, reading role from auth metadata if available';
