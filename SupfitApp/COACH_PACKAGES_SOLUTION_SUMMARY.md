# Coach Subscription Packages: Solution Summary

## Problem
Coach subscription packages were not persisting to the database despite success alerts appearing. Root cause: **RLS policy rejection due to missing or incorrectly configured user records in the `public.users` table**.

## Root Cause Analysis
The `professional_packages_owner_manage` RLS policy requires:
1. `owner_user_id = auth.uid()` ✅ (always works)
2. `user.role::text = professional_type::text` ❌ (fails when role is NULL or mismatched)

Issue: When users sign in via Supabase Auth, they get an `auth.users` record, but there's no automatic sync to the `public.users` table, leaving the role undefined.

## Solution Components

### 1. New Auto-Sync Migration
**File:** `supabase/migrations/20260201_sync_auth_to_public_users.sql`

Creates a trigger that:
- Automatically syncs new auth users to `public.users`
- Defaults role to 'individual' (can be updated to 'coach'/'dietician')
- Syncs any existing auth users that are missing

**How to apply:**
```bash
supabase db push
```

### 2. Enhanced App Logging & Error Handling
**File:** `src/screens/CoachSubscriptionNative.tsx` (updated)

Added:
- Pre-flight role validation before attempting persist
- User role fetch from `public.users` on app load
- Specific error messages for role mismatches
- Comprehensive console logging with [CoachSubscription] prefix
- Detailed error diagnostics (code, message, hint)

**Key changes:**
- `userRole` state to track user's role
- Bootstrap effect now fetches user role from DB
- `persistPackage()` validates role before attempting save
- Better error messages for UX

### 3. SQL Debugging Utilities
**File:** `DEBUG_COACH_PACKAGES_SQL_UTILS.sql`

Provides ready-to-use SQL queries for:
- Checking sync status between auth.users and public.users
- Viewing coach/dietician users and their packages
- Finding role mismatches
- Updating user roles
- Checking RLS policy eligibility

### 4. Comprehensive Debugging Guide
**File:** `COACH_PACKAGES_DEBUGGING_GUIDE.md`

Step-by-step guide covering:
- Step 1: Check user sync status
- Step 2: Apply auto-sync migration
- Step 3: Update user roles
- Step 4: Test in app
- Step 5: Advanced debugging
- Quick checklist for diagnosis
- Common fixes summary

### 5. Implementation Guide
**File:** `COACH_PACKAGES_IMPLEMENTATION.md`

Complete documentation including:
- Architecture overview
- Problem diagnosis
- Quick fix checklist
- Files in solution
- Implementation checklist
- Troubleshooting guide
- Console log format
- Technical details

### 6. Automated Diagnostic Script
**File:** `diagnose-coach-packages.sh`

Bash script that:
- Checks if Supabase CLI is installed
- Verifies project structure
- Lists migration files
- Checks database connectivity
- Provides recommendations

**How to run:**
```bash
bash diagnose-coach-packages.sh
```

## What's Fixed

### Before
- Packages saved locally but not persisted to DB
- Success alerts appeared but no data saved
- Silent RLS failures with no user feedback
- Difficult to diagnose without deep DB knowledge

### After
- Auto-sync prevents missing user records
- Pre-flight validation catches role issues before attempt
- Clear error messages explain what's wrong
- Comprehensive console logging aids debugging
- Multiple debugging tools for diagnosis
- Step-by-step guide for fixing

## Implementation Timeline

1. **Immediate:** Apply migration 20260201
2. **Immediate:** Check/update user roles
3. **Next:** Test app with enhanced logging
4. **Ongoing:** Use debugging guides as needed

## Testing Checklist

- [ ] Migration 20260201 applied
- [ ] Existing auth users synced to public.users
- [ ] Coach/dietician user roles updated
- [ ] App restarted
- [ ] User signs in as coach
- [ ] Console shows "User role from DB: coach"
- [ ] Save package attempt
- [ ] Console shows "Upsert SUCCESS"
- [ ] Data visible in Supabase Dashboard
- [ ] Multiple edit/save cycles work

## Debugging Quick Links

| Symptom | Guide | Step |
|---------|-------|------|
| "User role from DB: null" | COACH_PACKAGES_DEBUGGING_GUIDE.md | Step 3 |
| User not synced | COACH_PACKAGES_DEBUGGING_GUIDE.md | Step 2 |
| Role mismatch | COACH_PACKAGES_DEBUGGING_GUIDE.md | Step 3 |
| Permission denied | COACH_PACKAGES_DEBUGGING_GUIDE.md | Step 5 |
| Unknown issue | DEBUG_COACH_PACKAGES_SQL_UTILS.sql | Run queries |
| Verify setup | diagnose-coach-packages.sh | Run script |

## Files Modified

1. **Created:**
   - `supabase/migrations/20260201_sync_auth_to_public_users.sql`
   - `DEBUG_COACH_PACKAGES_SQL_UTILS.sql`
   - `COACH_PACKAGES_DEBUGGING_GUIDE.md`
   - `COACH_PACKAGES_IMPLEMENTATION.md`
   - `diagnose-coach-packages.sh`

2. **Updated:**
   - `src/screens/CoachSubscriptionNative.tsx` (enhanced logging & validation)

3. **Existing (for reference):**
   - `supabase/migrations/2026-02-01_add_professional_packages.sql`
   - `DEBUG_COACH_PACKAGES.md`
   - `DEBUG_RLS_PERMISSIVE.sql`

## Next Steps for User

1. **Run migration:**
   ```bash
   supabase db push
   ```

2. **Check user sync:**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy query from COACH_PACKAGES_DEBUGGING_GUIDE.md Step 1

3. **Update user roles:**
   - See Step 3 of debugging guide
   - Update your account to 'coach' if needed

4. **Test app:**
   ```bash
   npm run dev
   ```
   - Watch console for [CoachSubscription] logs
   - Try saving a package

5. **Report results:**
   - Share console output
   - Share whether packages now persist

## Success Indicators

✅ Package saves successfully when:
1. Console shows "User role from DB: coach"
2. No role mismatch warning
3. Console shows "Upsert SUCCESS"
4. Package appears in app's package list
5. Package visible in Supabase Dashboard
6. Multiple edit/save cycles work

## Known Limitations & Future Improvements

- Currently defaults new auth users to 'individual' role (can be updated to 'coach' based on email domain or metadata)
- RLS policy still restrictive (by design, prevents data leakage)
- Manual role updates required for existing users (could be automated with admin UI)

## Support Resources

1. **Debugging Guide:** COACH_PACKAGES_DEBUGGING_GUIDE.md
2. **SQL Utilities:** DEBUG_COACH_PACKAGES_SQL_UTILS.sql  
3. **Implementation Details:** COACH_PACKAGES_IMPLEMENTATION.md
4. **Auto-Sync:** supabase/migrations/20260201_sync_auth_to_public_users.sql
5. **App Code:** src/screens/CoachSubscriptionNative.tsx
6. **Original Diagnostics:** DEBUG_COACH_PACKAGES.md, DEBUG_RLS_PERMISSIVE.sql

---

**Solution Status:** ✅ Complete and Ready for Testing
**Migration Required:** Yes (20260201_sync_auth_to_public_users.sql)
**Data Destructive:** No
**User-Facing Changes:** Better error messages and validation
