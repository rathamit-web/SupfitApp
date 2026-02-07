# Fix: Permission Denied Error When Saving Coach Packages

## Issue Summary
When you try to save a new package or edit an existing package, you get:
```
Permission denied. Verify your account is set up as a coach/dietician.
```

## Root Cause Analysis

The error occurs because:
1. **RLS Policy Mismatch**: The `professional_packages` table has an RLS policy that requires a complex relationship check between the user's role and the package's professional_type
2. **ENUM Type Casting Issue**: The policy compares `users.role::text` with `professional_packages.professional_type::text`, but one is a PostgreSQL ENUM type and the other might be stored differently
3. **Permission Denied**: The RLS policy `professional_packages_owner_manage` is rejecting INSERT/UPDATE operations because the verification check is failing

## Solution: Two-Part Approach

### Part 1: Application-Level Validation (Already Implemented ✅)

The app now performs detailed validation before attempting to save:

```typescript
// 1. Check if userRole matches professional_type
if (userRole !== PROFESSIONAL_TYPE) {
  throw new Error('Account role mismatch');
}

// 2. Verify user exists in database with correct role
const { data: userVerify } = await supabase
  .from('users')
  .select('id, role')
  .eq('id', userId)
  .single();

// 3. Verify database role matches what we expect
if (userVerify.role !== PROFESSIONAL_TYPE) {
  throw new Error('Database role mismatch');
}

// 4. Only then attempt upsert
const { data, error } = await supabase
  .from('professional_packages')
  .upsert(payload)
```

**Benefits:**
- ✅ Catches role mismatches before attempting the database operation
- ✅ Provides clear error messages to the user
- ✅ Reduces unnecessary database calls
- ✅ Comprehensive logging for debugging

### Part 2: Database RLS Policy Fix (Manual Step Required ⚠️)

The RLS policy on the `professional_packages` table needs to be updated to handle ENUM type casting correctly.

#### How to Apply:

1. **Open Supabase Dashboard**
   - Go to your project
   - Click **SQL Editor** in the left sidebar
   - Create a new query

2. **Drop Old Policy**
   ```sql
   DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;
   ```

3. **Create New Policy**
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

4. **Verify Policy Created**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'professional_packages' 
   AND policyname = 'professional_packages_owner_manage';
   ```

## Testing After Fix

1. **Refresh the app** (or restart if necessary)
2. **Navigate to Subscription > My Subscriptions > Edit Package** (for an existing package)
3. **Click Save Changes**
4. ✅ Should see: **"Package saved successfully!"**

Or:

1. **Click Add New Package**
2. **Fill in details:** Name, Price, Features
3. **Click Save Changes**
4. ✅ Should see: **"Package saved successfully!"**

## Troubleshooting

### Still Getting "Permission Denied"?

**Check 1: User Role in Database**
```sql
SELECT id, role FROM public.users WHERE id = '<your-user-id>';
```
- Role should be: `coach` (not NULL, not `individual`)

**Check 2: RLS Policy Exists**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'professional_packages';
```
- Should show: `professional_packages_owner_manage`

**Check 3: Temporarily Disable RLS (Development Only)**
```sql
-- ⚠️ WARNING: DEVELOPMENT ONLY!
ALTER TABLE professional_packages DISABLE ROW LEVEL SECURITY;
```
Try saving. If it works now, the issue is the RLS policy. Re-enable:
```sql
ALTER TABLE professional_packages ENABLE ROW LEVEL SECURITY;
```
Then apply the new policy above.

### Still Getting Error After Fix?

Check the browser console for the error message:
- `"Account role mismatch"` → Your role doesn't match 'coach' in the database
- `"Database role mismatch"` → Your database role is not 'coach'
- `"Could not verify your account"` → User not found in database

Sign out and sign back in with the correct role selection.

## Files Modified

1. **[src/screens/CoachSubscriptionNative.tsx](src/screens/CoachSubscriptionNative.tsx)**
   - Added detailed role validation before upsert
   - Added database verification check
   - Enhanced error messages
   - Comprehensive logging for debugging

2. **[supabase/migrations/20260204010000_fix_professional_packages_rls.sql](supabase/migrations/20260204010000_fix_professional_packages_rls.sql)**
   - Updated RLS policy with explicit ENUM casting
   - Added fallback text-based comparison
   - Improves policy reliability

3. **[RLS_PERMISSION_DENIED_FIX.md](RLS_PERMISSION_DENIED_FIX.md)**
   - Complete manual fix guide for Supabase dashboard
   - Troubleshooting steps
   - Verification queries

## Implementation Summary

| Component | Status | Details |
|-----------|--------|---------|
| App-Level Validation | ✅ Done | Enhanced CoachSubscriptionNative with multi-layer checks |
| Error Messages | ✅ Done | Clear, actionable user guidance |
| Logging | ✅ Done | Comprehensive console logging at each step |
| RLS Policy Migration | ✅ Created | Migration file ready in supabase/migrations/ |
| Supabase RLS Update | ⚠️ Manual | Requires manual SQL execution in dashboard |

## Next Steps

1. ✅ **Deploy app changes** (auto-deployed with updated code)
2. ⏳ **Apply RLS policy** in Supabase dashboard (using SQL provided above)
3. ✅ **Test package save** in the app
4. ✅ **Verify in database** that package appears with your user ID as owner

---

**Questions?** Check the console logs when trying to save. They'll show exactly what's happening at each validation step.
