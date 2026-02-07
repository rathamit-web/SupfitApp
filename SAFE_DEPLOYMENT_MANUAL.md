# Safe Deployment Manual: Priority 2 & 3 with Zero Breaking Changes

**Date:** February 7, 2026  
**Status:** READY FOR CONTROLLED ROLLOUT  
**UI Impact:** ZERO (all changes optional/invisible)  
**Risk Level:** LOW  

---

## 📌 Before You Start

### Prerequisites ✅
- [ ] Database backup created
- [ ] Rollback plan tested
- [ ] Team notified
- [ ] Monitoring dashboards prepared
- [ ] Off-peak deployment window scheduled

### What Won't Change
- ✅ Current UI remains exactly the same
- ✅ Current queries work without modification
- ✅ Current users see no difference
- ✅ Current functionality unchanged
- ✅ Current performance baseline established

---

## 🎬 5-Step Safe Deployment

### STEP 1: Deploy RLS Policies (20 minutes)

**What gets deployed:** Database-enforced data isolation  
**What users see:** Nothing (transparent)  
**What developers experience:** Same queries, data filtered by RLS

```bash
# 1a. Apply migration
psql -h your-db.supabase.co -U postgres -d postgres < \
  supabase/migrations/20260207120000_priority_2_rls_policies.sql

# 1b. Verify RLS is enabled
psql -h your-db.supabase.co -U postgres -d postgres << 'EOF'
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;
-- Should return 11 tables with rowsecurity = true
EOF

# 1c. Run a test query in your app (should still work)
# GET /api/packages
# GET /api/user/profile
# Both should work exactly as before
```

**Important:** RLS doesn't break queries, it just filters them! 
- User queries: `SELECT * FROM user_profiles;` → Returns only their profile
- Coach queries: `SELECT * FROM coach_clients;` → Returns only their clients
- Admin queries: Uses `service_role_key` to bypass

**Verification:**
```javascript
// This query still works - RLS filters automatically
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');
// User sees only their profile ✓
```

---

### STEP 2: Deploy GDPR + Denormalization + Search (20 minutes)

**What gets deployed:**
- GDPR functions (export, delete, rectify)
- Package likes synchronization trigger
- Full-text search infrastructure

**What users see:** Nothing yet (features are opt-in)

```bash
# 2a. Apply migration
psql -h your-db.supabase.co -U postgres -d postgres < \
  supabase/migrations/20260207130000_priority_2_gdpr_denormalization_search.sql

# 2b. Verify denormalization trigger is working
psql -h your-db.supabase.co -U postgres -d postgres << 'EOF'
-- Insert a test like to verify trigger fires
INSERT INTO package_likes (package_id, user_id) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');

-- Check if likes_count was incremented
SELECT likes_count FROM professional_packages 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Should show likes_count = 1 (or incremented if was higher)
EOF

# 2c. Verify search function exists
psql -h your-db.supabase.co -U postgres -d postgres << 'EOF'
SELECT true FROM information_schema.routines 
WHERE routine_name = 'search_professional_packages';
-- Should return true
EOF
```

**Key Point:** New functions don't automatically get called. They're available when UI is ready to use them.

**Current queries:** Still work exactly the same ✓

---

### STEP 3: Verify No UI Breakage (30 minutes)

**Goal:** Confirm all existing functionality still works

```javascript
// Test script - run in browser console or test suite

// Test 1: User queries work
const { data: profiles } = await supabase
  .from('user_profiles')
  .select('*');
console.log('✓ User profiles query works', profiles.length);

// Test 2: Package queries work
const { data: packages } = await supabase
  .from('professional_packages')
  .select('*')
  .eq('status', 'active');
console.log('✓ Package query works', packages.length);

// Test 3: Coach queries work
const { data: coaches } = await supabase
  .from('coaches')
  .select('*')
  .eq('is_verified', true);
console.log('✓ Coach query works', coaches.length);

// Test 4: Metrics queries work
const { data: metrics } = await supabase
  .from('daily_metrics')
  .select('*')
  .limit(10);
console.log('✓ Metrics query works', metrics.length);

// Test 5: Complex query (dashboard) works
const { data: stats } = await supabase
  .from('coaches')
  .select(`
    id,
    user_id,
    coach_clients(count),
    professional_packages(count)
  `)
  .limit(5);
console.log('✓ Complex dashboard query works', stats.length);
```

**Verification Checklist:**
- [ ] User registration still works
- [ ] Profile viewing works
- [ ] Package creation for coaches works
- [ ] Package viewing works
- [ ] Metrics recording works
- [ ] Dashboard loads without errors
- [ ] No "Permission denied" errors in logs

**If issues encountered:**
```sql
-- Emergency rollback (disable RLS)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE professional_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE professional_package_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_stats DISABLE ROW LEVEL SECURITY;

-- Then restore from backup if needed
```

---

### STEP 4: Deploy Priority 3 (Soft Delete + Partitioning + Views) (30 minutes)

**What gets deployed:**
- Soft delete support (all new, optional)
- Time-series partitioning (transparent to queries)
- Materialized views (new dashboards)

**What users see:** Nothing (all additive, no changes to current behavior)

```bash
# 4a. Apply migration
psql -h your-db.supabase.co -U postgres -d postgres < \
  supabase/migrations/20260207140000_priority_3_soft_delete_partitioning_views.sql

# 4b. Verify partitions exist
psql -h your-db.supabase.co -U postgres -d postgres << 'EOF'
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'daily_metrics_%'
ORDER BY tablename;
-- Should return partitions for each month
EOF

# 4c. Verify materialized views created
psql -h your-db.supabase.co -U postgres -d postgres << 'EOF'
SELECT matviewname FROM pg_matviews 
WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';
-- Should return 4 views
EOF
```

**Current behavior preserved:**
- Soft delete columns (deleted_at) default to NULL, invisible
- Existing DELETE queries still work (hard delete until soft delete is used)
- Partitioning is transparent - queries work unchanged
- Materialized views are NEW, don't replace old queries

---

### STEP 5: Setup Monitoring (15 minutes)

**Monitor these metrics post-deployment:**

```sql
-- Error rate (target: <0.1%)
SELECT 
  COUNT(*) as total_queries,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as errors,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as error_rate
FROM query_logs
WHERE recorded_date >= NOW() - INTERVAL '1 hour';

-- RLS performance (target: <10% slower than baseline)
SELECT 
  query_type,
  AVG(execution_time_ms) as avg_time
FROM query_logs
WHERE recorded_date >= NOW() - INTERVAL '1 hour'
GROUP BY query_type;

-- Denormalization trigger (target: <50ms per like)
SELECT 
  COUNT(*) as total,
  AVG(execution_time_ms) as avg_time
FROM trigger_logs
WHERE trigger_name = 'trigger_update_likes_count'
  AND executed_at >= NOW() - INTERVAL '1 hour';
```

---

## 🎯 UI Enhancement Timeline (Optional - No Pressure!)

These are entirely optional and can be done anytime after deployment:

### When Ready (Month 2): Add GDPR UI
```typescript
// GDPR export button (optional)
const handleExport = async () => {
  const { data } = await supabase
    .rpc('gdpr_export_user_data', { target_user_id: userId });
  // Download as JSON file
};

// GDPR deletion button (optional)
const handleDelete = async () => {
  const { data } = await supabase
    .rpc('gdpr_request_user_deletion', { target_user_id: userId });
  // Show "Account marked for deletion" message
};
```

### When Ready (Month 2): Add Search Component
```typescript
// Search packages (optional)
const handleSearch = async (query) => {
  const { data } = await supabase
    .rpc('search_professional_packages', {
      search_query: query,
      v_limit: 20
    });
  // Display results with relevance ranking
};
```

### When Ready (Month 3): Optimize Dashboards
```typescript
// Use materialized view instead of complex JOINs (optional)
const { data } = await supabase
  .from('mv_coach_performance_stats')
  .select('*')
  .eq('coach_id', coachId);
// Much faster than current dashboard query
```

---

## ⏱️ Total Deployment Time

| Phase | Duration | Risk |
|-------|----------|------|
| Step 1 (RLS) | 20 min | Low |
| Step 2 (GDPR/Denorm/Search) | 20 min | Low |
| Step 3 (Verification) | 30 min | None |
| Step 4 (P3 features) | 30 min | Very Low |
| Step 5 (Monitoring) | 15 min | None |
| **TOTAL** | **~2 hours** | **LOW** |

---

## 🛑 Emergency Procedures

### If RLS Breaks Queries
```sql
-- Immediate rollback
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Then investigate which policy is too restrictive
```

### If Denormalization Breaks Inserts
```sql
-- Drop problematic trigger
DROP TRIGGER trigger_update_likes_count_insert ON package_likes;
-- Inserts will still work, likes_count won't auto-sync
```

### If Partitioning Causes Issues
```sql
-- Queries automatically work with or without partitions
-- Worst case: partition data is still accessible
```

### Full Database Restore
```sql
-- Restore from backup created at beginning
psql -h your-db.supabase.co -U postgres < backup.sql
```

---

## ✅ Post-Deployment Checklist

- [ ] All queries work without modification
- [ ] Error rate stable (<0.1%)
- [ ] Performance baseline established
- [ ] Monitoring alerts configured
- [ ] Team notified of safe deployment
- [ ] Rollback tested (but not needed!)
- [ ] Documentation updated
- [ ] Next steps assigned for UI enhancements (optional)

---

## 📝 Summary

**What Changed:**
- Database-enforced security (RLS)
- Auto-syncing denormalization (triggers)
- Optional new features (GDPR, search, soft delete, views)
- Faster queries (partitioning, materialization)

**What Didn't Change:**
- UI is identical
- Current queries work unchanged
- Performance is same or better
- No user-facing changes
- Existing functionality intact

**Why This is Safe:**
1. All changes are additive (nothing removed)
2. RLS is transparent (same queries, better security)
3. Denormalization is automatic (no code change)
4. Soft delete is optional (current DELETE still works)
5. Partitioning is invisible (queries unchanged)
6. Rollback is available if needed

---

**Status:** ✅ Ready for controlled, safe deployment  
**Next:** Inform team and schedule deployment window

**Questions?** Refer to implementation guides or contact DBA team.
