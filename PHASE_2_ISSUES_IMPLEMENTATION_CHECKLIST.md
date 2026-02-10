# Phase 2 Issues & Risks - Implementation Checklist

**Status:** 🟠 Ready for Planning (9 Issues Identified)  
**Target:** Complete all before Beta Release  
**Last Updated:** 2026-02-09

---

## 📊 Quick Status Matrix

| Issue | Title | Priority | Status | Effort | Owner | Due |
|-------|-------|----------|--------|--------|-------|-----|
| #1 | Ambiguous entry points | P0 | 📋 Not Started | Small | - | Week 1 |
| #2 | Modal vs screen inconsistency | P0 | 📋 Not Started | Small | - | Week 1 |
| #3 | Route param contract unversioned | P0 | 📋 Not Started | Medium | - | Week 2 |
| #4 | Null/stale data handling | P0 | 📋 Not Started | Medium | - | Week 2 |
| #5 | RLS enforcement not documented | P0 | 📋 Not Started | Small | - | Week 1 |
| #6 | PII in route params | P0 | 📋 Not Started | Small | - | Week 1 |
| #7 | Location missing - no fallback | P1 | 📋 Not Started | Medium | - | Week 3 |
| #8 | Empty results - no suggestions | P1 | 📋 Not Started | Medium | - | Week 3 |
| #9 | Criteria semantics unclear | P1 | 📋 Not Started | Small | - | Week 2 |

---

# 🔴 CRITICAL ISSUES (P0)

## ✅ Issue #1: Ambiguous Entry Points

**Status:** 📋 Not Started

### Problem
SelectCoachNative can navigate to SearchCriteria OR FindCoaches, creating inconsistent UX.

### Solution
- [ ] Update SelectCoachNative to navigate ONLY to FindCoaches
- [ ] Add `source: 'SelectCoach'` to route params for tracking
- [ ] Remove SearchCriteria as intermediate path
- [ ] Update analytics tracking
- [ ] Document canonical path in NAVIGATION_PATTERNS.ts

### Testing
- [ ] SelectCoach → FindCoaches navigation works
- [ ] Navigation history shows single path
- [ ] Analytics tracks 'SelectCoach' source
- [ ] No SearchCriteria orphaned in codebase

### Files to Update
- [ ] src/screens/SelectCoachNative.tsx
- [ ] src/config/NAVIGATION_PATTERNS.ts (create)
- [ ] PROFESSIONAL_SEARCH_INTEGRATION_FLOW.md (updated ✅)

---

## ✅ Issue #2: Modal vs Screen Inconsistency

**Status:** 📋 Not Started

### Problem
Inconsistent use of screens vs modals in codebase - some flows use both, unclear which to use.

### Solution
- [ ] Create NAVIGATION_PATTERNS.ts with explicit rules
- [ ] Audit codebase for violations
- [ ] Convert any screen-based secondaries to modals
- [ ] Document pattern in README/WIKI

**Pattern Rules:**
- Screens: Primary navigation (SelectCoach → FindCoaches → SearchResults → Detail)
- Modals: Secondary interactions (Write Review, Book Session, Filters, Confirm)

### Testing
- [ ] Write Review shows as modal (visible={state}) - verified in Detail screen
- [ ] Book Session shows as bottom sheet - verified in Detail screen
- [ ] Filter options show as bottom sheet - verified in FindCoaches screen
- [ ] All interactions use correct pattern
- [ ] No mixed approaches

### Files to Update
- [ ] src/config/NAVIGATION_PATTERNS.ts (create) ← Contains pattern rules
- [ ] src/screens/ProfessionalDetailNative.tsx (audit)
- [ ] src/screens/FindCoachesNative.tsx (audit)
- [ ] src/screens/SearchResultsNative.tsx (audit)

---

## ✅ Issue #3: Route Param Contract Not Versioned

**Status:** 📋 Not Started

### Problem
Passing entire professional object without type validation; breaking changes not caught until runtime.

### Solution
- [ ] Create navigation DTO types with Zod
- [ ] Add strict validation before navigation
- [ ] Implement versioning strategy for future changes
- [ ] Add compile-time type safety

**Implementation:**
```tsx
// src/types/navigation.ts (create)
export const ProfessionalDetailParamsV1 = z.object({
  professionalId: z.string().uuid(),
  professional: z.object({
    professional_id: z.string().uuid(),
    name: z.string().min(1),
    price: z.number().positive(),
    // ... strict fields
  }).strict()
});
```

### Testing
- [ ] Zod schema validates correct params
- [ ] Zod rejects missing fields
- [ ] Navigation catches validation errors
- [ ] Type safety in ProfessionalDetailNative
- [ ] Future breaking changes caught at compile time

### Files to Update
- [ ] src/types/navigation.ts (create)
- [ ] src/screens/SearchResultsNative.tsx (add validation)
- [ ] src/screens/ProfessionalDetailNative.tsx (use strict types)

---

## ✅ Issue #4: Null/Absent Data Handling

**Status:** 📋 Not Started

### Problem
Passed professional data could be stale; no strategy for re-fetching or merging with fresh data.

### Solution
- [ ] Define DataFreshness type (fresh | stale | missing)
- [ ] Implement smart merge algorithm
- [ ] Show data freshness indicators to user
- [ ] Auto-refresh if data > 5 minutes old

**Implementation:**
```tsx
// ProfessionalDetailNative.tsx
const [dataFreshness, setDataFreshness] = useState<DataFreshness>('stale');

useEffect(() => {
  if (!professional || dataFreshness === 'stale') {
    fetchLatestData();
  }
}, []);

const mergeData = (passed, fresh) => ({
  ...passed,
  ...fresh,  // Override with fresh
  match_score: passed?.match_score ?? fresh.match_score,  // Preserve search context
});
```

### Testing
- [ ] Passed data displays immediately
- [ ] Fresh data fetches automatically
- [ ] Stale banner shows if > 5 mins
- [ ] Data merges correctly
- [ ] Price/availability updates reflected
- [ ] Stale data gracefully handled

### Files to Update
- [ ] src/types/phase2.ts (add DataFreshness)
- [ ] src/screens/ProfessionalDetailNative.tsx (implement merge)
- [ ] src/components/StaleBanner.tsx (create)

---

## ✅ Issue #5: RLS Enforcement Not Documented

**Status:** 📋 Not Started

### Problem
RLS policies exist but it's unclear which fields are safe for public consumption.

### Solution
- [ ] Create RLS_SECURITY_MATRIX.md
- [ ] Document public vs professional-only vs sensitive fields
- [ ] Audit search_professionals_by_goals() RPC return fields
- [ ] Verify email/phone never exposed
- [ ] Add code comments for field filtering

**Matrix to Create:**
```
| Field | Public | Professional | Admin |
|-------|--------|--------------|-------|
| name | ✅ | ✅ | ✅ |
| email | ❌ | ✅ (own) | ✅ |
| phone | ❌ | ✅ (own) | ✅ |
| private_notes | ❌ | ✅ (own) | ✅ |
```

### Testing
- [ ] As guest: Only public fields visible
- [ ] As professional: Can see own email/notes
- [ ] As professional: Cannot see other email/notes
- [ ] Admin queries show all fields
- [ ] RPC result never includes PII

### Files to Update
- [ ] RLS_SECURITY_MATRIX.md (create)
- [ ] supabase/migrations/20260209000000_phase_2_foundation.sql (audit comments)
- [ ] Documentation/RLS_GUIDE.md (update)

---

## ✅ Issue #6: PII in Route Params

**Status:** 📋 Not Started

### Problem
Passing sensitive fields (email, phone, notes) in navigation params exposes PII in memory/logs.

### Solution
- [ ] Remove PII from SearchResults navigation params
- [ ] Pass ID only to ProfessionalDetail
- [ ] Fetch sensitive data inside Detail screen with RLS
- [ ] Update navigation DTOs to exclude PII

**Before/After:**
```tsx
// ❌ BEFORE
navigation.navigate('ProfessionalDetail', {
  professional: { email, phone, private_notes, ... }
});

// ✅ AFTER
navigation.navigate('ProfessionalDetail', {
  professionalId: 'uuid',
});
```

### Testing
- [ ] route.params contains no email/phone/notes
- [ ] Data fetched securely inside Detail component
- [ ] RLS enforces access control
- [ ] No PII in console logs
- [ ] No PII in Android back stack

### Files to Update
- [ ] src/screens/SearchResultsNative.tsx (limit params)
- [ ] src/screens/ProfessionalDetailNative.tsx (fetch securely)
- [ ] src/types/navigation.ts (sanitize DTOs)

---

# 🟠 IMPORTANT ISSUES (P1)

## ✅ Issue #7: Location Missing - No Graceful Fallback

**Status:** 📋 Not Started

### Problem
If user's location is NULL, search_professionals_by_goals() throws error; no option to search nationwide.

### Solution
- [ ] Update RPC to allow optional radius parameter
- [ ] Modify RPC to allow nationwide search if location missing
- [ ] Add UI banner prompting location setting
- [ ] Add "Skip" button to allow nationwide search anyway
- [ ] Handle both flows gracefully

**Implementation:**
```sql
-- RPC updated to:
IF v_user_location IS NULL THEN
  -- Allow nationwide search (radius = NULL)
  -- OR prompt user to set location
END;
```

### Testing
- [ ] User with no location sees prompt
- [ ] "Enable Location" navigates to settings
- [ ] "Skip" allows nationwide search
- [ ] Search works without location
- [ ] Distance filter ignored if no location
- [ ] Results show rank + match score (no distance)

### Files to Update
- [ ] supabase/migrations/20260207160000_search_criteria_schema.sql (update RPC)
- [ ] src/screens/FindCoachesNative.tsx (add prompt)
- [ ] src/components/LocationPromptBanner.tsx (create)

---

## ✅ Issue #8: Empty Results - No Suggestions

**Status:** 📋 Not Started

### Problem
When search returns 0 results, user sees only "No professionals found"; no guidance on alternatives.

### Solution
- [ ] Detect 0 results in SearchResultsNative
- [ ] Automatically query alternatives in order:
  - [ ] Same goals, doubled radius
  - [ ] Top-rated (rating 4.5+) regardless of goal
  - [ ] Relaxed filters (any specialization)
- [ ] Show suggestions to user
- [ ] User can click suggestion to view

### UI:
```
No professionals found
↓ Suggestions:
• Expand to 20km (vs 10km) - 5 results
• Top-rated professionals - 12 results
• Broaden goals to include... - 8 results

[Adjust Filters] [View Popular]
```

### Testing
- [ ] 0 results triggers suggestions logic
- [ ] Suggestions appear in priority order
- [ ] User can click suggestion results
- [ ] Fallback displays non-zero count
- [ ] UX guides user without dead-end

### Files to Update
- [ ] src/screens/SearchResultsNative.tsx (add suggestion logic)
- [ ] src/components/Suggestions/EmptyStateCard.tsx (create)
- [ ] src/hooks/useSuggestionSearch.ts (create)

---

## ✅ Issue #9: Criteria Semantics Unclear

**Status:** 📋 Not Started

### Problem
Multi-select criteria (["Weight Loss", "Muscle Gain"]) unclear: AND vs OR vs ANY scoring?

### Solution
- [ ] Add UI toggle: "All selected" / "Any selected"
- [ ] Pass match_logic to RPC function
- [ ] Implement in RPC: AND / OR / ANY
- [ ] Document semantics clearly
- [ ] Show user selection active in UI

**UI Toggle:**
```tsx
<SegmentedControl
  values={['All selected', 'Any selected']}
  selectedIndex={matchLogic === 'AND' ? 0 : 1}
  onChange={(index) => setMatchLogic(index === 0 ? 'AND' : 'OR')}
/>
```

### Testing
- [ ] "All selected" shows only pros with ALL specialties
- [ ] "Any selected" shows pros with ANY specialty
- [ ] Toggle persists across searches
- [ ] RPC logic matches selection
- [ ] Results quality appropriate to mode
- [ ] User understands effect of toggle

### Files to Update
- [ ] src/screens/FindCoachesNative.tsx (add toggle)
- [ ] supabase/migrations/20260207160000_search_criteria_schema.sql (update RPC logic)
- [ ] PROFESSIONAL_SEARCH_INTEGRATION_FLOW.md (updated with explanation ✅)

---

# 📋 Phase 1: Week 1 Sprint (Critical)

**Goal:** Fix P0 issues - single entry point, clear patterns, security primitives

```
Monday:
□ Issue #1: Implement canonical SelectCoach → FindCoaches path (2h)
□ Issue #5: Create RLS_SECURITY_MATRIX.md (1h)

Tuesday:
□ Issue #2: Create NAVIGATION_PATTERNS.ts (2h)
□ Issue #6: Update navigation params to remove PII (2h)

Wednesday:
□ Issue #1-2: Testing & verification (2h)
□ Issue #5-6: Security audit of routes (1h)

Thursday:
□ Issue #3: Create Zod DTO types (3h)
□ Issue #3: Add validation to SearchResults (1h)

Friday:
□ Code review: All P0 issues (2h)
□ Deploy: Week 1 fixes to staging (1h)
```

---

# 📋 Phase 2: Week 2 Sprint (Important)

**Goal:** Implement data consistency and UX clarity

```
Monday:
□ Issue #4: Define DataFreshness strategy (2h)
□ Issue #4: Implement merge algorithm (2h)

Tuesday:
□ Issue #9: Add AND/OR toggle to UI (2h)
□ Issue #9: Update RPC logic (2h)

Wednesday:
□ Issue #4: StaleBanner component (1h)
□ Issue #4: Testing (2h)

Thursday:
□ Issue #9: Testing toggle logic (2h)
□ Integration testing: Data flows (2h)

Friday:
□ Code review: Phase 2 issues (2h)
□ Deploy: Week 2 fixes to staging (1h)
```

---

# 📋 Phase 3: Week 3 Sprint (Enhancement)

**Goal:** Error handling and graceful fallbacks

```
Monday:
□ Issue #7: Update RPC for optional location (2h)
□ Issue #7: Create LocationPromptBanner (1h)

Tuesday:
□ Issue #8: Implement suggestion search logic (3h)
□ Issue #8: Create EmptyStateCard component (1h)

Wednesday:
□ Issue #7-8: Integration testing (2h)
□ Issue #7-8: UX polish (1h)

Thursday:
□ End-to-end testing: All flows (3h)
□ Performance testing: Load times (1h)

Friday:
□ Code review: Phase 3 issues (2h)
□ Deploy: Week 3 fixes to staging (1h)
□ Prepare for beta release (1h)
```

---

# ✅ Definition of Done (Per Issue)

**Acceptance criteria must include:**
- [ ] Code implemented
- [ ] Unit tests pass
- [ ] Integration tests pass  
- [ ] Code reviewed by lead engineer
- [ ] Documented in comments
- [ ] Tested on device (mobile)
- [ ] Analytics logged (if applicable)
- [ ] No console warnings/errors
- [ ] Performance within targets
- [ ] Accessibility verified (if UI)

---

# 🚀 Pre-Beta Validation Checklist

**Before releasing to beta testers:**

## Navigation Flows
- [ ] Single canonical path: SelectCoach → FindCoaches → SearchResults → Detail
- [ ] Back button works correctly (navigation stack intact)
- [ ] Route params contain only necessary fields (no PII)
- [ ] All route params validated with Zod

## Data Consistency
- [ ] Passed data displays immediately (no blank state)
- [ ] Fresh data fetches in background
- [ ] Stale data banner shows if > 5 mins
- [ ] Data merges correctly (preserves search context)
- [ ] Price/availability reflects latest

## Error Handling
- [ ] No location set → Graceful fallback (nationwide search)
- [ ] 0 results → Suggestions displayed
- [ ] Network error → Retry option shown
- [ ] Stale data → User informed, can refresh

## Security & Privacy
- [ ] RLS policies enforced on all queries
- [ ] PII never exposed in route params
- [ ] Email/phone/notes require RLS access
- [ ] No PII in console logs or React DevTools
- [ ] Form validation prevents invalid dataentry

## UX & Clarity
- [ ] Modal vs screen pattern consistent
- [ ] Filter semantics clear (AND/OR toggle)
- [ ] User guided to set location if missing
- [ ] Empty results show alternatives, not dead-end
- [ ] Loading states smooth (no FOUC)

---

**Prepared for:** Engineering Team  
**Status:** Ready for Planning & Assignment  
**Questions?** See [PHASE_2_ISSUES_AND_RISKS.md](PHASE_2_ISSUES_AND_RISKS.md) for full solutions
