# Phase 2 Professional Directory - Issues & Risks Analysis & Mitigation

**Date:** 2026-02-09  
**Status:** Critical Review - Requires Action  
**Priority:** P0 (Blocking Issues), P1 (Important), P2 (Enhancement)

---

## Executive Summary

**Found Issues:** 9 critical / important items  
**Risk Level:** 🟠 MEDIUM-HIGH  
**Action Required:** Before Beta Release

| Category | Count | Severity |
|----------|-------|----------|
| 🔴 Navigation/UX | 2 | P0-P1 |
| 🔴 Data Consistency | 2 | P0 |
| 🔴 Security/Privacy | 2 | P0 |
| 🔴 Error Handling | 3 | P1-P2 |
| **Total** | **9** | - |

---

# 🔴 CRITICAL ISSUES (P0 - Must Fix Before Release)

---

## Issue 1: Ambiguous Entry Points

**Problem:**
```
SelectCoachNative can navigate to EITHER:
├─ SearchCriteria (filter first)
└─ FindCoaches (browse all)

This creates inconsistent UX:
- User may reach SearchResults via path A or path B
- Different filter states
- Lost context/history
```

**Risk:**
- Users get different experiences unpredictably
- Hard to debug which path was taken
- Bookmark-ability breaks
- Analytics fragmented

**Current State:**
```tsx
// Line in SelectCoachNative (AMBIGUOUS):
navigation.navigate('SearchCriteria');  // Path A
// OR
navigation.navigate('FindCoaches');     // Path B
```

**✅ SOLUTION: Single Canonical Path**

```tsx
// ENFORCE: SelectCoachNative → FindCoachesNative ONLY
// (User can apply filters inside FindCoaches if they want)

// Update SelectCoachNative.tsx:
const handleFindProfessionals = () => {
  navigation.navigate('FindCoaches', {
    source: 'SelectCoach',  // Track where we came from
    autoOpenFilters: true,  // Optional: open filters sheet
  });
};
```

**Implementation in FindCoachesNative:**
```tsx
// Detect source for analytics
const { source, autoOpenFilters } = route.params || {};
console.log('Navigated to FindCoaches from:', source); // Track path

// Auto-open filters if coming from SelectCoach
useEffect(() => {
  if (autoOpenFilters) {
    setShowFilterSheet(true);
  }
}, []);
```

**Rationale:**
- Single entry point = consistent UX
- Track source for analytics
- Optional: auto-open filters to guide user
- Later can add alternate paths documented explicitly

**Decision Tree:**
```
SelectCoachNative
    ↓
    └─→ FindCoaches (ONLY path)
        ├─→ Apply filters internally
        ├─→ Search (if filters applied)
        └─→ SearchResults
            └─→ ProfessionalDetail
```

---

## Issue 2: Modal vs Screen Inconsistency

**Problem:**
```
Document shows screens for everything:
├─ SelectCoachNative (screen)
├─ FindCoachesNative (screen)
├─ SearchResultsNative (screen)
└─ ProfessionalDetailNative (screen)

But some code uses modals:
├─ Write Review modal
├─ Book Session modal
├─ Filter sheet modal
└─ Subscribe modal

Inconsistent pattern = confusion for developers
```

**Risk:**
- Duplicate overlays/confusion in codebase
- Hard to know when to add screen vs modal
- Inconsistent navigation stack
- Testing complexity

**✅ SOLUTION: Explicit Pattern Document**

Create rule: **screens for primary flows, modals for secondary interactions**

```tsx
// PRIMARY FLOWS (Use Screens):
// - SelectCoach → FindCoaches → SearchResults → ProfessionalDetail
// - These are full-page navigation

// SECONDARY INTERACTIONS (Use Modals):
// - Write Review (modal over Detail screen)
// - Book Session (modal or bottom sheet)
// - Filter options (bottom sheet)
// - Subscribe confirmation (modal)

// KEY: Don't navigate.navigate() for these - just setState() + Modal
```

**Add to codebase as rule:**

```tsx
// src/config/NAVIGATION_PATTERNS.ts
export const NAVIGATION_PATTERNS = {
  PRIMARY_SCREENS: [
    'SelectCoach',
    'FindCoaches',
    'SearchResults',
    'ProfessionalDetail',
    'Booking',
    'Invoice',
  ],
  
  MODAL_INTERACTIONS: [
    'WriteReview',      // Shows over ProfessionalDetail
    'BookSession',      // Shows over ProfessionalDetail
    'ConfirmPurchase',  // Shows over Booking
    'FilterOptions',    // Shows over FindCoaches (bottom sheet)
  ],
  
  RULE: 'Modals are useState, Screens are navigation.navigate()',
};
```

**Example implementation:**
```tsx
// ✅ CORRECT: Write Review (modal)
const [reviewModalVisible, setReviewModalVisible] = useState(false);

// NOT: navigation.navigate('WriteReview')
// Instead: <Modal visible={reviewModalVisible}>

// ✅ CORRECT: Detail screen navigation
navigation.navigate('ProfessionalDetail', { professionalId });
```

---

## Issue 3: Route Param Contract Not Versioned

**Problem:**
```tsx
// Current: Pass raw professional object
navigation.navigate('ProfessionalDetail', {
  professionalId: 'uuid',
  professional: {                    // ← Raw object, no schema
    professional_id: string,
    name: string,
    rating: number | null,
    price: number,
    specialties: string[],
    mode: string[],
    distance_km: number,
    match_score: number,
    photo_url?: string,
    // ... what if we add/remove fields? 💥
  }
});

RISK: If professional object schema changes:
- Detail screen expects old fields → crashes
- No type safety across navigation
- Hard to track breaking changes
```

**Risk:**
- Runtime crashes if field missing
- Silent data loss if field removed
- No versioning strategy
- Tight coupling between screens

**✅ SOLUTION: Typed Navigation Contract DTOs**

Create strict DTOs for route params:

```tsx
// src/types/navigation.ts
import { z } from 'zod';

// Version 1: Professional detail route params
export const ProfessionalDetailParamsV1 = z.object({
  professionalId: z.string().uuid('Invalid professional ID'),
  professional: z.object({
    professional_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    rating: z.number().min(0).max(5).nullable(),
    review_count: z.number().nonnegative(),
    specialties: z.array(z.string()),
    mode: z.array(z.string()),
    distance_km: z.number().nonnegative(),
    match_score: z.number().min(0).max(100),
    photo_url: z.string().url().optional(),
  }).strict(), // ← Strict: no extra fields allowed
});

export type ProfessionalDetailParams = z.infer<typeof ProfessionalDetailParamsV1>;
```

**Usage in SearchResultsNative:**
```tsx
// Safe navigation with type validation
const handlePressCard = (professional: Professional) => {
  const params = {
    professionalId: professional.professional_id,
    professional: {
      professional_id: professional.professional_id,
      name: professional.name,
      description: professional.description,
      price: professional.price,
      rating: professional.rating,
      review_count: professional.review_count,
      specialties: professional.specialties,
      mode: professional.mode,
      distance_km: professional.distance_km,
      match_score: professional.match_score,
      photo_url: professional.photo_url,
    }
  };
  
  // Validate params match contract
  const validation = ProfessionalDetailParamsV1.safeParse(params);
  if (!validation.success) {
    console.error('Invalid params:', validation.error);
    Toast.show('Navigation error', { duration: Toast.durations.SHORT });
    return;
  }
  
  navigation.navigate('ProfessionalDetail', params);
};
```

**Usage in ProfessionalDetailNative:**
```tsx
// Strict type safety
const route_params = ProfessionalDetailParamsV1.parse(route.params);
const { professionalId, professional: passedProfessional } = route_params;
// Now TypeScript knows exact shape, no 'any' casting needed
```

**Future versioning (if breaking change):**
```tsx
// src/types/navigation.ts (future)
export const ProfessionalDetailParamsV2 = z.object({
  professionalId: z.string().uuid(),
  professional: z.object({
    // ... same fields ...
    availability_status: z.enum(['available', 'booked', 'unavailable']), // NEW
  }).strict(),
});

// Migration handler at navigation target:
const handleNavigation = (params: any) => {
  try {
    // Try V2 first
    return ProfessionalDetailParamsV2.parse(params);
  } catch {
    // Fall back to V1 with migration
    const v1 = ProfessionalDetailParamsV1.parse(params);
    return {
      ...v1,
      professional: {
        ...v1.professional,
        availability_status: 'available', // Default
      }
    };
  }
};
```

---

## Issue 4: Null/Absent Data Handling Not Documented

**Problem:**
```tsx
// Current fallback is simplistic:
const [professional, setProfessional] = useState<Professional | null>(
  passedProfessional || null
);

// But what if:
- passedProfessional is stale (loaded 5 mins ago)?
- Price changed since SearchResults?
- Professional is no longer available?
- Data is partially null/missing?
```

**Risk:**
- User sees outdated pricing/availability
- Booking with wrong data
- Silent failures
- Poor UX (stale data shown)

**✅ SOLUTION: Smart Data Merge Strategy**

```tsx
// src/types/phase2.ts
export type DataFreshness = 'fresh' | 'stale' | 'missing';

export interface ProfessionalWithMeta {
  data: Professional;
  freshness: DataFreshness;
  fetchedAt: Date;
  shouldRefresh: boolean; // true if > 5 mins old
}
```

**Implementation in ProfessionalDetailNative:**

```tsx
const [professional, setProfessional] = useState<Professional | null>(
  passedProfessional || null
);
const [dataFreshness, setDataFreshness] = useState<DataFreshness>(
  passedProfessional ? 'stale' : 'missing'
);
const [loading, setLoading] = useState(!passedProfessional);

useEffect(() => {
  const shouldFetch = !professional || dataFreshness === 'stale';
  
  if (shouldFetch) {
    fetchLatestData();
  }
}, []);

const fetchLatestData = async () => {
  try {
    setLoading(true);
    
    // Fetch FULL details (not just passed object)
    const { data, error } = await supabaseClient
      .from('professional_packages')
      .select(`
        *,
        professional_review_stats(*),
        professional_languages(*)
      `)
      .eq('id', professionalId)
      .single();

    if (error) throw error;

    // Merge passed data with fresh data
    const merged = mergeDataWithPriority(passedProfessional, data);
    setProfessional(merged);
    setDataFreshness('fresh');
    
  } catch (err) {
    console.error('Error fetching latest data:', err);
    
    // Fallback: use passed data if available
    if (passedProfessional) {
      setDataFreshness('stale');
      Toast.show('Using cached data', { duration: Toast.durations.SHORT });
    } else {
      setDataFreshness('missing');
      Toast.show('Failed to load professional', { duration: Toast.durations.SHORT });
    }
  } finally {
    setLoading(false);
  }
};

// Smart merge: use fresh data when available, fill gaps with passed data
const mergeDataWithPriority = (passed: Professional, fresh: Professional) => {
  return {
    ...passed,           // Start with passed (which has match_score, distance from search)
    ...fresh,            // Override with fresh data
    // But preserve search context:
    match_score: passed?.match_score ?? fresh.match_score,
    distance_km: passed?.distance_km ?? fresh.distance_km,
  };
};
```

**UI indicators:**
```tsx
// Show user data freshness
{dataFreshness === 'stale' && (
  <View style={styles.staleBanner}>
    <MaterialIcons name="info" size={16} color="#FF9800" />
    <Text style={styles.staleBannerText}>Data may be out of date</Text>
  </View>
)}

{dataFreshness === 'missing' && (
  <View style={styles.errorBanner}>
    <Text style={styles.errorBannerText}>Unable to load full profile</Text>
    <TouchableOpacity onPress={fetchLatestData}>
      <Text style={styles.retryLink}>Retry</Text>
    </TouchableOpacity>
  </View>
)}
```

---

# 🔴 SECURITY & PRIVACY ISSUES (P0 - Must Fix)

---

## Issue 5: RLS Enforcement Not Documented

**Problem:**
```
search_professionals_by_goals() RPC returns data, but:
- What fields are filtered by RLS?
- Are contact details exposed to non-professionals?
- Are private notes visible?
- Is email/phone exposed?
```

**Risk:**
- Data exposure
- Privacy compliance (GDPR, local law)
- Unauthorized access to PII

**✅ SOLUTION: Explicit RLS Matrix**

Create documentation:

```
# RLS POLICY MATRIX FOR search_professionals_by_goals()

## Public Fields (Anyone can see):
- professional_id
- name
- description
- rating
- review_count
- specialties
- mode (online/in-person/hybrid)
- languages
- price
- distance_km
- match_score
- photo_url

## Professional-Only Fields (Only coach/professional can see):
- response_rate
- response_time_avg
- private_notes
- client_list
- earnings_ytd

## Sensitive - Never Include in RPC Result:
- email
- phone
- social_security_number
- payment_methods
- bank_account
- home_address (use location only)

## Implementation in RPC:
```

Add explicit SELECT in `search_professionals_by_goals()` SQL:

```sql
-- src/migrations/20260209000000_phase_2_foundation.sql
-- Update search function to explicitly select safe fields
CREATE OR REPLACE FUNCTION public.search_professionals_by_goals(...)
RETURNS TABLE (
  -- SAFE: Public fields
  professional_id UUID,
  owner_user_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  specialties TEXT[],
  mode TEXT[],
  distance_km NUMERIC,
  match_score INT,
  -- Removed: no PII fields
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pp.owner_user_id,
    pp.name,
    pp.description,
    pp.price,
    pp.rating,
    pp.review_count,
    pp.specialties,
    pp.mode,
    ROUND(ST_Distance(...)) as distance_km,
    match_score
    -- Deliberately NOT selecting: email, phone, private_notes, etc.
  FROM professional_packages pp
  -- ... rest of query ...
END;
```

**RLS Policy in professional_packages:**

```sql
-- Ensure email/phone not exposed via RPC
CREATE POLICY professional_packages_rpc_safe
ON professional_packages
FOR SELECT
USING (
  -- Public can see basic info
  visibility = 'public'
  AND status = 'active'
)
WITH (SELECT
  -- Never expose: email, phone, private_notes
  -- These should only be accessible via separate authenticated endpoints
);
```

---

## Issue 6: PII in Route Params

**Problem:**
```tsx
// Current approach passes full object
navigation.navigate('ProfessionalDetail', {
  professional: {
    name: 'John Doe',
    email: 'john@example.com',        // ← Exposed in memory
    phone: '+1-555-0100',             // ← Could be logged
    private_notes: 'VIP client',      // ← In navigation history
    // ...
  }
});

RISK:
- Data in memory/history could be logged
- Android back stack visible
- Dev tools can inspect
- Screen recording captures it
```

**Risk:**
- PII exposure in logs
- Shoulder surfing
- Device compromise

**✅ SOLUTION: Route by ID Only, Fetch Securely**

```tsx
// BEFORE (risky)
navigation.navigate('ProfessionalDetail', {
  professional: {
    name: 'John',
    email: 'john@example.com',  // ← DON'T PASS
    phone: '+1-555-0100',       // ← DON'T PASS
  }
});

// AFTER (secure)
navigation.navigate('ProfessionalDetail', {
  professionalId: 'uuid-only',  // ← Just ID
  // Don't pass sensitive fields in route
});
```

**Fetch sensitive data in-screen:**

```tsx
// ProfessionalDetailNative.tsx
const { professionalId } = route.params;

// Fetch full data with RLS enforcement
useEffect(() => {
  const fetchProfessional = async () => {
    const { data, error } = await supabaseClient
      .from('professional_packages')
      .select('*')  // RLS filters what's safe
      .eq('id', professionalId)
      .single();
    
    if (error) {
      // RLS blocked access = user not authorized
      console.error('Unauthorized access');
      return;
    }
    
    setProfessional(data);  // Safe: RLS already filtered
  };
  
  fetchProfessional();
}, [professionalId]);
```

**Rationale:**
- Only ID in route params
- Sensitive fields fetched securely inside component
- RLS enforces access control
- Memory safer (no PII in navigation stack)

---

# 🟠 IMPORTANT ISSUES (P1)

---

## Issue 7: Location Missing - No Graceful Fallback

**Problem:**
```sql
-- In search_professionals_by_goals():
IF v_user_location IS NULL THEN
  RAISE EXCEPTION 'User profile not found or location not set';
END IF;

RESULT: If user never set location → 500 error, no search possible
```

**Risk:**
- Unusable feature for users without location
- Bad error message
- No guidance on how to fix

**✅ SOLUTION: Graceful Fallback**

**Option A: Allow search without location**

```sql
-- Updated RPC
CREATE OR REPLACE FUNCTION public.search_professionals_by_goals(
  ...
  p_radius_km NUMERIC DEFAULT NULL,  -- Optional now
  ...
) AS $$
BEGIN
  SELECT location_geo INTO v_user_location
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- If location missing, search nationwide (no distance filter)
  -- If location available, use distance filter
  
  RETURN QUERY
  SELECT
    -- ...
    CASE 
      WHEN v_user_location IS NULL THEN NULL
      ELSE ROUND(ST_Distance(...))
    END as distance_km,
    -- ...
  FROM professional_packages pp
  WHERE
    -- ... other filters ...
    AND (
      v_user_location IS NULL  -- Allow nationwide search
      OR ST_Distance(...) / 1000.0 <= COALESCE(p_radius_km, 999999)  -- Or distance filter
    )
  ORDER BY match_score DESC;
END;
```

**Option B: Prompt user to set location**

```tsx
// FindCoachesNative.tsx
const [userLocation, setUserLocation] = useState<Location | null>(null);

useEffect(() => {
  const checkLocation = async () => {
    const profile = await supabaseClient
      .from('user_profiles')
      .select('location_geo')
      .single();
    
    if (!profile.location_geo) {
      // Show prompt
      setShowLocationPrompt(true);
    } else {
      setUserLocation(profile.location_geo);
    }
  };
  
  checkLocation();
}, []);

// If no location:
{showLocationPrompt && (
  <View style={styles.locationBanner}>
    <Text style={styles.locationBannerText}>
      Enable location to find professionals near you
    </Text>
    <TouchableOpacity 
      style={styles.enableLocationButton}
      onPress={() => navigation.navigate('Settings.UpdateLocation')}
    >
      <Text style={styles.enableLocationButtonText}>Set Location</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => {
        setShowLocationPrompt(false);
        // Continue search nationwide
      }}
    >
      <Text style={styles.skipButton}>Skip</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## Issue 8: Empty Results - No Alternative Suggestions

**Problem:**
```
SearchResults returns 0 matches
Current UX: "No professionals found. Adjust your filters."

Better UX: Suggest alternatives without requiring user action
```

**Risk:**
- User frustrated, abandons
- No suggestions for fixing
- Lost opportunity to convert

**✅ SOLUTION: Intelligent Alternatives**

```tsx
// SearchResultsNative.tsx
const handleEmptyResults = async () => {
  // Suggest alternatives in order:
  const alternatives = [
    // 1. Same goals, broader distance
    await search({ ...currentFilters, radiusKm: radiusKm * 2 }),
    
    // 2. Popular professionals (any goal)
    await searchPopular(),
    
    // 3. Relax all filters
    await searchRelaxed(),
  ];
  
  // Show first non-empty alternative
  const suggestion = alternatives.find(alt => alt.length > 0);
  
  if (suggestion) {
    setResults(suggestion);
    showSuggestionBanner(suggestion.reason);
  } else {
    showNothingFoundMessage();
  }
};

// UI
if (results.length === 0) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={48} color="#CCC" />
      <Text style={styles.emptyTitle}>No professionals found</Text>
      
      {suggestions && suggestions.length > 0 ? (
        <>
          <Text style={styles.emptySubtitle}>
            {suggestions.reason || 'Try these alternatives:'}
          </Text>
          <FlatList
            data={suggestions}
            renderItem={({ item }) => <ProfessionalCard {...item} />}
            keyExtractor={(item) => item.professional_id}
          />
        </>
      ) : (
        <>
          <Text style={styles.emptySubtitle}>Broaden your search or try different goals</Text>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.adjustButtonText}>Adjust Filters</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
```

---

## Issue 9: Multi-Select Criteria Semantics Unclear

**Problem:**
```
If user selects: ["Weight Loss", "Muscle Gain"]

Does search return professionals who offer:
A) BOTH (AND logic)     - Narrowest results, may be 0
B) EITHER (OR logic)    - Broadest results
C) BEST MATCH (weighted) - Scored by overlap

Current code is unclear.
```

**Risk:**
- Unexpected results
- Users confused why they don't see certain professionals
- Different implementations in different places

**✅ SOLUTION: Explicit AND/OR Toggle**

```tsx
// FindCoachesNative.tsx
const [matchLogic, setMatchLogic] = useState<'AND' | 'OR' | 'ANY'>('OR');

// UI: Toggle visible to user
<View style={styles.matchLogicToggle}>
  <Text style={styles.matchLogicLabel}>Match:</Text>
  <TouchableOpacity 
    style={[styles.toggle, matchLogic === 'AND' && styles.toggleActive]}
    onPress={() => setMatchLogic('AND')}
  >
    <Text>All selected</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={[styles.toggle, matchLogic === 'OR' && styles.toggleActive]}
    onPress={() => setMatchLogic('OR')}
  >
    <Text>Any selected</Text>
  </TouchableOpacity>
</View>
```

**Pass to RPC:**
```tsx
const { data } = await supabaseClient.rpc('search_professionals_by_goals', {
  p_goal_categories: selectedGoals,
  p_match_logic: matchLogic,  // Pass it
  // ...
});
```

**Document in RPC:**
```sql
-- In search_professionals_by_goals() function:
-- @param p_match_logic: 'AND' (all specialties), 'OR' (any specialty), 'ANY' (different scoring)

CASE 
  WHEN p_match_logic = 'AND' THEN
    -- Professional must have ALL selected specialties
    (SELECT COUNT(*) FROM UNNEST(p_goal_categories) cat 
     WHERE pp.specialties @> ARRAY[cat]) = array_length(p_goal_categories, 1)
    
  WHEN p_match_logic = 'OR' THEN
    -- Professional must have ANY selected specialty
    pp.specialties && p_goal_categories::TEXT[]
    
  WHEN p_match_logic = 'ANY' THEN
    -- No restriction, just score by overlap (default)
    TRUE
END
```

---

# 📋 Summary: Issues & Recommended Actions

| # | Issue | Category | Severity | Effort | Solution |
|---|-------|----------|----------|--------|----------|
| 1 | Ambiguous entry points | UX | P0 | Small | Single canonical path |
| 2 | Modal vs screen inconsistency | Architecture | P0 | Small | Document pattern rule |
| 3 | Route param contract unversioned | Data | P0 | Medium | Add Zod DTOs + versioning |
| 4 | Null/absent data handling | Data | P0 | Medium | Smart merge + freshness indicator |
| 5 | RLS enforcement not documented | Security | P0 | Small | Create RLS matrix |
| 6 | PII in route params | Security | P0 | Small | Route by ID only |
| 7 | Location missing - no fallback | UX | P1 | Medium | Nationwide search fallback |
| 8 | Empty results - no suggestions | UX | P1 | Medium | Intelligent alternatives |
| 9 | Criteria semantics unclear | UX | P1 | Small | AND/OR toggle + document |

---

# 🚀 Priority Implementation Plan

## Phase 1: Critical (Complete before beta)
```
Week 1:
□ Issue 1: Fix ambiguous entry points
□ Issue 2: Document modal vs screen pattern
□ Issue 5: Create RLS security matrix
□ Issue 6: Remove PII from route params

Week 2:
□ Issue 3: Add Zod DTOs for route params
□ Issue 4: Implement data merge strategy
□ Issue 9: Add AND/OR toggle for criteria
```

## Phase 2: Important (Complete before launch)
```
Week 3:
□ Issue 7: Add location fallback
□ Issue 8: Implement intelligent suggestions
□ Testing: Full flow testing with all fixes
```

---

# ✅ Acceptance Criteria

### Issue 1 Resolved ✓
- [ ] SelectCoachNative navigates to FindCoaches only
- [ ] Route includes `source` field
- [ ] Analytics track the path
- [ ] No SearchCriteria intermediate path

### Issue 2 Resolved ✓
- [ ] NAVIGATION_PATTERNS.ts created
- [ ] All screens use screens (nav.navigate)
- [ ] All secondary interactions use modals (useState + Modal)
- [ ] No hybrid approaches

### Issue 3 Resolved ✓
- [ ] ProfessionalDetailParams Zod schema created
- [ ] SearchResultsNative validates before navigation
- [ ] Type errors caught at compile time
- [ ] Versioning strategy documented

### Issue 4 Resolved ✓
- [ ] DataFreshness type defined
- [ ] Smart merge algorithm implemented
- [ ] Stale data banner displayed
- [ ] Re-fetch logic works on data > 5 mins old

### Issue 5 Resolved ✓
- [ ] RLS security matrix documented
- [ ] Approved fields explicit in SELECT
- [ ] PII fields explicitly excluded from RPC
- [ ] Policy compliance checkable in code

### Issue 6 Resolved ✓
- [ ] Route params contain ID only
- [ ] No PII passed in navigation
- [ ] Sensitive data fetched in-component
- [ ] RLS enforces access control

### Issue 7 Resolved ✓
- [ ] Location prompt shown if missing
- [ ] Nationwide search allowed without location
- [ ] User guided to set location
- [ ] Error message user-friendly

### Issue 8 Resolved ✓
- [ ] Empty results show suggestions
- [ ] Suggestions implement fallback search
- [ ] UX guides user to alternatives
- [ ] No dead ends

### Issue 9 Resolved ✓
- [ ] AND/OR toggle visible in UI
- [ ] Toggle passed to RPC
- [ ] RPC implements respective logic
- [ ] Default documented

---

# 📚 Documentation Updates Required

1. **PROFESSIONAL_SEARCH_INTEGRATION_FLOW.md**
   - Add single canonical path diagram
   - Add modal vs screen pattern
   - Add security section
   - Add error handling flows

2. **New file: NAVIGATION_PATTERNS.ts**
   - Central pattern documentation
   - Screen vs modal decisions
   - Type contracts

3. **New file: RLS_SECURITY_MATRIX.md**
   - Public vs private fields
   - Field access by role
   - Compliance notes

4. **New file: ERROR_HANDLING_GUIDE.md**
   - Location missing fallback
   - Empty results handling
   - Stale data recovery

---

**Document Version:** 1.0  
**Created:** 2026-02-09  
**Status:** Ready for developer review & implementation  
**Audience:** Engineering team before Phase 2 beta release
