# Phase 2: Client Discovery & Professional Profiles - Development Sprint Plan

**Duration:** Weeks 1-8 (8 weeks)  
**Start Date:** February 8, 2026  
**Target Completion:** April 5, 2026  
**Team:** 2-3 developers

---

## Sprint Breakdown

### Sprint 1 (Week 1-2): Database & Backend Setup
**Focus:** Schema, migrations, RPC functions

#### Tasks
- [ ] Create DB migration for reviews system
- [ ] Create DB migration for professional_languages
- [ ] Create DB migration for client_favorites
- [ ] Create RPC: `get_professional_profile()`
- [ ] Create RPC: `search_professionals_advanced()`
- [ ] Create RPC: `get_professional_reviews()`
- [ ] Create RPC: `submit_review()`
- [ ] Set up RLS policies for reviews
- [ ] Create indexes for search performance
- [ ] Test migrations in dev environment

#### Files to Create/Modify
```
supabase/migrations/
  ├── 20260208_reviews_system.sql          ← Create
  ├── 20260208_professional_languages.sql  ← Create
  ├── 20260208_client_favorites.sql        ← Create
  └── 20260208_search_indexes.sql          ← Create
```

**Success Criteria:**
- All migrations run without errors
- RPC functions tested and returning expected data
- Indexes created, query performance verified (< 500ms)

---

### Sprint 2 (Week 3-4): UI Components - Professional Cards & Cards
**Focus:** Reusable components, search results

#### Tasks
- [ ] Create `ProfessionalCard` component
  - Photo, name, specialty, rating, price
  - "View Profile" button
  - Distance badge
  - Quick book button
  
- [ ] Create `SearchHeader` component
  - Goal categories filter
  - Location radius slider
  - Price range slider
  - Quick availability filter
  
- [ ] Create `FilterPanel` component
  - Advanced filtering drawer/modal
  - Multi-select specialties
  - Languages
  - Certifications
  - Response time
  
- [ ] Create `ResultsList` component
  - Infinite scroll implementation
  - Loading states
  - Empty state
  - Error handling

#### Files to Create
```
src/components/
  ├── ProfessionalCard.tsx                 ← Create
  ├── SearchHeader.tsx                     ← Create
  ├── FilterPanel.tsx                      ← Create
  └── ResultsList.tsx                      ← Create

src/screens/
  └── FindCoachesNative.tsx                ← Create (assembles above)
```

**Success Criteria:**
- Components render correctly
- Responsive design on mobile
- Infinite scroll works smoothly
- Filter panel toggles work

---

### Sprint 3 (Week 5-6): Search Backend & Hooks
**Focus:** Data fetching, search logic, performance

#### Tasks
- [ ] Create `useSearch` hook
  - Execute search with filters
  - Handle pagination
  - Cache results
  - Debounce search input
  
- [ ] Create `useSearchFilters` hook
  - Manage filter state
  - Apply/reset filters
  - Track filter changes
  
- [ ] Create `useProfessionalCard` hook
  - Fetch professional basic info
  - Load average rating
  - Calculate distance
  
- [ ] Integrate with `search_professionals_by_goals` RPC
  - Test with real filters
  - Monitor query performance
  - Add caching layer (React Query)
  
- [ ] Add analytics tracking
  - Track search events
  - Filter application
  - Result clicks

#### Files to Create
```
src/hooks/
  ├── useSearch.ts                         ← Create
  ├── useSearchFilters.ts                  ← Create
  └── useProfessionalCard.ts               ← Create

src/lib/
  └── searchAnalytics.ts                   ← Create
```

**Success Criteria:**
- Search returns results in < 1 second
- Pagination works smoothly
- Filters apply/reset correctly
- Analytics events logged

---

### Sprint 4 (Week 7-8): Professional Profile Pages
**Focus:** Detailed view, reviews, CTA

#### Tasks
- [ ] Create professional profile screen:
  - [ ] Hero section (photo, name, ratings, CTA)
  - [ ] About section (bio, experience, certs, languages)
  - [ ] Services section (packages with "Select" buttons)
  - [ ] Reviews section (5-star display, individual reviews)
  - [ ] Availability section (calendar view, quick-book)
  - [ ] Stats section (clients served, completion rate)
  
- [ ] Create review display component
  - [ ] Star rating with distribution
  - [ ] Individual review cards
  - [ ] "Most Helpful" filtering
  - [ ] Review photos/testimonials
  
- [ ] Create availability calendar
  - [ ] Next 30 days view
  - [ ] Highlight available slots
  - [ ] Quick-book slots
  - [ ] "Request Custom Time" link
  
- [ ] Integrate review submission flow
  - [ ] Review modal with form
  - [ ] Star rating input
  - [ ] Photo upload for review
  - [ ] Submission and confirmation
  
- [ ] Add "Book Package" CTA
  - [ ] Navigates to booking flow (Phase 3)
  - [ ] Passes selected package data
  
- [ ] Add favorites/wishlist
  - [ ] Heart icon with toggle
  - [ ] Save to favorites
  - [ ] View favorites collection

#### Files to Create
```
src/screens/
  └── ProfessionalProfileNative.tsx        ← Create

src/components/
  ├── ProfileHero.tsx                      ← Create
  ├── ResourceAbout.tsx                    ← Create
  ├── ServicesSection.tsx                  ← Create
  ├── ReviewsSection.tsx                   ← Create
  ├── ReviewCard.tsx                        ← Create
  ├── AvailabilityCalendar.tsx             ← Create
  ├── StatsSection.tsx                     ← Create
  ├── SubmitReviewModal.tsx                ← Create
  └── FavoriteButton.tsx                   ← Create

src/hooks/
  ├── useProfessionalProfile.ts            ← Create
  ├── useReviews.ts                        ← Create
  └── useFavorites.ts                      ← Create
```

**Success Criteria:**
- Profile loads smoothly with all data
- Reviews display correctly
- Calendar shows availability
- Book/favorite actions work
- Page performance > 60 Lighthouse score

---

## Implementation Strategy

### Phase 2.1: Database & Migrations (First)
1. Create migration files
2. Back up current DB
3. Test migrations locally
4. Apply to dev environment
5. Verify data integrity

### Phase 2.2: Components (Second)
1. Create dummy data first
2. Build components with mock data
3. Style according to design system
4. Test responsiveness
5. Add error states

### Phase 2.3: Integration (Third)
1. Connect components to real data
2. Add loading states
3. Handle errors gracefully
4. Add analytics
5. Performance testing

---

## Key Files & Their Dependencies

```
FindCoachesNative.tsx (MAIN SCREEN)
├── SearchHeader (component)
├── FilterPanel (component)
├── ResultsList (component)
│   ├── ProfessionalCard (component) x N
│   │   └── useProfessionalCard (hook)
│   └── useSearch (hook)
├── useSearchFilters (hook)
└── Analytics tracking

ProfessionalProfileNative.tsx (DETAIL SCREEN)
├── ProfileHero (component)
├── AboutSection (component)
├── ServicesSection (component)
├── ReviewsSection (component)
│   ├── ReviewCard (component) x N
│   └── useReviews (hook)
├── AvailabilityCalendar (component)
├── StatsSection (component)
├── SubmitReviewModal (component)
├── FavoriteButton (component)
├── useProfessionalProfile (hook)
└── useFavorites (hook)
```

---

## Database Schema Changes

### New Tables
1. `professional_reviews` - Client reviews
2. `professional_review_responses` - Professional replies
3. `professional_review_stats` - Denormalized ratings
4. `professional_languages` - Languages spoken
5. `client_favorites` - Wishlist

### New Columns
- `coaches.bio`
- `coaches.certifications`
- `coaches.years_of_experience`
- `coaches.profile_photo_url`
- `coaches.verified_badge`
- `coaches.response_time_minutes`

### New RPC Functions
- `get_professional_profile()`
- `search_professionals_advanced()`
- `get_professional_reviews()`
- `submit_review()`
- `get_recommendations()`

---

## Testing Strategy

### Unit Tests (TBD)
- Review calculation logic
- Search filter validation
- Rating aggregation

### Integration Tests (TBD)
- Search with multiple filters
- Review submission
- Favorites operations

### E2E Tests (Manual)
1. Search for professionals
2. Apply filters
3. View professional profile
4. Submit review
5. Add to favorites
6. Book package (handoff to Phase 3)

---

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Search load | < 1s | RPC + Query cache |
| Profile load | < 2s | Parallel queries |
| Review pagination | < 500ms | Lazy load + virtualize |
| Filter apply | < 500ms | Debounce + cache |

---

## API Endpoints Needed

### Existing (Use)
```
GET /search_professionals_by_goals
  - params: goals[], mode[], timing[], rating, price, radius
  - returns: professionals with match_score
```

### New (Create)
```
GET /api/professionals/{id}
  - returns: full profile with all sections

GET /api/professionals/{id}/reviews
  - params: page, sort
  - returns: paginated reviews

POST /api/reviews
  - body: {professional_id, rating, title, content, photos}
  - returns: review_id

PUT /api/favorites/{professional_id}
  - returns: favorite toggle status

GET /api/favorites
  - returns: client's favorite professionals
```

---

## Daily Standup Template

```
Date: ___________

Yesterday:
- [ ] Task 1: _________ (% complete)
- [ ] Task 2: _________ (% complete)

Today:
- [ ] Task 1: _________
- [ ] Task 2: _________

Blockers:
- Issue 1: _________
- Issue 2: _________

Notes:
- Performance observation
- Code review feedback
```

---

## Success Criteria - Phase 2 Complete

### Functional
- ✅ Users can search professionals by goals, location, price
- ✅ Users can apply/reset advanced filters
- ✅ Users can view professional profiles with reviews
- ✅ Users can submit ratings and reviews
- ✅ Users can add professionals to favorites
- ✅ Users can see available booking slots
- ✅ Booking CTA leads to Phase 3 checkout

### Performance
- ✅ Search results load in < 1 second
- ✅ Professional profiles load in < 2 seconds
- ✅ Lighthouse score > 60
- ✅ Database queries optimized with indexes
- ✅ No memory leaks on navigation

### Quality
- ✅ Responsive on mobile (375px - 414px)
- ✅ Tablet optimized (iPad view)
- ✅ Accessibility: WCAG 2.1 Level AA
- ✅ Error states handled gracefully
- ✅ Loading states visible
- ✅ No console errors in prod build

### Analytics
- ✅ Search events tracked
- ✅ Filter usage tracked
- ✅ Professional view tracked
- ✅ Review submission tracked
- ✅ Favorite additions tracked
- ✅ Booking CTA clicks tracked

---

**Status:** Ready to Begin Sprint 1  
**Timeline:** 8 weeks to MVP completion  
**Next Step:** Create database migrations
