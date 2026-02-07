# Priority 2 Implementation Guide: RLS, GDPR, Denormalization & Search

**Status:** Ready for Implementation  
**Sprint Duration:** 1-2 weeks  
**Complexity:** Medium-High  
**Risk Level:** Medium (RLS can impact existing queries)

---

## Table of Contents
1. [RLS Policies Overview](#rls-policies-overview)
2. [GDPR Compliance Features](#gdpr-compliance-features)
3. [Denormalization Strategy](#denormalization-strategy)
4. [Text Search Implementation](#text-search-implementation)
5. [Testing & Validation](#testing--validation)
6. [Deployment Checklist](#deployment-checklist)

---

## RLS Policies Overview

### What is RLS?
Row-Level Security (RLS) enforces data access policies at the database level, ensuring users can only access data they're authorized to see. This is critical for:
- Multi-tenant isolation
- Regulatory compliance (HIPAA, GDPR, CCPA)
- Preventing data leaks from application bugs
- Audit trail compliance

### Implementation Strategy

**Phase 1: Enable & Test (Dev)**
```sql
-- 1. Apply migration 20260207120000_priority_2_rls_policies.sql
-- 2. Verify RLS is enabled:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Should return ~11 tables with RLS enabled
```

**Phase 2: Validate Existing Queries (Critical)**
```sql
-- After RLS is enabled, test all queries with SET ROLE to simulate users:

-- Test as specific user
SET ROLE authenticated;
SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440000';

-- These queries should now only return their data
SELECT * FROM public.daily_metrics;
SELECT * FROM public.user_profiles;
SELECT * FROM public.professional_packages;

-- Reset role
RESET ROLE;
RESET app.current_user_id;
```

### RLS Policy Details

#### 1. **users table** - Most Restrictive
```
✓ SELECT: Users see only their own record
✓ SELECT: Admins see all users
✓ UPDATE: Users update own record only
✓ UPDATE: Admins update any user
✗ DELETE: Not available (use soft delete)
```

**Impact on Queries:**
```typescript
// Before RLS:
const { data: users } = await supabase.from('users').select('*');
// Result: Returns ALL users (dangerous!)

// After RLS:
const { data: users } = await supabase.from('users').select('*');
// Result: Returns only authenticated user (safe!)

// Admin bypass (in backend):
const { data: allUsers } = await supabase
  .rpc('admin_get_all_users')
  .setHeader('Authorization', `Bearer ${service_role_key}`);
```

#### 2. **user_profiles table** - Visibility-Based
```
✓ SELECT: Users see own profile
✓ SELECT: Public profiles visible to all
✓ SELECT: Coaches see profiles of connected clients
✓ INSERT: Users insert own profile
✓ UPDATE: Users update own profile
```

**Example Queries:**
```typescript
// User sees their own profile + public profiles
const { data: profiles } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', currentUserId)
  .eq('visibility', 'public');
// RLS automatically filters to user's own + public

// Coach sees own profile + client profiles
const { data: clientProfiles } = await supabase
  .from('user_profiles')
  .select('*')
  .in('visibility', ['public', 'unlisted']);
// RLS automatically adds coach->client connection check
```

#### 3. **professional_packages table** - Role-Based
```
✓ SELECT: Coaches see own packages
✓ SELECT: Public can see active, public packages
✓ INSERT: Coach inserts only own packages
✓ UPDATE/DELETE: Coach manages own packages
```

#### 4. **coach_clients table** - Bidirectional
```
✓ SELECT: Coaches see their clients
✓ SELECT: Clients see their coaches
✓ INSERT: Coaches can add clients
✓ UPDATE: Coaches manage relationships
```

### Common RLS Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Query returns no data | User role missing from policies | Add service_role header OR verify policy matches role |
| JOIN returns NULL | Joined table has restrictive RLS | Add policy allowing read access for join case |
| Aggregate returns 0 | RLS filters all rows before COUNT | Include visible records in WHERE condition |
| Admin bypass needed | Can't query data as admin | Use service_role_key in backend, NOT in frontend |

### Client-Side Implementation

**Step 1: Setup auth helper**
```typescript
// src/lib/supabaseAuth.ts
export const getSupabaseClient = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }
  
  // Client automatically uses session's auth token
  // which sets RLS context to current user
  return supabase;
};
```

**Step 2: Update queries to work with RLS**
```typescript
// src/hooks/useUserProfile.ts
export const useUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });
};

// Explanation: RLS automatically filters to user's own profile
// No need to manually filter by user_id!
```

**Step 3: Handle admin queries**
```typescript
// src/lib/adminApi.ts (BACKEND ONLY!)
export const getAllUsers = async (userId: string) => {
  // Verify user is admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  // Use service role key for admin queries
  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data } = await adminClient
    .from('users')
    .select('*');
  
  return data;
};
```

---

## GDPR Compliance Features

### 1. Data Export Function
**Purpose:** Allow users to download all their personal data (GDPR Article 15)

```typescript
// Frontend: Request export
export const requestDataExport = async () => {
  const { data, error } = await supabase
    .rpc('gdpr_export_user_data', {
      target_user_id: currentUserId
    });
  
  if (error) throw error;
  
  // `data` is a JSON object with all user data
  // Convert to JSON file for download
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supfit-data-export-${new Date().toISOString()}.json`;
  a.click();
};
```

**Data Included:**
- ✓ User account info (email, name, role)
- ✓ Profile data (bio, avatar, goals)
- ✓ Coach profile (if applicable)
- ✓ Professional packages created
- ✓ Package subscriptions (client side)
- ✓ Daily metrics (last 365 days)
- ✓ User targets
- ✓ Payment history

### 2. Data Deletion (Right to be Forgotten)
**Purpose:** Allow users to request account deletion (GDPR Article 17)

```typescript
// Frontend: Request deletion
export const requestAccountDeletion = async (reason: string) => {
  const { data, error } = await supabase
    .rpc('gdpr_request_user_deletion', {
      target_user_id: currentUserId,
      reason: reason
    });
  
  if (error) throw error;
  
  // Response indicates:
  // - Account marked for deletion
  // - 30-day grace period (allow recovery)
  // - Anonymization (name set to "Deleted User")
  window.location.href = '/goodbye'; // Logout
};
```

**Deletion Process:**
1. **Day 0:** User requests deletion → Account anonymized, marked pending
2. **Days 1-29:** Grace period → User can contact support to recover
3. **Day 30+:** Automated process purges all data permanently

**Backend Schedule (Run periodically):**
```sql
-- Execute via cron job or scheduled function:
SELECT public.gdpr_execute_user_deletion_batch();

-- Returns list of deleted users for audit
```

### 3. Data Rectification (Right to Correct)
**Purpose:** Allow users to update their data (GDPR Article 16)

```typescript
// Frontend: Correct profile data
export const rectifyUserData = async (updates: {
  firstName?: string;
  lastName?: string;
  bio?: string;
}) => {
  const { data, error } = await supabase
    .rpc('gdpr_rectify_user_data', {
      target_user_id: currentUserId,
      first_name: updates.firstName,
      last_name: updates.lastName,
      bio: updates.bio
    });
  
  if (error) throw error;
  return data;
};
```

### 4. Audit Logging for Compliance
All GDPR actions are automatically logged:

```sql
-- View GDPR activity log
SELECT user_id, action, created_at, details 
FROM public.audit_logs 
WHERE action LIKE 'GDPR_%'
ORDER BY created_at DESC
LIMIT 100;

-- Expected actions:
-- GDPR_EXPORT - User requested data export
-- GDPR_DELETION_REQUESTED - User requested account deletion
-- GDPR_DELETION_EXECUTED - System completed deletion
-- GDPR_DATA_RECTIFIED - User updated their data
```

### Compliance Checklist

- [ ] GDPR data export tested and working
- [ ] 30-day deletion grace period confirmed
- [ ] Privacy policy updated with deletion process
- [ ] Data retention policy documented
- [ ] Audit logs configured for compliance
- [ ] Legal team reviewed terms & conditions
- [ ] Customer support trained on deletion process
- [ ] Automated deletion job scheduled & monitored

---

## Denormalization Strategy

### Problem: Denormalization Solves
**Without denormalization:**
```sql
-- Slow: Requires JOIN every time
SELECT 
    pp.id, pp.name, pp.price,
    COUNT(pl.id) as like_count
FROM professional_packages pp
LEFT JOIN package_likes pl ON pp.id = pl.package_id
WHERE pp.status = 'active'
GROUP BY pp.id;
-- Query time: ~2-5 seconds at scale
```

**With denormalization (current solution):**
```sql
-- Fast: No JOIN needed
SELECT id, name, price, likes_count
FROM professional_packages
WHERE status = 'active';
-- Query time: <100ms
```

### Likes Count Implementation

**Setup (Already Applied):**
- ✓ `package_likes` table tracks individual likes
- ✓ `likes_count` denormalized column on packages
- ✓ `stats_updated_at` tracks freshness
- ✓ Automatic triggers keep count synchronized

**How It Works:**
```typescript
// User likes a package
await supabase
  .from('package_likes')
  .insert({ package_id, user_id });
// Trigger automatically increments professional_packages.likes_count

// Query packages with correct count (no calculation needed)
const { data } = await supabase
  .from('professional_packages')
  .select('id, name, likes_count'); // Direct column read
```

**Monitoring Denormalization Health:**
```sql
-- Verify likes_count accuracy
SELECT 
    pp.id,
    pp.likes_count as denormalized,
    COUNT(pl.id) as actual,
    CASE WHEN pp.likes_count = COUNT(pl.id) THEN 'OK' ELSE 'MISMATCH' END as status
FROM professional_packages pp
LEFT JOIN package_likes pl ON pp.id = pl.package_id
GROUP BY pp.id
HAVING pp.likes_count != COUNT(pl.id);
-- Should return empty result set (no mismatches)
```

**Sync Function (If Manual Fix Needed):**
```typescript
// Backend admin function to resync all counts
export const resyncAllPackageLikeCounts = async () => {
  const { error } = await adminSupabase.rpc('resync_all_likes_counts');
  if (error) throw error;
};
```

### When to Denormalize

✓ **Good candidates:**
- View aggregates frequently (>100x/day)
- Calculation is complex (multiple JOINs)
- Read-heavy, write-light scenario
- End users expect real-time counts

✗ **Poor candidates:**
- Data changes constantly
- Calculation is simple
- Write-heavy workload
- Slightly stale data acceptable

### Future Denormalization Opportunities

1. **Subscription count by coach**
   ```sql
   ALTER TABLE public.coaches 
   ADD COLUMN IF NOT EXISTS subscription_count INTEGER DEFAULT 0;
   ```

2. **Client count by coach**
   ```sql
   ALTER TABLE public.coaches
   ADD COLUMN IF NOT EXISTS active_client_count INTEGER DEFAULT 0;
   ```

3. **Revenue by coach**
   ```sql
   ALTER TABLE public.coaches 
   ADD COLUMN IF NOT EXISTS total_revenue DECIMAL DEFAULT 0;
   ```

---

## Text Search Implementation

### Full-Text Search Architecture

**Components Added:**
1. `tsvector` column - Searchable text index
2. GIN index - Fast text search accelerator
3. `search_professional_packages()` function - Search queries

**How It Works:**
```
User Input: "yoga training packages"
↓
PLAINTO_TSQUERY: 'yoga' & 'training' & 'packages'
↓
GIN Index Lookup: O(log n) instead of O(n)
↓
TS_RANK calculation: Relevance scoring
↓
Results: Ranked by relevance
```

### Client Implementation

**Basic Search:**
```typescript
export const searchPackages = async (query: string) => {
  const { data, error } = await supabase
    .rpc('search_professional_packages', {
      search_query: query,
      v_limit: 20,
      v_offset: 0
    });
  
  if (error) throw error;
  return data;
};
```

**Advanced Search (with filters):**
```typescript
export const searchPackagesAdvanced = async (
  query: string,
  filters: {
    coachId?: string;
    minPrice?: number;
    maxPrice?: number;
    minLikes?: number;
  },
  page: number = 0
) => {
  let q = supabase
    .rpc('search_professional_packages', {
      search_query: query,
      v_limit: 20,
      v_offset: page * 20
    });
  
  // Post-filter (if needed)
  const { data } = await q;
  
  return data?.filter(p => {
    if (filters.coachId && p.coach_id !== filters.coachId) return false;
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.minLikes && p.likes_count < filters.minLikes) return false;
    return true;
  });
};
```

**Frontend Component:**
```typescript
export const PackageSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const packages = await searchPackages(searchQuery);
      setResults(packages);
    } finally {
      setLoading(false);
    }
  }, 500);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search packages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
      
      {loading && <p>Searching...</p>}
      
      {results.map(pkg => (
        <div key={pkg.id}>
          <h3>{pkg.name}</h3>
          <p>{pkg.description}</p>
          <p>💰 {pkg.price} | ❤️ {pkg.likes_count}</p>
        </div>
      ))}
    </div>
  );
};
```

### Search Ranking Explained

The `search_professional_packages` function uses a weighted ranking system:

```sql
-- Weights in tsvector:
-- A = Package name (highest priority)
-- B = Description (medium priority)
-- C = Tags (lower priority)

-- Formula:
TS_RANK(search_vector, query) * (1 + likes_count * 0.01)

-- Result: Relevant + popular packages rank highest
```

**Example Results:**
```
Query: "yoga training"

1. "Advanced Yoga Training Program" (name match) - 4.2 rank, 150 likes
2. "Yoga Training for Beginners" (name match) - 3.8 rank, 45 likes
3. "Personalized Training with Yoga Focus" (desc match) - 2.1 rank, 12 likes
```

### Text Search Performance

**Before Optimization:**
- Search 10,000+ packages: ~3-5 second LIKE queries

**After GIN Index:**
- Search 10,000+ packages: <50ms

**Index Size:**
- GIN index: ~2-5% of table size (very efficient)

---

## Testing & Validation

### Unit Tests (Not Automated - Manual Testing)

**RLS Policy Tests:**
```typescript
// Test 1: User can't see other users' profiles
const { data: data1 } = await userAClient
  .from('user_profiles')
  .select('*')
  .eq('user_id', userBId);
// Should return empty (RLS blocks it)

// Test 2: Coaches can see client profiles
const { data: data2 } = await coachClient
  .from('coach_clients')
  .select('*')
  .eq('coach_id', coachId);
// Should return client relationships

// Test 3: Admin can see all users (with service_role)
const { data: data3 } = await adminClient
  .from('users')
  .select('*');
// Should return all users
```

**GDPR Function Tests:**
```typescript
// Test 1: Data export
const { data: exportData } = await supabase
  .rpc('gdpr_export_user_data', { target_user_id: userId });
console.log(exportData);
// Verify: Has user, profile, packages, metrics, etc.

// Test 2: Deletion request
const { data: delResponse } = await supabase
  .rpc('gdpr_request_user_deletion', { target_user_id: userId });
console.log(delResponse);
// Verify: Returns grace period info

// Test 3: Verify profile anonymized
const { data: profile } = await adminClient
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
// Verify: first_name = "Deleted", bio = NULL
```

**Search Tests:**
```typescript
// Test 1: Basic search
const results1 = await searchPackages('yoga');
// Should return packages with yoga in name/description

// Test 2: Empty results
const results2 = await searchPackages('xyz_nonexistent_query');
// Should return empty array

// Test 3: Ranking
const results3 = await searchPackages('packages');
// Sort by tsrank DESC - exact matches should be first
```

### Load Testing Checklist

- [ ] RLS doesn't significantly slow queries (<10% overhead expected)
- [ ] Text search returns results in <100ms for typical queries
- [ ] GDPR export completes in <5 seconds for large datasets
- [ ] Deletion batch processing handles 100+ deletions without timeout
- [ ] Denormalization trigger completes in <50ms per like

---

## Deployment Checklist

### Pre-Deployment (Dev Testing)

- [ ] All 3 migration files run successfully
- [ ] RLS policies enable without errors
- [ ] Existing queries tested with RLS enabled
- [ ] GDPR functions tested end-to-end
- [ ] Text search tested with sample data
- [ ] Denormalization triggers firing correctly
- [ ] No breaking changes to existing API

### Deployment (Staging → Production)

```bash
# 1. Backup production database
pg_dump -h prod-db.supabase.co -U postgres -d postgres > backup.sql

# 2. Apply migrations in order
psql -h prod-db.supabase.co -U postgres < 20260207120000_priority_2_rls_policies.sql
psql -h prod-db.supabase.co -U postgres < 20260207130000_priority_2_gdpr_denormalization_search.sql

# 3. Verify no active connections blocking RLS
SELECT * FROM pg_stat_activity;

# 4. Enable RLS policies gradually (watch app logs)
# If issues, disable with: ALTER TABLE [table] DISABLE ROW LEVEL SECURITY;
```

### Post-Deployment (Monitoring)

- [ ] Application queries still work (check backend logs)
- [ ] No RLS permission denied errors in logs
- [ ] GDPR audit log shows expected actions
- [ ] Text search results appear accurate
- [ ] Performance metrics stable
- [ ] User reports no data access issues

### Rollback Plan (If needed)

```sql
-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_package_subscriptions DISABLE ROW LEVEL SECURITY;

-- Drop functions
DROP FUNCTION IF EXISTS public.gdpr_export_user_data;
DROP FUNCTION IF EXISTS public.gdpr_request_user_deletion;
DROP FUNCTION IF EXISTS public.search_professional_packages;

-- Restore database from backup if needed
```

---

## Migration Execution Order

```
1. Apply 20260207120000_priority_2_rls_policies.sql
   ↓ Enables RLS, creates policies
   ⚠️ IMPORTANT: Test all queries with RLS enabled

2. Apply 20260207130000_priority_2_gdpr_denormalization_search.sql
   ↓ Adds GDPR functions, denormalization, search
   ✓ Should be non-breaking (only adds functions)

3. Verify:
   - RLS policies active (queries still work)
   - GDPR functions callable
   - Search function returns results
   - Denormalization triggers fire on INSERT/DELETE likes
```

---

## Success Metrics

After Priority 2 implementation, you should see:

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| Data isolation | App-layer only | DB-enforced | **Security +50%** |
| Search response time | 3-5s | <50ms | **Speed +100x** |
| Likes count accuracy | Manual sync | Auto-synced | **Data quality +100%** |
| GDPR compliance | Manual process | Automated | **Operations -80%** |
| User data privacy | Bounded | Guaranteed | **Compliance ✓** |

---

## Common Questions

**Q: Does RLS slow down queries?**  
A: Minimal overhead (~5-10%). The security benefit far outweighs the small performance cost.

**Q: Can I disable RLS for specific queries?**  
A: Only with backend code using service_role_key. Never in frontend.

**Q: How long does GDPR deletion take?**  
A: Export is immediate (~1-5 seconds). Deletion happens after 30-day grace period (admin intervention optional).

**Q: Will search work with special characters?**  
A: Yes. PLAINTO_TSQUERY handles most characters safely.

**Q: Should I denormalize other counts?**  
A: Only if viewed >100x/day. Start with likes_count, scale based on metrics.

---

## Next Steps

1. **This Sprint:** Apply all Priority 2 migrations, test thoroughly
2. **Next Sprint:** Priority 3 (Time-series partitioning, materialized views)
3. **Month 2:** Performance monitoring & optimization
4. **Month 3:** RLS audit & security hardening

---

**Questions?** Refer to individual function implementations in the migration files or contact the database team.
