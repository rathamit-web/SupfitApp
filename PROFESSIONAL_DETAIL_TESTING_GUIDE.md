# ProfessionalDetailNative Screen - Testing Guide

**File:** [src/screens/ProfessionalDetailNative.tsx](src/screens/ProfessionalDetailNative.tsx)  
**Status:** 550+ lines, fully featured  
**Test Date:** 2026-02-09

---

## Quick Start: Run Dev Server

```bash
npm run dev
# Opens at http://localhost:8080 (web) or Expo Go (mobile)
```

---

## Test Scenarios

### SCENARIO 1: View Professional Profile (Hero Section)

**Setup:**
1. Navigate to FindCoachesNative or search results
2. Click on a professional card
3. Should pass professionalId to route.params

**Expected:** Hero section displays:
- ✅ Avatar/photo_url
- ✅ Professional name
- ✅ Rating (0-5 stars)
- ✅ Review count badge
- ✅ Distance (e.g., "2.5 km away")
- ✅ Match score (0-100)
- ✅ Price per session/month

**Test Commands (if available):**
```
Manual: Click professional card → Observe hero renders
```

**What to Check:**
- [ ] Avatar loads without errors
- [ ] Rating displays correctly (handle null ratings)
- [ ] Distance calculated from coordinates
- [ ] Price formatting matches package billing cycle
- [ ] No layout overflow on small screens

---

### SCENARIO 2: View Specialties & Service Modes

**Expected:** Below hero section:
- ✅ Specialties (tags): "Weight Loss", "Muscle Gain", etc.
- ✅ Service modes (chips): "In-Person", "Online", "Hybrid"
- ✅ Languages supported (if available)

**Test Actions:**
1. Scroll down from hero
2. Look for specialty tags
3. Look for mode chips

**What to Check:**
- [ ] All specialties render as tags
- [ ] Specialties truncate if too many (max 5 visible, "More" button)
- [ ] Service modes are colored differently
- [ ] Languages display with proficiency level (if applicable)
- [ ] Responsive on mobile (single column)

---

### SCENARIO 3: View Package Details

**Expected:** Package section includes:
- ✅ Package name/title
- ✅ Price (formatted with currency)
- ✅ Billing cycle (monthly, per-session, etc.)
- ✅ Feature list (e.g., "1-on-1 sessions", "Weekly check-ins")
- ✅ "Subscribe" or "Book Now" button

**Test Actions:**
1. Scroll to "Packages" section
2. Verify package details render
3. Click "Subscribe" button

**What to Check:**
- [ ] Multiple packages display (if available)
- [ ] Feature list items render as bullets or checkmarks
- [ ] Price updates when switching packages
- [ ] "Subscribe" button opens modal
- [ ] Button disabled if user already subscribed

---

### SCENARIO 4: Write a Review (Modal Validation)

**Setup:**
1. Scroll to "Write Review" section
2. Click "Write Review" button or modal trigger

**Expected:** Modal opens with:
- ✅ Star rating input (1-5 stars)
- ✅ Review title text input
- ✅ Review text textarea
- ✅ Submit button
- ✅ Close/Cancel button
- ✅ Form validation

**Test Actions:**

**Test 4a: Valid Review Submission**
```
1. Click 5-star rating
2. Enter title: "Great coach!"
3. Enter review: "Highly recommended, very professional"
4. Click "Submit Review"
Expected: 
  - Modal closes
  - Toast shows "Review submitted"
  - Review appears in list (after approval)
```

**Test 4b: Form Validation**
```
1. Leave fields empty
2. Click "Submit Review"
Expected:
  - ERROR: "Please select a rating"
  - ERROR: "Title required"
  - ERROR: "Review text required (min 10 chars)"
  - Submit button disabled/grayed out
```

**Test 4c: Character Limits**
```
1. Enter very long review text (> 500 chars)
2. Should either truncate or show warning
Expected:
  - Character counter shows: "250/500"
  - Scrollable text area
```

**What to Check:**
- [ ] Modal appears with smooth animation
- [ ] Star rating interactive (tap to select)
- [ ] Title has min/max length validation (try 1 char, 200 chars)
- [ ] Review has min 10 chars validation
- [ ] Submit disabled if validation fails
- [ ] Loading spinner shows while submitting
- [ ] Error toast on network failure
- [ ] Success toast on submission
- [ ] Modal closes after success

---

### SCENARIO 5: View Reviews (Infinite Scroll)

**Expected:** Reviews section displays:
- ✅ List of reviews (infinite scroll)
- ✅ Reviewer name
- ✅ Star rating (1-5 stars shown as icons)
- ✅ Review title
- ✅ Review text (truncated if > 100 chars, "Read more" link)
- ✅ Review date
- ✅ Helpful/Unhelpful vote buttons
- ✅ Professional's response (if available)

**Test Actions:**

**Test 5a: Load Reviews**
```
1. Scroll to "Reviews" section
2. First page loads with 5-10 reviews
Expected:
  - Reviews display with all fields
  - Loading spinner while fetching
```

**Test 5b: Infinite Scroll**
```
1. Scroll to bottom of reviews list
2. Should auto-load more reviews
3. Keep scrolling, check "Load More" is triggered
Expected:
  - More reviews append to list
  - No duplicate reviews
  - Smooth scrolling performance
  - Loading indicator shows during fetch
```

**Test 5c: Helpful/Unhelpful Voting**
```
1. Click "Helpful" or "Unhelpful" on a review
2. Counter increments
3. Button becomes active/highlighted
Expected:
  - helpful_count or unhelpful_count increases by 1
  - User can vote once (or toggle)
  - Toast shows "Voted helpful" or "Voted unhelpful"
  - Disabled if user already voted
```

**Test 5d: Professional Response**
```
1. Look for reviews with response_text
2. Response should display in highlighted box
3. Show response date
Expected:
  - Response visible below review
  - Different styling (e.g., gray background)
  - Shows "Professional response 3 days ago"
  - Response text fully visible
```

**What to Check:**
- [ ] Reviews paginate correctly (limit 5, offset updates)
- [ ] No duplicate reviews on pagination
- [ ] Star rating renders correctly (1-5 stars shown)
- [ ] Long review text truncates with "Read more" link
- [ ] Helpful voting works (counter updates)
- [ ] Unhelpful voting works
- [ ] Professional response displays if present
- [ ] Review date formatting correct (e.g., "2 days ago")
- [ ] Loading states show during fetch
- [ ] Empty state if no reviews (show placeholder)

---

### SCENARIO 6: Book a Session / CTA Button

**Expected:** "Book a Session" button:
- ✅ Always visible (sticky or floating)
- ✅ Opens booking modal or navigates to booking page
- ✅ Passes professional ID and package ID

**Test Actions:**

**Test 6a: Click CTA Button**
```
1. Scroll to bottom of page
2. Click "Book a Session" button
Expected:
  - Modal opens OR navigates to booking screen
  - Professional name pre-filled
  - Selected package pre-selected
```

**Test 6b: Button States**
```
1. Logged out user clicks button
Expected:
  - Redirects to login screen

2. Already subscribed user clicks button
Expected:
  - Shows message "You're already subscribed"
  - Button shows "Go to Dashboard" instead
```

**What to Check:**
- [ ] Button always visible/sticky
- [ ] Button text changes based on subscription state
- [ ] Modal opens with correct data
- [ ] Unsubscribed state → "Book/Subscribe"
- [ ] Subscribed state → "Go to Dashboard"
- [ ] Not logged in → Navigate to auth

---

## Integration Test Checklist

Run through the entire flow once:

```
1. ✅ Login to app
2. ✅ Navigate to Find Professionals
3. ✅ Search by goal (e.g., "Weight Loss")
4. ✅ Click professional card
5. ✅ View hero section (all fields render)
6. ✅ Scroll and view specialties/modes
7. ✅ View package details
8. ✅ Scroll to reviews
9. ✅ Try clicking "Helpful" on a review
10. ✅ Click "Write Review" and submit valid review
11. ✅ Scroll to load more reviews (infinite scroll)
12. ✅ Click "Book a Session" button
13. ✅ Booking modal opens with pre-filled data
14. ✅ Complete booking (or cancel)
15. ✅ Navigate back to detail page
16. ✅ No crashes or console errors
```

---

## Performance Testing

### Load Time
```
Expected:
- Initial load: < 2 seconds
- Review pagination: < 1 second
- Package details: < 500ms
- Image loading: < 1 second
```

**Test:**
```
1. Open DevTools Network tab (if web)
2. Load professional detail page
3. Check waterfall for load times
4. Scroll reviews and check pagination time
```

### Memory Usage
```
Test:
1. Open 5 different professional profiles
2. Switch between them
3. Check memory doesn't grow unbounded
4. Kill a profile and navigate away
5. Memory should decrease
```

---

## Edge Cases to Test

### Empty States
- [ ] Professional with no reviews → Show "No reviews yet" message
- [ ] Professional with no specialties → Show "Not specified"
- [ ] Professional with no photo → Show placeholder avatar
- [ ] Professional with no packages → Show message "Packages not available"

### Data Edge Cases
- [ ] Rating = null → Show "No rating yet" instead of 0
- [ ] Very long professional name → Should wrap/truncate gracefully
- [ ] Very long review text → Truncate with "Read more"
- [ ] 100+ reviews → Pagination works correctly
- [ ] Professional with 0 distance (same location) → Show "Nearby"

### Network Errors
- [ ] No internet → Show error message, retry button
- [ ] 404 professional not found → Show "Professional not found"
- [ ] Slow network → Loading spinner shows, doesn't timeout
- [ ] Network times out → Error toast with retry option

### User States
- [ ] Anonymous user views profile → No "Book" button (or shows "Login to book")
- [ ] User views their own profile → Show "Your Profile" instead of "Book"
- [ ] User already subscribed → Button shows "Go to Dashboard"
- [ ] User already wrote review → Show "Review submitted pending approval"

---

## Manual Testing in Development

### Quick Test Setup

**Option 1: Direct Navigation (if routes exist)**
```tsx
// In your App.tsx or test file:
<Route path="/professional/:id" element={<ProfessionalDetailNative />} />

// Navigate:
http://localhost:8080/professional/uuid-here
```

**Option 2: From Find Professionals Flow**
```
1. npm run dev
2. In app, go to "Find Professionals" tab (if exists)
3. Click a professional card
4. Should navigate to detail page
```

**Option 3: Mock Data Test**
```tsx
// Create mock professional data for testing:

const mockProfessional = {
  professional_id: "test-id-123",
  name: "John Fitness Coach",
  description: "Certified fitness trainer with 10+ years experience",
  price: 50,
  rating: 4.5,
  review_count: 23,
  specialties: ["Weight Loss", "Muscle Gain", "Cardio"],
  mode: ["Online", "In-Person"],
  distance_km: 2.5,
  match_score: 85,
  photo_url: "https://example.com/photo.jpg"
};

// Pass via route:
navigation.navigate('ProfessionalDetail', {
  professionalId: mockProfessional.professional_id,
  professional: mockProfessional
});
```

---

## Debugging Tips

### Show Component Tree
```tsx
import { view_name } from 'react-native';

// In ProfessionalDetailNative:
console.log('Professional:', professional);
console.log('Packages:', packages);
console.log('Reviews:', reviews);
console.log('User ID:', userId);
```

### Network Requests (Console)
```
Open DevTools → Network tab
- Filter by XHR/Fetch
- Watch Supabase requests
- Check response payloads
```

### React DevTools
```
1. Install React Native DevTools
2. Connect: npx react-native-debugger
3. Inspect component state
4. Watch prop changes
5. Profile re-renders
```

---

## Automated Testing (Future)

```tsx
// Example Jest test:
import { render, screen, fireEvent } from '@testing-library/react-native';
import ProfessionalDetailNative from './ProfessionalDetailNative';

test('renders professional hero section', () => {
  const mockRoute = {
    params: {
      professionalId: 'test-id',
      professional: mockProfessional
    }
  };
  
  render(<ProfessionalDetailNative route={mockRoute} navigation={mockNavigation} />);
  
  expect(screen.getByText('John Fitness Coach')).toBeOnTheScreen();
  expect(screen.getByText('4.5')).toBeOnTheScreen();
});

test('review form validates required fields', () => {
  // ... test validation
});

test('infinite scroll loads more reviews', () => {
  // ... test pagination
});
```

---

## Test Results Tracking

| Feature | Status | Notes | Date |
|---------|--------|-------|------|
| Hero Section | ⏳ | Pending test | 2026-02-09 |
| Specialties/Modes | ⏳ | Pending test | 2026-02-09 |
| Package Details | ⏳ | Pending test | 2026-02-09 |
| Reviews List | ⏳ | Pending test | 2026-02-09 |
| Write Review Modal | ⏳ | Pending test | 2026-02-09 |
| Infinite Scroll | ⏳ | Pending test | 2026-02-09 |
| Book CTA Button | ⏳ | Pending test | 2026-02-09 |
| Form Validation | ⏳ | Pending test | 2026-02-09 |
| Network Errors | ⏳ | Pending test | 2026-02-09 |
| Performance | ⏳ | Pending test | 2026-02-09 |

---

## Summary

**Total Test Scenarios:** 18  
**Estimated Testing Time:** 45 minutes manual, 2 hours automated  
**Critical Path:** Hero → Package → Book → Submit Review → Infinite Scroll  

**Go/No-Go Decision:** All scenarios passing = ✅ Ready for QA
