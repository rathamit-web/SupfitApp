# Phase 2 Database Deployment: Complete Guide

**Status:** 🟢 READY FOR DEPLOYMENT  
**Date:** 2026-02-09  
**Phase:** Professional Directory Foundation (Phase 2)

---

## Executive Summary

**3 Database Migrations Ready to Deploy:**

1. **20260209000000_phase_2_foundation.sql** ✅ (334 lines)
   - Creates: professional_reviews, professional_languages, professional_review_stats
   - Triggers: prevent_self_review(), refresh_professional_review_stats()
   - Policies: 7 RLS policies with moderation workflow
   - **Status:** All SQL errors fixed, syntax validated

2. **20260209000001_cleanup_legacy_testimonials.sql** ✅ (150 lines)
   - Drops: legacy testimonials tables (3 duplicate versions)
   - Prerequisites: professional_reviews must exist first
   - **Status:** Ready to deploy

3. **Recommended:** Update TestimonialsNative.tsx → connect to database

---

## Pre-Deployment Checklist

### ✅ Database Design Validation

| Component | Status | Details |
|-----------|--------|---------|
| professional_reviews table | ✅ | UUID PK, 14 columns, 5 indices, no_self_review trigger |
| professional_languages table | ✅ | Multilingual support, ISO 639-1 codes, proficiency levels |
| professional_review_stats table | ✅ | Denormalized aggregates, JSONB rating distribution |
| Triggers | ✅ | 2 triggers (self-review prevention + stats maintenance) |
| RLS Policies | ✅ | 7 policies (SELECT, INSERT, UPDATE, responses, moderation) |
| Indices | ✅ | 8 total across 3 tables (performance optimized) |

### ✅ SQL Syntax Validation

| Error Type | Fixed? | Details |
|-----------|--------|---------|
| RLS Syntax | ✅ | Changed from `CREATE POLICY IF NOT EXISTS` → `DROP POLICY IF EXISTS + CREATE POLICY` |
| CHECK Constraints | ✅ | Removed subquery from CHECK, implemented as BEFORE trigger |
| Table Creation | ✅ | Changed from `CREATE IF NOT EXISTS` → `DROP CASCADE + CREATE` |
| Column References | ✅ | Fixed initialization query: `pp.id` instead of `professional_package_id` |

### 📋 Documentation

- [x] [DATABASE_DUPLICATION_AUDIT.md](DATABASE_DUPLICATION_AUDIT.md) - Legacy table analysis
- [x] Phase 2 Foundation Migration created
- [x] Cleanup Migration created
- [x] This deployment guide

---

## Deployment Steps

### STEP 1: Deploy Professional Reviews Foundation (Supabase)

**File:** `/workspaces/SupfitApp/supabase/migrations/20260209000000_phase_2_foundation.sql`

**Steps:**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your SupfitApp project
3. Navigate to **SQL Editor**
4. Click **"New Query"**
5. Copy entire contents of `20260209000000_phase_2_foundation.sql`
6. Paste into SQL Editor
7. Click **"Run"** button
8. Wait for success message (< 1 minute)

**Expected Output:**
```
Query completed successfully
```

**Verify Success - Run These Queries:**

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('professional_reviews', 'professional_languages', 'professional_review_stats');

-- Should return 3 rows
```

```sql
-- Check indices created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (tablename = 'professional_reviews' 
     OR tablename = 'professional_languages' 
     OR tablename = 'professional_review_stats');

-- Should return 8 rows
```

```sql
-- Check triggers created
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'professional_reviews';

-- Should return 2 rows: trigger_prevent_self_review, trigger_refresh_review_stats_on_review_change
```

```sql
-- Check RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('professional_reviews', 'professional_languages', 'professional_review_stats');

-- All should show rowsecurity = TRUE
```

---

### STEP 2: Deploy Cleanup Migration (Supabase)

**File:** `/workspaces/SupfitApp/supabase/migrations/20260209000001_cleanup_legacy_testimonials.sql`

**Only after STEP 1 succeeds**

**Steps:**
1. In Supabase SQL Editor, click **"New Query"**
2. Copy entire contents of `20260209000001_cleanup_legacy_testimonials.sql`
3. Paste into editor
4. Click **"Run"**
5. Verify success message

**Expected Output:**
```
Query completed successfully
✓ professional_reviews table confirmed
✓ Data check complete
✓ Legacy testimonials table dropped
✓ Verified: testimonials table no longer exists
```

---

### STEP 3: Verify Data Integrity in Supabase Table Editor

1. **Supabase → Table Editor**
2. Look for these tables in left sidebar:
   - ✅ `professional_reviews` (should be visible)
   - ✅ `professional_languages` (should be visible)
   - ✅ `professional_review_stats` (should be visible)
   - ❌ `testimonials` (should NOT be visible)

3. Click each table to verify columns:

**professional_reviews:**
```
id (uuid)
professional_package_id (uuid)
reviewer_user_id (uuid)
rating (numeric)
title (text)
content (text)
status (enum)
helpful_count (integer)
unhelpful_count (integer)
response_text (text)
response_at (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

**professional_languages:**
```
id (uuid)
professional_package_id (uuid)
language_code (varchar)
language_name (text)
proficiency_level (text)
created_at (timestamp)
updated_at (timestamp)
```

**professional_review_stats:**
```
professional_package_id (uuid) - PRIMARY KEY
total_reviews (integer)
avg_rating (numeric)
rating_distribution (jsonb)
recent_reviews_3m (integer)
helpful_count (integer)
last_review_at (timestamp)
updated_at (timestamp)
```

---

### STEP 4: Test RLS Policies

**In Supabase SQL Editor:**

```sql
-- Test: Anyone can read approved reviews
SELECT * FROM public.professional_reviews 
WHERE status = 'approved' LIMIT 1;

-- Expected: Builds query (may return 0 rows if no approved reviews yet)
```

```sql
-- Test: Stats table readable by all (for search)
SELECT * FROM public.professional_review_stats LIMIT 1;

-- Expected: Builds query (may return 0 rows initially)
```

```sql
-- Test: Languages table readable by all
SELECT * FROM public.professional_languages LIMIT 1;

-- Expected: Builds query (may return 0 rows initially)
```

---

### STEP 5: Configure App Routes (Frontend Integration)

**File:** `/workspaces/SupfitApp/src/App.tsx`

After database deployment, update routing to prepare for future features:

```tsx
// Add routes for professional reviews (optional for Phase 2.1)
<Route path="/reviews/:professionalPackageId" element={<ProfessionalReviews />} />
<Route path="/testimonials" element={<TestimonialsNative />} />
```

---

### STEP 6: Update TestimonialsNative Component (Optional - Phase 2.1)

**File to Update:** `/workspaces/SupfitApp/src/screens/TestimonialsNative.tsx`

**Required Changes:**
1. Add Supabase import
2. Replace mock data with real database queries
3. Update interface to match professional_reviews schema
4. Add useEffect to fetch pending reviews
5. Implement publish/archive toggle
6. Implement reply functionality

**Timeline:** This can be done after database deployment (not blocking Phase 2 database deployment)

---

## Rollback Plan (If Needed)

### Rollback from STEP 2 (Cleanup Migration)

If legacy testimonials data is needed:

```sql
-- STEP 2 ROLLBACK: Recreate old testimonials 
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  testimonial text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX testimonials_coach_id_idx ON public.testimonials (coach_id);
CREATE INDEX testimonials_client_id_idx ON public.testimonials (client_id);
```

### Rollback from STEP 1 (Full)

If phase_2_foundation needs to be removed:

```sql
-- Rollback: Drop all Phase 2 tables
DROP TABLE IF EXISTS public.professional_reviews CASCADE;
DROP TABLE IF EXISTS public.professional_languages CASCADE;
DROP TABLE IF EXISTS public.professional_review_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.refresh_professional_review_stats() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_self_review() CASCADE;

-- Drop ENUM type
DROP TYPE IF EXISTS review_status_enum CASCADE;
```

---

## Post-Deployment Monitoring

### Monitor for Errors

1. **Check Supabase Logs**
   - Supabase → Logs (in sidebar)
   - Filter: Database errors
   - Should see 0 errors from migrations

2. **Check RLS Policy Violations**
   - If users report "permission denied" on reviews
   - Review RLS policy configuration

3. **Monitor Performance**
   - Query times for search should be < 200ms
   - Stats table should maintain < 500ms update time

### Success Indicators (24 hours after deployment)

- ✅ No constraint violation errors in logs
- ✅ No "column does not exist" errors
- ✅ No "permission denied" errors from RLS
- ✅ professional_reviews table has correct structure
- ✅ professional_review_stats populated for existing packages
- ✅ Indices appear in "Indices" tab for each table

---

## FAQ & Troubleshooting

### Q: I see "table already exists" error in STEP 1?
**A:** The migration uses `DROP TABLE IF EXISTS CASCADE` first, so re-running is safe. This is idempotent by design.

### Q: I see "column does not exist" errors?
**A:** All column references have been corrected. If you see this, verify you're using the latest migration file (with all fixes applied).

### Q: Do I need to deploy STEP 2 (cleanup) immediately?
**A:** Recommended but not blocking. Deploy STEP 1 (professional_reviews) first, verify success, then deploy STEP 2 (cleanup) within 24 hours.

### Q: What if I need the old testimonials data?
**A:** See [DATABASE_DUPLICATION_AUDIT.md](DATABASE_DUPLICATION_AUDIT.md) for data migration path. Do this before STEP 2, or restore from backup.

### Q: How do I know if code is using old testimonials table?
```bash
# Search for references
grep -r "testimonials" src/ --include="*.ts" --include="*.tsx"
grep -r "testimonials" backend/ --include="*.py" --include="*.js"

# Update matches to use 'professional_reviews' instead
```

### Q: Can I deploy Phase 2 database before updating TestimonialsNative?
**A:** **YES**. Database deployment is independent. Frontend can be updated later (Phase 2.1).

---

## Deployment Timeline

| Phase | Duration | Blocker? | Dependencies |
|-------|----------|----------|---|
| Pre-check (this guide) | 5 min | NO | None |
| STEP 1: Deploy foundation | < 1 min | NO | Supabase access |
| STEP 1: Verify success | 5 min | YES | STEP 1 complete |
| STEP 2: Deploy cleanup | < 1 min | NO | STEP 1 success |
| STEP 2: Verify success | 2 min | YES | STEP 2 complete |
| **TOTAL TIME** | **~15 min** | | |

### Optional (Phase 2.1, not blocking Phase 2 deployment):
- Update TestimonialsNative component: 2-3 hours
- Test end-to-end review flow: 30 min
- QA verification: 1 hour

---

## Success Criteria (Phase 2 Database Complete)

✅ **Deployment Success Means:**
1. All 3 tables created (professional_reviews, professional_languages, professional_review_stats)
2. All 8 indices created and functional
3. All 7 RLS policies enforced
4. All 2 triggers active (self-review prevention + stats maintenance)
5. Legacy testimonials table removed
6. No SQL errors in logs
7. Professional packages auto-stats initialized

✅ **Go/No-Go Decision:** 
- **GO** if all 7 items are checked
- **HOLD** if any item fails
- **ROLLBACK** if critical constraint violations occur (see Rollback Plan above)

---

## Next Steps After Deployment

**Immediate (same day):**
- ✅ Verify all checks pass
- ✅ Monitor logs for 1 hour
- ✅ Test in development environment

**Within 24 hours:**
- 📋 Update TestimonialsNative.tsx
- 📋 Add test data to professional_reviews
- 📋 Verify review flow works

**Within 1 week:**
- 📋 Complete Phase 2.1 (frontend integration)
- 📋 QA testing of reviews feature
- 📋 Documentation update

---

**Prepared By:** Database Expert Review  
**Date:** 2026-02-09  
**Document Status:** Ready for Deployment  
**Version:** 1.0
