# Coach Packages: Quick Start (TL;DR)

## The Problem
Packages don't save to the database.

## The Fix (3 Steps)

### Step 1: Apply Migration
```bash
cd /workspaces/SupfitApp
supabase db push
```

### Step 2: Update Your User Role
Go to **Supabase Dashboard → SQL Editor** and run:

For Coach:
```sql
UPDATE public.users
SET role = 'coach'::public.user_role
WHERE email = 'your-email@example.com';
```

For Dietician:
```sql
UPDATE public.users
SET role = 'dietician'::public.user_role
WHERE email = 'your-email@example.com';
```

### Step 3: Test
```bash
npm run dev
```

Sign in, go to subscriptions, save a package. Check **browser console** (F12) for logs like:
```
[CoachSubscription] Upsert SUCCESS: { packageId: "..." }
```

## Still Broken?

1. **Open browser console (F12)**
2. **Look for [CoachSubscription] logs**
3. **Check what error appears**
4. **See COACH_PACKAGES_DEBUGGING_GUIDE.md for your error**

## Key Files
- **Debug Guide:** [COACH_PACKAGES_DEBUGGING_GUIDE.md](COACH_PACKAGES_DEBUGGING_GUIDE.md)
- **Full Implementation:** [COACH_PACKAGES_IMPLEMENTATION.md](COACH_PACKAGES_IMPLEMENTATION.md)
- **SQL Utilities:** [DEBUG_COACH_PACKAGES_SQL_UTILS.sql](DEBUG_COACH_PACKAGES_SQL_UTILS.sql)
- **Solution Summary:** [COACH_PACKAGES_SOLUTION_SUMMARY.md](COACH_PACKAGES_SOLUTION_SUMMARY.md)

---

**That's it.** If packages still don't save after these 3 steps, consult the debugging guide.
