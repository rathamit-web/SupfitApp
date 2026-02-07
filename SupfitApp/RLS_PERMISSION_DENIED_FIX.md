# Fix: Professional Packages RLS Permission Denied Error

## Problem
When trying to save packages in the Coach Subscription screen, you get:
```
Permission denied. Verify your account is set up as a coach/dietician.
```

The error occurs because the RLS policy on `professional_packages` table is too restrictive for INSERT/UPDATE operations.

## Root Cause
The existing RLS policy requires:
```sql
owner_user_id = auth.uid() 
AND EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid() AND u.role::text = professional_type::text
)
```

This check is failing because of ENUM type casting issues in the comparison.

## Solution: Manual RLS Policy Fix

### Step 1: Go to Supabase Dashboard
1. Navigate to your Supabase project
2. Go to **SQL Editor**
3. Create a new query

### Step 2: Drop the Old Policy
Copy and paste this SQL:

```sql
DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;
```

Click **Run**

### Step 3: Create the New, Fixed Policy
Copy and paste this SQL:

```sql
CREATE POLICY professional_packages_owner_manage
  ON public.professional_packages
  FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND (
      -- Explicit ENUM-based comparison (most reliable)
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('coach'::user_role_enum, 'dietician'::user_role_enum)
        AND (
          (u.role = 'coach'::user_role_enum AND professional_type = 'coach'::professional_type_enum)
          OR
          (u.role = 'dietician'::user_role_enum AND professional_type = 'dietician'::professional_type_enum)
        )
      )
      OR
      -- Text-based fallback comparison
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role::text = professional_type::text
      )
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND (
      -- Explicit ENUM-based comparison (most reliable)
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('coach'::user_role_enum, 'dietician'::user_role_enum)
        AND (
          (u.role = 'coach'::user_role_enum AND professional_type = 'coach'::professional_type_enum)
          OR
          (u.role = 'dietician'::user_role_enum AND professional_type = 'dietician'::professional_type_enum)
        )
      )
      OR
      -- Text-based fallback comparison
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role::text = professional_type::text
      )
    )
  );
```

Click **Run**

### Step 4: Verify the Fix
Run this query to confirm the policy exists:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'professional_packages' 
AND policyname = 'professional_packages_owner_manage';
```

You should see the new policy listed.

## What Was Changed

### Before (Failing):
```sql
USING (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role::text = professional_type::text
  )
)
```

### After (Working):
```sql
USING (
  owner_user_id = auth.uid()
  AND (
    -- Try explicit ENUM comparison first (most reliable)
    EXISTS (... explicit enum checks ...)
    OR
    -- Fallback to text comparison for compatibility
    EXISTS (... text-based checks ...)
  )
)
```

## Why This Works

1. **Explicit ENUM casting**: The new policy explicitly casts both sides to their proper ENUM types, avoiding type mismatch issues
2. **Dual-check approach**: It tries the strict ENUM comparison first, then falls back to text-based comparison
3. **Fallback mechanism**: If one approach fails, the other can still succeed
4. **Clear semantics**: Uses explicit IN clauses to check valid role types

## Testing the Fix

After applying the policy:

1. Go back to the app
2. Click **Add New Package** or **Edit Package**
3. Make changes and click **Save Changes**
4. You should see: ✅ "Package saved successfully!"

## If the Problem Persists

### Verify User Role in Database:
```sql
SELECT id, role FROM public.users 
WHERE id = '<your-user-id>';
```

The role should be `'coach'` (as text), not NULL.

### Check if Record Exists:
```sql
SELECT id, owner_user_id, professional_type 
FROM public.professional_packages 
WHERE owner_user_id = '<your-user-id>' 
LIMIT 5;
```

### Debug RLS Policy:
```sql
-- This shows what the policy sees
SELECT 
  u.id,
  u.role,
  u.role::text,
  'coach'::professional_type_enum as expected_type
FROM public.users u
WHERE u.id = '<your-user-id>';
```

## Alternative: Temporarily Disable RLS (Development Only)

⚠️ **WARNING: Only do this in development, never in production!**

```sql
ALTER TABLE professional_packages DISABLE ROW LEVEL SECURITY;
```

Then try saving a package. If it works, the issue is definitely the RLS policy. Re-enable it:

```sql
ALTER TABLE professional_packages ENABLE ROW LEVEL SECURITY;
```

Then apply the new policy.
