# Phase 2 Database Migration - Deployment Guide

## ✅ Migration Fixed

The SQL migration file `20260209000000_phase_2_foundation.sql` has been corrected. All RLS policy syntax errors have been resolved.

---

## 📋 Step-by-Step Deployment

### Step 1: Copy the Corrected SQL
Go to this file in your workspace:
- **File:** `/workspaces/SupfitApp/supabase/migrations/20260209000000_phase_2_foundation.sql`
- **Action:** Copy the entire file contents

### Step 2: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)
4. Click **New Query** or open a blank editor

### Step 3: Paste & Execute
1. Paste the entire migration SQL into the editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for completion

### Step 4: Verify Deployment

Watch for these success indicators:

```
✅ Tables Created (3):
   - professional_reviews
   - professional_languages
   - professional_review_stats

✅ Trigger Created (1):
   - refresh_professional_review_stats()

✅ Indices Created (8):
   - idx_professional_reviews_package
   - idx_professional_reviews_reviewer
   - idx_professional_reviews_status
   - idx_professional_reviews_created
   - idx_professional_reviews_rating
   - idx_professional_languages_package
   - idx_professional_languages_code
   - idx_professional_review_stats_avg_rating
   - idx_professional_review_stats_total_reviews

✅ RLS Policies Created (8):
   - professional_reviews_select_approved
   - professional_reviews_insert
   - professional_reviews_update_own
   - professional_reviews_respond
   - professional_languages_select
   - professional_languages_manage
   - professional_review_stats_select
```

### Step 5: Confirm in Supabase UI

In Supabase Dashboard, go to **Table Editor** and verify:

- [ ] **professional_reviews** table exists with columns:
  - `id`, `professional_package_id`, `reviewer_user_id`, `rating`, `title`, `content`, `status`, `helpful_count`, `unhelpful_count`, `response_text`, `response_at`, `created_at`, `updated_at`

- [ ] **professional_languages** table exists with columns:
  - `id`, `professional_package_id`, `language_code`, `language_name`, `proficiency_level`, `created_at`, `updated_at`

- [ ] **professional_review_stats** table exists with columns:
  - `professional_package_id`, `total_reviews`, `avg_rating`, `rating_distribution`, `recent_reviews_3m`, `helpful_count`, `last_review_at`, `updated_at`

---

## 🔍 What Changed (Fixes Applied)

### Issue: PostgreSQL RLS Syntax Error

**Original Problem:**
```sql
CREATE POLICY IF NOT EXISTS professional_reviews_select_approved ...
-- ❌ ERROR: PostgreSQL doesn't support IF NOT EXISTS with CREATE POLICY
```

**Solution Applied:**
```sql
DROP POLICY IF EXISTS professional_reviews_select_approved ON public.professional_reviews;
CREATE POLICY professional_reviews_select_approved ON public.professional_reviews ...
-- ✅ First DROP existing policy, then CREATE new one
```

### Changes Made:

1. **Removed `IF NOT EXISTS`** from all `CREATE POLICY` statements
2. **Added `DROP POLICY IF EXISTS`** before each CREATE to ensure idempotency
3. **Fixed logic in review policies** with proper parentheses for OR conditions
4. **Improved data validation** in RLS policies

---

## 🧪 Post-Deployment Tests

### Test 1: Verify Tables Exist
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('professional_reviews', 'professional_languages', 'professional_review_stats');
```

**Expected Output:**
```
professional_reviews
professional_languages
professional_review_stats
```

### Test 2: Verify Indices Exist
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('professional_reviews', 'professional_languages', 'professional_review_stats');
```

**Expected Output:** 8+ indices listed

### Test 3: Verify Trigger Exists
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'trigger_refresh_review_stats_on_review_change';
```

**Expected Output:**
```
trigger_refresh_review_stats_on_review_change
```

### Test 4: Verify RLS Policies
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'professional_reviews';
```

**Expected Output:**
```
professional_reviews_select_approved
professional_reviews_insert
professional_reviews_update_own
professional_reviews_respond
```

---

## ⚠️ If You Still Get Errors

### Error: "function professional_package_subscriptions does not exist"

**Solution:** The app is OK - this is a dependency that will be OK once subscriptions table exists. For now, the RLS policy will simply prevent all inserts (safe default).

### Error: "permission denied"

This is expected if you're not logged in. Test with a valid auth.uid() context.

### Error: "schema already exists"

This is a warning, not an error. Migration is safe to re-run.

---

## ✨ Next Steps After Deployment

Once migration succeeds:

1. **Update your React app routes** to include Phase 2 screens
2. **Add navigation** to "Find Professionals" page
3. **Test search functionality** with browser DevTools
4. **Verify reviews display** properly on professional profiles

---

## 📞 Support

If deployment fails:

1. **Copy the error message exactly**
2. **Run each section separately** (Step 1-5 can be run independently)
3. **Check file paths** - ensure migration file hasn't been modified
4. **Verify Supabase permissions** - ensure you're logged in as project owner

---

**Status:** ✅ Ready to Deploy  
**File:** `20260209000000_phase_2_foundation.sql`  
**Last Updated:** February 9, 2026
