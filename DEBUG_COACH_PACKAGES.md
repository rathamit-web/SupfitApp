# Coach Subscription Debug Guide

## Logging Points Added

When you run the Expo app and try to save a package, check the **browser console** or **terminal output** for these logs:

### On Screen Load:
```
[CoachSubscription] Auth user ID: <uuid>
[CoachSubscription] User role from DB: <role>
```

**What to check:**
- Is the user ID appearing?
- What is the role? Should be 'coach' or 'dietician'

### On Save Button Click:
```
[CoachSubscription] Persisting package: {
  userId: <uuid>,
  userRole: <role>,
  packageId: <id>,
  packageName: <name>,
  payload: { ... }
}
```

**What to check:**
- Is userId populated?
- Is userRole populated? If null, the RLS policy will fail!
- Does the payload look correct?

### After Supabase Response:
```
[CoachSubscription] Upsert response: { data: { ... }, error: null }
```
OR
```
[CoachSubscription] Upsert error details: {
  message: "...",
  code: "...",
  details: "...",
  hint: "..."
}
```

**Common Errors:**

1. **`permission denied for schema "public"`** or **`new row violates row-level security policy`**
   - **Cause:** RLS policy failed. User role doesn't match 'coach'
   - **Fix:** Check if user.role = 'coach' in users table

2. **`relation "public.professional_packages" does not exist`**
   - **Cause:** Migration not applied
   - **Fix:** Run `supabase db push` or apply migration manually

3. **`422 Unprocessable Entity`**
   - **Cause:** Invalid payload (wrong enum values, constraint violations)
   - **Fix:** Check payload types match schema

## Step-by-Step Debug:

1. **Start Expo:** `npx expo start`
2. **Open Console:** Press `w` in terminal for web, then check browser DevTools (F12)
3. **Sign In:** Use a coach account
4. **Try to Save:** Edit a package and click "Save Changes"
5. **Read Logs:** Look for the above messages in console
6. **Share Error:** Copy the `[CoachSubscription]` error logs and share them

## Critical Check: User Role

If you see `userRole: null`, the user doesn't exist in the users table OR their role field is empty/null. This will always fail RLS.

To verify in Supabase Dashboard:
```sql
SELECT id, email, role FROM public.users LIMIT 10;
```

The authenticated user's role must be exactly `'coach'` for the RLS policy to allow the insert.
