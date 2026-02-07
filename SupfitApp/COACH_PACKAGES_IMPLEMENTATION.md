# Coach Subscription Packages: Complete Implementation Guide

## Overview

This document provides the complete guide for coach/dietician subscription package management in the Supfit app. Packages are not being persisted to the database, and this guide provides a comprehensive solution.

## Architecture

### Database Schema
- **professional_packages** table: Stores coach/dietician subscription plans
- **professional_type_enum**: 'coach', 'dietician'  
- **subscription_status_enum**: 'draft', 'active', 'paused', 'cancelled', 'expired'
- **users** table: Must have `role` column = 'coach' or 'dietician'

### RLS Policy
The `professional_packages_owner_manage` policy enforces:
```sql
owner_user_id = auth.uid()
AND user.role::text = professional_type::text
```

**In plain English:** A user can only manage packages if:
1. They are the owner (owner_user_id = their auth.uid)
2. Their user role matches the package professional type

### App Flow
1. User signs in via Supabase Auth → creates `auth.users` record
2. Auth trigger automatically creates `public.users` record (with migration 20260201)
3. Coach navigates to subscription screen
4. Screen queries user's role from `public.users` table
5. Coach edits/creates packages
6. App upserts to `professional_packages` (RLS policy checks both conditions)
7. If RLS check passes → package saved ✅
8. If RLS check fails → Supabase returns permission denied error ❌

## Problem Diagnosis

### Why Packages Aren't Saving

The most common cause is **RLS policy rejection** due to:

1. **Missing user in public.users table**
   - Auth user created but not synced to public.users
   - Solution: Apply migration 20260201_sync_auth_to_public_users.sql

2. **User role is NULL or wrong value**
   - User exists but role column is NULL
   - User role is 'individual' but trying to save 'coach' packages
   - Solution: Update user role via SQL (see COACH_PACKAGES_DEBUGGING_GUIDE.md)

3. **User role doesn't match professional_type**
   - Trying to save 'coach' package but user role is 'dietician'
   - Solution: Verify PROFESSIONAL_TYPE constant matches user role

## Quick Fix Checklist

- [ ] **Apply migrations**
  ```bash
  supabase db push
  ```

- [ ] **Check user exists in public.users**
  - Go to Supabase Dashboard → SQL Editor
  - Copy query from COACH_PACKAGES_DEBUGGING_GUIDE.md Step 1

- [ ] **Update user role to coach/dietician**
  - See COACH_PACKAGES_DEBUGGING_GUIDE.md Step 3

- [ ] **Restart app and test**
  ```bash
  npm run dev
  ```

- [ ] **Check console logs**
  - Look for [CoachSubscription] prefix
  - See success or error details

## Files in This Solution

### Core Implementation
- `src/screens/CoachSubscriptionNative.tsx` - Coach subscription UI with enhanced logging
- `supabase/migrations/2026-02-01_add_professional_packages.sql` - Main schema
- `supabase/migrations/20260201_sync_auth_to_public_users.sql` - **NEW** Auto-sync trigger

### Debugging Tools
- `COACH_PACKAGES_DEBUGGING_GUIDE.md` - Step-by-step debugging guide
- `DEBUG_COACH_PACKAGES_SQL_UTILS.sql` - SQL queries for diagnosis
- `diagnose-coach-packages.sh` - Automated diagnostic script

### Documentation
- This file - Complete implementation guide
- `DEBUG_COACH_PACKAGES.md` - Original debug notes
- `DEBUG_RLS_PERMISSIVE.sql` - Temporary RLS bypass for testing

## Implementation Checklist

For production deployment:

- [ ] Migration 20260201 applied to database
- [ ] All existing auth users synced to public.users
- [ ] Coach/dietician users have correct role set
- [ ] RLS policy working (no permission denied errors)
- [ ] App console logs clean (no errors on save)
- [ ] Data persists in professional_packages table
- [ ] Multiple save/edit cycles work correctly

## Troubleshooting

### Symptom: "Account Setup Issue" Alert on Save
**Cause:** User role is NULL in public.users
**Fix:** 
1. Apply migration 20260201 (creates auto-sync)
2. Or manually: Run UPDATE query from Step 3 of debugging guide

### Symptom: "Account Type Mismatch" Alert
**Cause:** User role doesn't match PROFESSIONAL_TYPE constant
**Fix:** Update user role via SQL to match (coach or dietician)

### Symptom: "Permission denied" Error
**Cause:** RLS policy rejected the insert
**Fix:**
1. Verify user role = 'coach' or 'dietician'
2. Verify owner_user_id = actual auth.uid()
3. Check console logs for exact error

### Symptom: No Error but Data Not Saved
**Cause:** Silent RLS failure or other issue
**Fix:**
1. Check browser console for [CoachSubscription] logs
2. Run sync status query (Step 1 of debugging guide)
3. Verify user role with SQL query

## Console Log Format

When saving a package, you should see:

**Success:**
```
[CoachSubscription] Auth user ID: [uuid]
[CoachSubscription] User role from DB: coach
[CoachSubscription] Persisting package: {...}
[CoachSubscription] Upsert SUCCESS: {
  packageId: "[uuid]",
  packageName: "Package Name",
  status: "draft"
}
```

**Failure:**
```
[CoachSubscription] WARNING: User role is null/undefined
[CoachSubscription] Upsert FAILED: {
  message: "new row violates row-level security policy...",
  code: "42501"
}
```

Look for these logs when troubleshooting.

## Technical Details

### PROFESSIONAL_TYPE Constant
Currently set to `'coach'`. Change this to test dietician packages:
```typescript
const PROFESSIONAL_TYPE = 'coach'; // or 'dietician'
```

### Payload Structure
When persisting, the app sends:
```typescript
{
  id?: string,                    // For updates
  owner_user_id: string,          // UUID from auth
  professional_type: string,      // 'coach' or 'dietician'
  name: string,
  slug: string,
  description: string,
  price: number,
  currency: 'INR',
  billing_cycle: 'monthly',
  billing_frequency: number,
  feature_list: string[],         // JSON array
  visibility: 'private',
  status: 'draft' | 'active',
  metadata: object,
  is_default: boolean,
}
```

### RLS Policy (Before & After)

**Original Policy (with problem):**
```sql
USING (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role::text = professional_type::text
  )
)
```

The issue: If `u.role` is NULL or doesn't exist, the EXISTS check fails silently.

**Solution:** App now checks role BEFORE attempting insert (in TypeScript):
```typescript
if (!userRole) {
  // Show error: role is NULL
  return null;
}
if (userRole !== PROFESSIONAL_TYPE) {
  // Show error: role mismatch
  return null;
}
// Only then attempt insert
```

This gives users clear feedback instead of cryptic permission denied errors.

## Next Steps

1. **Apply migrations**
   ```bash
   cd /workspaces/SupfitApp
   supabase db push
   ```

2. **Check/update user roles**
   - See COACH_PACKAGES_DEBUGGING_GUIDE.md Steps 1-3

3. **Test in app**
   ```bash
   npm run dev
   ```
   - Watch console logs
   - Attempt to save a package
   - Verify data in Supabase Dashboard

4. **Report status**
   - Share console output with [CoachSubscription] logs
   - Share results from Step 1 SQL query

## Support

For specific issues:
1. Check COACH_PACKAGES_DEBUGGING_GUIDE.md for your symptom
2. Run diagnostic script: `bash diagnose-coach-packages.sh`
3. Check console logs for [CoachSubscription] prefix
4. Review DEBUG_COACH_PACKAGES_SQL_UTILS.sql for specific queries
5. See original debug notes in DEBUG_COACH_PACKAGES.md

---

**Last Updated:** Feb 1, 2026  
**Status:** Ready for testing  
**Next Phase:** User testing and feedback
