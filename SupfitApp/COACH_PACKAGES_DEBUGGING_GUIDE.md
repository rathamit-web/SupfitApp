# Coach Subscription Packages: Complete Debugging Guide

## Problem Summary
Coach subscription packages are not persisting to the database despite success alerts appearing. The likely cause is **RLS (Row Level Security) policy rejection** due to either:
1. User record missing from `public.users` table
2. User's `role` not set to 'coach' or 'dietician' 
3. Role mismatch between `users.role` and package's `professional_type`

---

## Step 1: Check Supabase Console

### View 1A: Check User Sync Status
Go to Supabase Dashboard → SQL Editor → Run:
```sql
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.role,
  pu.created_at as public_created_at,
  CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'OK' END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-coach-email@example.com'
ORDER BY au.created_at DESC;
```

**Expected Result:**
- `sync_status = 'OK'` ✅
- `pu.role = 'coach'` or `'dietician'` ✅

**If Missing (`sync_status = 'MISSING'`):**
→ Proceed to **Step 2: Apply Auto-Sync Migration**

**If Role is NULL or 'individual':**
→ Proceed to **Step 3: Update User Role**

---

## Step 2: Apply Auto-Sync Migration

This creates an automatic trigger that syncs Supabase Auth users to the `public.users` table:

### Option A: Via Supabase CLI (Recommended)
```bash
# Navigate to your project
cd /workspaces/SupfitApp

# Apply the migration
supabase db push
```

### Option B: Via Supabase Dashboard (Manual)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste: [/workspaces/SupfitApp/supabase/migrations/20260201_sync_auth_to_public_users.sql](/workspaces/SupfitApp/supabase/migrations/20260201_sync_auth_to_public_users.sql)
3. Click "Run"

**What it does:**
- Creates a trigger on `auth.users` INSERT that automatically creates a record in `public.users`
- Syncs any existing auth users that are missing from `public.users`
- Defaults new users to role `'individual'`

---

## Step 3: Update User Role to Coach/Dietician

**Via Supabase Dashboard SQL Editor:**

### For a Coach:
```sql
UPDATE public.users
SET role = 'coach'::public.user_role,
    updated_at = NOW()
WHERE email = 'your-coach-email@example.com'
  AND role != 'coach'
RETURNING id, email, role;
```

### For a Dietician:
```sql
UPDATE public.users
SET role = 'dietician'::public.user_role,
    updated_at = NOW()
WHERE email = 'your-dietician-email@example.com'
  AND role != 'dietician'
RETURNING id, email, role;
```

**Expected Result:**
```
     id     |       email        |  role
────────────────────────────────────────
 [uuid]     | coach@example.com  | coach
(1 row affected)
```

---

## Step 4: Test the App

### In Expo/React Native:
1. **Stop** the current dev server (Ctrl+C)
2. **Sign out** completely from the app
3. **Clear app cache** (if on physical device or emulator):
   ```bash
   # For Android
   adb shell pm clear com.example.app
   
   # For iOS Simulator
   xcrun simctl erase all
   ```
4. **Restart** the dev server:
   ```bash
   npm run dev
   # or
   npx expo start
   ```
5. **Sign in** again with your coach email
6. **Navigate** to Coach Subscription screen
7. **Try saving** a package

### Check Console Logs

Open browser DevTools (F12) or Expo terminal and look for logs starting with `[CoachSubscription]`:

#### ✅ Success Logs (Package Saved):
```
[CoachSubscription] Auth user ID: [uuid]
[CoachSubscription] User role from DB: coach
[CoachSubscription] Persisting package: {
  userId: "[uuid]",
  userRole: "coach",
  professionalType: "coach",
  packageId: "temp-basic",
  packageName: "Basic Package",
  isNewPackage: true,
  payload: { ... }
}
[CoachSubscription] Upsert SUCCESS: {
  packageId: "[uuid]",
  packageName: "Basic Package",
  status: "draft"
}
```

#### ❌ Failure Logs (Common Issues):

**Issue 1: User role is null**
```
[CoachSubscription] Auth user ID: [uuid]
[CoachSubscription] User role from DB: null  ← PROBLEM!
```
→ User record exists but role is NULL. Run Step 3 SQL to set role.

**Issue 2: Role mismatch**
```
[CoachSubscription] User role from DB: individual
[CoachSubscription] WARNING: User role mismatch {
  userRole: "individual",
  professionalType: "coach"
}
```
→ User account is 'individual'. Update role in Supabase. See Step 3.

**Issue 3: Permission denied (RLS blocked)**
```
[CoachSubscription] Upsert FAILED: {
  message: "new row violates row-level security policy..."
}
```
→ User exists but role check failed. Verify:
- User record exists in `public.users`
- User's `role` column = 'coach' or 'dietician' (not NULL, not 'individual')

**Issue 4: User record missing entirely**
```
[CoachSubscription] User fetch error: {
  message: "No rows found",
  code: "PGRST116"
}
[CoachSubscription] WARNING: User role is null/undefined
```
→ Auth user not synced to `public.users`. Apply Step 2 migration.

---

## Step 5: Advanced Debugging

### Check RLS Eligibility
Run in Supabase SQL Editor:
```sql
SELECT 
  u.id,
  u.email,
  u.role,
  -- Can user manage coach packages?
  (u.role::text = 'coach'::text) as can_manage_coach_packages,
  -- Can user manage dietician packages?
  (u.role::text = 'dietician'::text) as can_manage_dietician_packages
FROM public.users u
WHERE u.email = 'your-coach-email@example.com';
```

**Expected:** `can_manage_coach_packages = true` ✅

### View Packages Created
Run in Supabase SQL Editor:
```sql
SELECT 
  pp.id,
  pp.name,
  pp.professional_type,
  pp.owner_user_id,
  pp.status,
  pp.created_at
FROM public.professional_packages pp
WHERE pp.owner_user_id = '[YOUR_USER_UUID]'
ORDER BY pp.created_at DESC;
```

Should show your saved packages. If empty after saving, RLS is still blocking.

### Temporarily Disable RLS (Dev Only!)
⚠️ **WARNING: Only for development/debugging. Re-enable before production!**

```sql
-- Temporarily DROP the restrictive policy
DROP POLICY IF EXISTS professional_packages_owner_manage ON public.professional_packages;

-- Create a permissive policy for debugging
CREATE POLICY professional_packages_debug_any_auth
  ON public.professional_packages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Test your save. If it works now, RLS was the problem.

-- When done, restore the original policy:
-- DROP POLICY professional_packages_debug_any_auth ON public.professional_packages;
-- (Restore original policy from migration file)
```

---

## Checklist: Quick Diagnosis

Run through this checklist:

- [ ] **Auth User Exists?** 
  → Check Supabase Auth tab. See user listed?
  
- [ ] **Public User Synced?**
  → Run sync status query (Step 1). See `sync_status = 'OK'`?
  
- [ ] **Role Set?**
  → Query shows `pu.role = 'coach'` or `'dietician'`?
  
- [ ] **No Null Role?**
  → User role is NOT NULL, NOT 'individual'?
  
- [ ] **Console Logs Clean?**
  → Run app, save package, check browser console. See success logs?
  
- [ ] **Data in Database?**
  → Query `professional_packages` table. See your saved package?

If all checks pass → ✅ **You're done!**
If any check fails → Follow the remediation steps above.

---

## Files Referenced

- **Migration (Auto-Sync):** [/workspaces/SupfitApp/supabase/migrations/20260201_sync_auth_to_public_users.sql](/workspaces/SupfitApp/supabase/migrations/20260201_sync_auth_to_public_users.sql)
- **SQL Utilities:** [/workspaces/SupfitApp/DEBUG_COACH_PACKAGES_SQL_UTILS.sql](/workspaces/SupfitApp/DEBUG_COACH_PACKAGES_SQL_UTILS.sql)
- **App Code:** [/workspaces/SupfitApp/src/screens/CoachSubscriptionNative.tsx](/workspaces/SupfitApp/src/screens/CoachSubscriptionNative.tsx)
- **Schema:** [/workspaces/SupfitApp/supabase/migrations/2026-02-01_add_professional_packages.sql](/workspaces/SupfitApp/supabase/migrations/2026-02-01_add_professional_packages.sql)

---

## Common Fixes Summary

| Symptom | Cause | Fix |
|---------|-------|-----|
| "User role from DB: null" | User exists but role is NULL | Run Step 3 SQL to set role |
| "User fetch error: No rows found" | User not synced to `public.users` | Apply Step 2 migration |
| "Role mismatch" warning | User is 'individual', trying to save as 'coach' | Update role in Supabase (Step 3) |
| "permission denied" error | RLS policy blocked insert | Check user role matches `professional_type` |
| Data not saving but no error | Silent RLS failure | Check console logs, verify role |

---

## Next Steps

1. **Apply the auto-sync migration** (Step 2) to prevent this in the future
2. **Run the diagnostic query** (Step 1) for your current users
3. **Update any coach/dietician accounts** (Step 3)
4. **Test save in app** and watch console logs
5. **Report any remaining issues** with full console log output

Questions? Check console logs first—they now include detailed diagnostics!
