# Professional Directory Navigation Flow - Visual Guide

**Understanding when ProfessionalDetailNative and SearchResultsNative are called**

---

## 📊 Navigation Flow Diagram - Canonical Path

```
┌─────────────────────────────────────────────────────────────────┐
│                     APP ENTRY POINT                             │
│                   (App.tsx Router)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   SelectCoachNative.tsx            │
        │   (Selection/Home Screen)          │
        │   - Choose fitness goals           │
        │   - Choose lifestyle preferences   │
        │   - Choose pricing tier            │
        │   - Mock data-based UI             │
        │   - source: 'SelectCoach' tracking │
        └────────────────┬───────────────────┘
                         │
                    [CANONICAL PATH]
                    ┌────┴────┐
                    │ (NOT:    │
                    │Search   │
                    │Criteria)│
                    └─────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ FindCoachesNative.tsx              │
        │ (Professional Directory - ONLY)    │
        │ - Show all professionals           │
        │ - Real Supabase query data         │
        │ - Filters applied INTERNALLY       │
        │   (don't bypass to intermediate)   │
        │ - Optional: autoOpenFilters=true   │
        └────────────────┬───────────────────┘
                         │
                   [User applies filters
                    or searches inside
                    FindCoaches screen]
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  SearchResultsNative.tsx           │
        │  (Search Results Page)             │
        │  - Query search_professionals_by_  │
        │    goals() RPC function            │
        │  - Show 20+ matching professionals│
        │  - Ranked by match score           │
        │  - Card list with rank badges      │
        │  - "See Profile" button on card    │
        │  - Error: Handle 0 results gracefully
        │  - Fallback: Show alternatives     │
        └────────────────┬───────────────────┘
                         │
              [User clicks
               "See Profile"
               on a card]
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ ProfessionalDetailNative.tsx       │
        │ (Professional Detail/Profile Page) │
        │ - Receives: {professionalId, ...}  │
        │ - NO PII in route params          │
        │ - Fetches full data with RLS       │
        │ - Full profile with:               │
        │   • Avatar, rating, experience    │
        │   • Specialties, languages        │
        │   • Packages with features        │
        │   • Reviews (infinite scroll)     │
        │   • Write Review MODAL (not screen)
        │   • Book Session CTA              │
        └────────────────────────────────────┘
```

---

## 🔄 When Each Component is Called

### **1. SelectCoachNative.tsx - Entry Point**

**When:** App first loads, user opens the app

**Purpose:** 
- Display initial selection/onboarding screen
- Let user choose fitness goals (Weight Loss, Muscle Gain, etc.)
- Show mock coaches with packages
- Mock data only (hardcoded arrays)

**Navigation out:**
```tsx
// From SelectCoachNative → SearchCriteria or FindCoaches
navigation.navigate('SearchCriteria');
// OR
navigation.navigate('FindCoaches');
```

---

### **2. FindCoachesNative.tsx - Professional Directory**

**When:** User navigates from SelectCoachNative or clicks "Find Professionals"

**Purpose:**
- Display all available professionals
- Query Supabase using `useProfessionalSearch()` hook
- Show filters (goals, mode, languages, price range, distance)
- Filter sheet modal for advanced filtering
- Search header for text search

**Data Source:** 
```tsx
// Real data from Supabase
const { data: professionals } = useProfessionalSearch({
  goal_categories: filters.goalCategories,
  preferred_mode: filters.preferredMode,
  min_rating: filters.minRating,
  max_price: filters.maxPrice,
  radius_km: filters.radiusKm,
});
```

**Navigation out:**
```tsx
// From FindCoaches → SearchResults
// (Triggered when user applies filters or searches)
navigation.navigate('SearchResults', {
  selectedGoals: filters.goalCategories,
  filters: currentFilters
});
```

---

### **3. SearchResultsNative.tsx - Search Results Page**

**When:** User applies filters/searches in FindCoaches

**Purpose:**
- Display filtered list of professionals
- Call `search_professionals_by_goals()` RPC function with params
- Show results ranked by match score
- Display rank badges (#1, #2, #3)
- Show color-coded match quality (Green/Orange/Red)
- Pagination/infinite scroll for more results
- Log search interactions to analytics

**Data Flow:**
```tsx
// Receives from route params:
const { selectedGoals, filters } = route.params;

// Calls Supabase RPC:
const { data, error } = await supabaseClient.rpc(
  'search_professionals_by_goals',
  {
    p_user_id: userId,
    p_goal_categories: selectedGoals,
    p_preferred_mode: filters.preferredMode,
    p_min_rating: filters.minRating,
    p_max_price: filters.maxPrice,
    p_radius_km: filters.radiusKm,
    p_limit: 20
  }
);
```

**Each card shows:**
- Rank badge (#1, #2, #3)
- Photo
- Name, rating, review count
- Match score (Green/Orange/Red badge)
- Distance, price
- Service modes
- "See Profile" button

**Navigation out:**
```tsx
// Line 255: When user clicks "See Profile" button on a card
const handlePressCard = (professional: Professional) => {
  navigation.navigate('ProfessionalDetail', {
    professionalId: professional.professional_id,
    professional, // Pass entire object
  });
};
```

---

### **4. ProfessionalDetailNative.tsx - Professional Profile**

**When:** User clicks "See Profile" on SearchResultsNative card

**Purpose:**
- Display complete professional profile
- Show all details about selected professional
- Allow user to write reviews
- Show existing reviews with infinite scroll
- Display packages/pricing options
- "Book a Session" CTA button

**Data Flow:**
```tsx
// Receives from route params:
const { professionalId, professional: passedProfessional } = route.params;

// If professional data passed, use it (fast load)
// If not, fetch from Supabase:
const fetchProfessionalDetails = async () => {
  const { data } = await supabaseClient
    .from('professional_packages')
    .select('*')
    .eq('id', professionalId)
    .single();
  setProfessional(data);
};
```

**Displays:**
- Hero section (avatar, rating, experience, distance)
- Specialties as tags
- Service modes (Online, In-Person, Hybrid)
- Languages supported
- Package details (features, pricing)
- Reviews section with infinite scroll
- Write Review modal with form validation
- Book Session CTA button

---

## 📍 File Locations

| File | Location | Type | Data Source |
|------|----------|------|-------------|
| SelectCoachNative.tsx | `/src/screens/` | Onboarding | Mock data (hardcoded) |
| FindCoachesNative.tsx | `/src/screens/` | Directory | Supabase query |
| SearchResultsNative.tsx | `/src/screens/` | Results | Supabase RPC |
| ProfessionalDetailNative.tsx | `/src/screens/` | Profile | Supabase + params |

---

## 🔗 The Complete Journey

```
1️⃣  User launches app
    ↓
2️⃣  Sees SelectCoachNative (mock coaches shown)
    ↓
3️⃣  User wants to find REAL professionals
    ↓
4️⃣  Clicks "Find Professionals" 
    ↓
5️⃣  Navigates to FindCoachesNative
    ↓
6️⃣  Sets filters (e.g., "Weight Loss", "Online", "$0-50")
    ↓
7️⃣  Clicks "Search" or filter applies
    ↓
8️⃣  Navigates to SearchResultsNative
    ↓
9️⃣  Supabase returns 20+ professionals ranked by match
    ↓
🔟  User sees nice card list with rank badges + match scores
    ↓
1️⃣1️⃣  User clicks "See Profile" on a card
    ↓
1️⃣2️⃣  Navigates to ProfessionalDetailNative
    ↓
1️⃣3️⃣  Sees full profile, reviews, can book or write review
```

---

## 💾 Data Passing Between Screens

### **SearchCriteria → SearchResults**
```tsx
// What SearchCriteria passes:
navigation.navigate('SearchResults', {
  selectedGoals: ['weight_loss', 'nutrition_coaching'],  // Categories
  filters: {
    preferredMode: ['online'],
    minRating: 4,
    maxPrice: 5000,
    radiusKm: 10
  }
});
```

### **SearchResults → ProfessionalDetail**
```tsx
// What SearchResults passes:
navigation.navigate('ProfessionalDetail', {
  professionalId: 'uuid-123-abc',
  professional: {
    professional_id: 'uuid-123-abc',
    name: 'John Fitness',
    rating: 4.5,
    price: 60,
    specialties: ['Weight Loss', 'Strength'],
    // ... full object ...
  }
});
```

### **ProfessionalDetail receives:**
```tsx
const { professionalId, professional: passedProfessional } = route.params;

// If passedProfessional exists: use it immediately (fast)
// If not: fetch from Supabase using professionalId (slower)
```

---

## 🔍 Key Differences

| Aspect | SelectCoach | FindCoaches | SearchResults | ProfessionalDetail |
|--------|-------------|------------|---------------|--------------------|
| **Data** | Mock/hardcoded | Supabase query | RPC function | Supabase + params |
| **Purpose** | Onboarding | Browse all | Ranked results | Full profile |
| **Interaction** | Click coach | Set filters | Click card | View details |
| **Next Step** | → FindCoaches | → SearchResults | → Detail | → Book or review |
| **Real Data** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Ranking** | N/A | None | Yes (by score) | N/A |
| **Cards** | Large | Grid | List with badges | Single full page |

---

## 📊 SearchResults → Detail Data Flow

When user clicks card in SearchResults:

```
Card clicked
    ↓
handlePressCard(professional) called
    ↓
Log analytics to search_history table
    ↓
Pass to navigation:
  • professionalId (UUID)
  • professional object (entire card data)
    ↓
ProfessionalDetailNative receives via route.params
    ↓
Uses passed object if available (instant display)
    ↓
If professional object absent, queries Supabase for full data
    ↓
Display profile (hero → packages → reviews)
```

---

## ⚡ Performance Optimization

**SearchResults passes full professional object to Detail:**
```tsx
// SearchResults has the data from search query result
// Instead of just passing ID and making Detail re-query...
navigation.navigate('ProfessionalDetail', {
  professionalId: professional.professional_id,
  professional,  // ← Pass entire object! Speeds up Detail page load
});
```

**ProfessionalDetail uses passed data:**
```tsx
// Line 51-54 in ProfessionalDetailNative.tsx
const { professionalId, professional: passedProfessional } = route.params;
const [professional, setProfessional] = useState<Professional | null>(
  passedProfessional || null  // ← Pre-populate with passed data
);
```

**Result:** Hero section and package list display instantly, no blank state!

---

## 🎯 Summary

| Screen | Role | When | Data |
|--------|------|------|------|
| **SelectCoach** | Entry point / Onboarding | App load | Mock data |
| **FindCoaches** | Browse all professionals | User requests | Supabase query |
| **SearchResults** | Show ranked matches | User searches/filters | RPC function results |
| **ProfessionalDetail** | Full profile view | User clicks card | Route params + Supabase |

**Call chain:** SelectCoach → FindCoaches → SearchResults → ProfessionalDetail

---

## �️ Security & Privacy Considerations

### Route Params - Secure by Default

**Rule: Never pass PII in route params**

```tsx
// ❌ WRONG - PII exposure
navigation.navigate('ProfessionalDetail', {
  professional: {
    email: 'john@example.com',        // Exposed in memory/logs
    phone: '+1-555-0100',             // Could be screen-recorded
    password: 'hash',                 // Never!
  }
});

// ✅ CORRECT - ID only, fetch securely
navigation.navigate('ProfessionalDetail', {
  professionalId: 'uuid-123-abc',     // ID only in route
  // sensitive data fetched in-screen with RLS
});
```

### Data Freshness Strategy

**What fields pass from SearchResults:**

```tsx
// Safe to pass (non-sensitive, for display):
{
  professional_id: 'uuid',
  name: string,
  rating: number,
  review_count: number,
  specialties: string[],
  price: number,
  distance_km: number,
  match_score: number,
  photo_url?: string,
}

// NOT passed in route params:
// - email
// - phone  
// - private_notes
// - response_rate
// - bank_account
// - payment_methods
```

**ProfessionalDetail fetches full data inside component:**

```tsx
// Secure: Fetched inside component with RLS enforcement
const { data, error } = await supabaseClient
  .from('professional_packages')
  .select('*')  // RLS filters sensitive fields
  .eq('id', professionalId)
  .single();
// RLS policies determine what fields current user sees
```

### RLS Policy Enforcement

**professional_packages RLS:**
- Public users: See only approved, active, non-sensitive fields
- Professionals: See own full profile + private notes
- Admins: See all (with audit logging)

See [PHASE_2_ISSUES_AND_RISKS.md](PHASE_2_ISSUES_AND_RISKS.md#issue-5-rls-enforcement-not-documented) for RLS security matrix.

---

## ⚠️ Error Handling & Edge Cases

### 1. Location Missing - User Never Set Location

**Scenario:** User has no location set in profile

**Behavior:**
```tsx
// RPC normally throws: "User profile not found or location not set"
// Updated RPC allows nationwide search fallback

const { data, error } = await supabaseClient.rpc(
  'search_professionals_by_goals',
  {
    p_radius_km: null,  // Optional now
    // ... other params
  }
);

if (error?.code === 'NO_LOCATION') {
  // Show location prompt
  setShowLocationPrompt(true);
  // OR allow search nationwide
}
```

**UI Response:**
```
┌─────────────────────────────────┐
│ 📍 Set Your Location             │
│                                 │
│ Find professionals near you →   │
│ [Enable Location] [Skip]        │
└─────────────────────────────────┘
```

**Better UX:**
- Suggest location setting
- Allow nationwide search as fallback
- Show toggle: "Search by location" / "Search nationwide"

---

### 2. Empty Results - Zero Professionals Found

**Scenario:** User's filters too strict, 0 matches

**Behavior:**
```tsx
// SearchResults detects empty array
if (results.length === 0) {
  // Auto-suggest alternatives (in priority order):
  
  // 1. Same goals, doubled radius
  // 2. Any professional rated 4.5+
  // 3. Same specialties, relaxed mode/price
}
```

**UI Response:**
```
┌─────────────────────────────────┐
│ 🔍 No Professionals Found       │
│                                 │
│ ↓ Suggestions:                 │
│ • Expand to 20km (vs 10km)     │
│ • Show top-rated from anywhere  │
│ • Relax price to $0-100         │
│                                 │
│ [Adjust Filters] [View Popular] │
└─────────────────────────────────┘
```

---

### 3. Stale Data - SearchResults Data Changed

**Scenario:** Price/availability changed between SearchResults and Detail

**Behavior:**
```tsx
// ProfessionalDetail implements freshness check
const [dataFreshness, setDataFreshness] = useState<'fresh' | 'stale' | 'missing'>();

useEffect(() => {
  // Passed data is stale (from search 5 mins ago)
  if (passedProfessional && isOlderThan5Minutes(passedData)) {
    setDataFreshness('stale');
  }
  
  // Re-fetch fresh copy
  fetchLatestData();
}, []);
```

**UI Response:**
```
┌─────────────────────────────────┐
│ ⚠️ Data may be out of date       │
│                                 │
│ Price: $60 (last checked 10 min)│
│ Availability: Updating...       │
│ [Refresh Now]                   │
└─────────────────────────────────┘
```

---

### 4. Network Error - RPC Fails

**Scenario:** Network timeout or Supabase error

**Behavior:**
```tsx
// SearchResults.tsx
try {
  const { data, error } = await supabaseClient.rpc(
    'search_professionals_by_goals',
    { ... }
  );
  if (error) throw error;
  setResults(data);
} catch (err) {
  setError(err.message);
  // Retry with exponential backoff
}
```

**UI Response:**
```
┌─────────────────────────────────┐
│ ❌ Network Error                 │
│                                 │
│ Failed to load professionals.   │
│ [Retry] [Adjust Filters]        │
└─────────────────────────────────┘
```

---

### 5. Criteria Semantics - AND vs OR vs ANY

**Scenario:** User selects ["Weight Loss", "Muscle Gain"]

**Options:**

| Logic | Behavior | Example | Results |
|-------|----------|---------|---------|
| AND | Must have ALL selected specialties | Prof with both WL + MG | Narrow (few results) |
| OR | Must have ANY selected specialty | Prof with WL or MG | Broad (many results) |
| ANY | No restriction, scored by overlap | All profs scored by overlap | Medium + personalized |

**Current:** Default is ANY (scored), user can't change

**Recommended Fix:**
```tsx
// Add UI toggle
<View style={styles.matchLogicToggle}>
  <Text>Find professionals who offer:</Text>
  <SegmentedControl
    values={['All selected', 'Any selected']}
    selectedIndex={matchLogic === 'AND' ? 0 : 1}
    onChange={(index) => setMatchLogic(index === 0 ? 'AND' : 'OR')}
  />
</View>
```

**Pass to RPC:**
```tsx
const { data } = await supabaseClient.rpc('search_professionals_by_goals', {
  p_match_logic: matchLogic,  // 'AND', 'OR', or 'ANY'
  // ...
});
```

---

## 📋 Modal vs Screen Pattern

### Guidance

**Use SCREENS for primary navigation:**
- SelectCoachNative
- FindCoachesNative
- SearchResultsNative
- ProfessionalDetailNative

These appear in navigation stack, back button works.

**Use MODALS for secondary interactions:**
- Write Review (modal over ProfessionalDetail)
- Book Session (bottom sheet over ProfessionalDetail)
- Filter Options (bottom sheet over FindCoaches)
- Confirm Purchase (modal over Booking)

These are `useState` + `<Modal>`, NOT `navigation.navigate()`.

### Implementation Pattern

```tsx
// ✅ CORRECT: Screen navigation
navigation.navigate('ProfessionalDetail', { professionalId });

// ✅ CORRECT: Modal state
const [reviewModalVisible, setReviewModalVisible] = useState(false);
// NOT: navigation.navigate('WriteReview')
// Instead: <Modal visible={reviewModalVisible} onDismiss={() => setReviewModalVisible(false)}>
```

---

## 🚀 Comprehensive Testing Guide

### Happy Path Test (5 min)

```bash
# 1. Start server
npm run dev

# 2. App loads → SelectCoachNative appears
# 3. Click "Find Professionals" → FindCoachesNative
# 4. Set filters (e.g., Goal: Weight Loss, Mode: Online, Price: $0-50)
# 5. Click "Search" → SearchResultsNative (shows 20+ results with ranks, match scores)
# 6. Click "See Profile" on card #1 (#1 rank badge should be visible)
# 7. Verify instant load: Hero section displays immediately
# 8. Scroll reviews (should be infinite scroll)
# 9. Click "Write Review" button → Modal opens (not full screen)
# 10. Fill form, submit → Review appears in list
# 11. Click "Book Session" → Booking flow
# 12. Press back → Returns to SearchResults
```

### Error Cases Test (15 min)

```bash
# TEST 1: Empty Results
1. Start app → FindCoaches
2. Set filter: Goal: "Rare Goal" + Mode: "Specific Mode" (unlikely combo)
3. Click Search → SearchResults
4. Expected: Shows 0 results + suggestions card with alternatives
5. Verify: User can click suggestions to see popular professionals

# TEST 2: Location Missing
1. DB: Set user location_geo = NULL in Supabase
2. Start app → FindCoaches
3. Expected: Shows banner "Set location to search nearby"
4. Verify: User can click "Enable Location" or "Skip"
5. If skip: Search happens nationwide (no distance filtering)

# TEST 3: Network Error
1. Dev tools: Throttle network to offline
2. Start app → FindCoaches → set filters → Search
3. Expected: Error toast "Network error"
4. Verify: [Retry] button works when network restored

# TEST 4: Stale Data in Detail
1. SearchResults: Click card at TIME=T0
2. Wait 6 minutes
3. On ProfessionalDetail: Should see stale data banner
4. Verify: Fresh data fetched, merged correctly
5. Price/availability updated if changed
```

### Data Contract Test (10 min)

```bash
# TEST 1: Route params validation
1. Open browser console or React DevTools
2. Navigate from SearchResults to Detail
3. In route.params, verify:
   - professional_id: UUID format ✓
   - name: non-empty string ✓
   - rating: number or null ✓
   - NO email, phone, private_notes ✓

# TEST 2: Zod parsing
1. Add temporary Zod validation to ProfessionalDetailNative
2. Invalid params (missing fields) → Should throw error
3. Valid params → Should parse cleanly
4. Verify: TypeError visible in console if params invalid
```

### Security Test (10 min)

```bash
# TEST 1: RLS enforcement
1. As guest user:
   - Query /professional_packages → See only public, active fields
   - Query /professional_languages → See language list only
   - Email/phone/notes should NOT appear

2. As professional (owner):
   - Query own profile → Should see private_notes, response_rate
   - Query other professional → Should NOT see their email

# TEST 2: No PII in navigation
1. Start DetailNative
2. Check route.params → Contains ONLY: professionalId, ...
3. No email, phone, password, payment info visible
4. Console logs should NOT contain PII
```

---

## 📚 Related Documentation

- **[PHASE_2_ISSUES_AND_RISKS.md](PHASE_2_ISSUES_AND_RISKS.md)** - Comprehensive issues & solutions
  - Issue 1: Ambiguous entry points → **Solution:** Canonical path
  - Issue 2: Modal vs screen inconsistency → **Solution:** Pattern rules
  - Issue 3: Route param versioning → **Solution:** Zod DTOs
  - Issue 4: Null/stale data handling → **Solution:** Freshness strategy
  - Issue 5: RLS enforcement → **Solution:** Security matrix
  - Issue 6: PII in route params → **Solution:** ID-only routing
  - Issue 7: Location missing → **Solution:** Nationwide fallback
  - Issue 8: Empty results → **Solution:** Smart suggestions
  - Issue 9: Criteria semantics → **Solution:** AND/OR toggle

- **[PROFESSIONAL_DETAIL_TESTING_GUIDE.md](PROFESSIONAL_DETAIL_TESTING_GUIDE.md)** - 18 test scenarios
- **[PROFESSIONAL_DETAIL_QUICK_TEST.md](PROFESSIONAL_DETAIL_QUICK_TEST.md)** - Console commands

---

**Document Version:** 2.0 (Updated with security & error handling)  
**Created:** 2026-02-09  
**Updated:** 2026-02-09 (Issues & Risks Analysis incorporated)  
**Status:** Ready for implementation & testing  
**Next Step:** Review [PHASE_2_ISSUES_AND_RISKS.md](PHASE_2_ISSUES_AND_RISKS.md) before development
