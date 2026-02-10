# ProfessionalDetailNative - Quick Test Commands

## Development Server Commands

```bash
# Start Vite dev server (web)
npm run dev

# Expected output:
# ✓ Ready in 234ms
# ➜  Local:   http://localhost:5173/
# ➜  Press h to show help

# Open in browser:
open http://localhost:5173
# or
"$BROWSER" http://localhost:5173
```

---

## Navigation to Test Screen

### Option 1: Direct URL (if routes exist)
```bash
# After running npm run dev, visit:
http://localhost:5173/professional/[UUID-HERE]

# Example with mock UUID:
http://localhost:5173/professional/550e8400-e29b-41d4-a716-446655440000
```

### Option 2: Through App Navigation
```
1. In browser, go to http://localhost:5173
2. Login or navigate to "Find Professionals" tab
3. Click any professional card
4. Should land on ProfessionalDetailNative screen
```

---

## Console Testing Commands

### Check if Component Mounted
```javascript
// In DevTools Console (F12):
window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.enabled
// Should be: true
```

### Simulate Professional Data
```javascript
// Paste in console to test with mock data:
const mockProfessional = {
  professional_id: "test-prof-001",
  name: "Sarah Fitness Coach",
  description: "Certified trainer specializing in weight loss",
  price: 60,
  rating: 4.8,
  review_count: 42,
  specialties: ["Weight Loss", "Nutrition Coaching", "Core Strength"],
  mode: ["Online", "Hybrid"],
  distance_km: 3.2,
  match_score: 92
};

console.log(mockProfessional);
```

---

## API Testing (Network Tab)

### Monitor Supabase Calls

```
1. Open DevTools → Network tab (F12)
2. Filter by XHR/Fetch
3. Expected calls during screen load:

✓ GET /rest/v1/professional_packages?id=eq.{id}
  Status: 200
  Response: { id, name, price, features... }

✓ GET /rest/v1/professional_reviews?package_id=eq.{id}
  Status: 200  
  Response: [{ id, rating, title, content... }]

✓ GET /rest/v1/professional_languages?package_id=eq.{id}
  Status: 200
  Response: [{ language_code, proficiency_level... }]

✓ POST /rest/v1/professional_reviews (when submitting review)
  Status: 201
  Request: { rating, title, content, reviewer_user_id... }
```

---

## Feature-Specific Tests

### Test 1: Hero Section Renders
```javascript
// In console, verify elements exist:
document.querySelector('img[alt*="avatar"]');  // Avatar loads
document.querySelector('[data-testid="rating"]');  // Rating shows
document.querySelector('[data-testid="distance"]');  // Distance shows
document.querySelector('[data-testid="price"]');  // Price shows
```

### Test 2: Review Submission
```javascript
// Simulate form input:
1. Click star rating (★★★★★)
2. Type title: "Amazing coach!"
3. Type review: "Best experience ever, highly recommend this professional"
4. Click "Submit Review"

Expected response:
- Toast: "Review submitted successfully"
- Modal closes
- Review appears in list (may need approval first)
```

### Test 3: Infinite Scroll
```javascript
// Scroll down and check if more reviews load:
1. Open DevTools → Console
2. Scroll to bottom of reviews list
3. Check Network tab for new fetch requests:
   GET /rest/v1/professional_reviews?limit=5&offset=5
   GET /rest/v1/professional_reviews?limit=5&offset=10
   // offset should increment by 5 each time
```

### Test 4: Helpful Vote
```javascript
// Test helpful vote functionality:
1. Find a review in the list
2. Click "Helpful" button
3. Check Network tab for POST request:
   POST /rest/v1/professional_reviews
   Body: { helpful_count: 23 }
4. Button should highlight/disable
```

---

## Error Simulation

### Simulate Network Error (Dev Tools)
```
1. Open DevTools → Network tab
2. Click throttle dropdown (usually says "No throttling")
3. Select "Offline"
4. Try to load professional detail
5. Should show error: "Failed to load professional profile"

Then:
6. Switch back to "No throttling"
7. Refresh page
8. Should load successfully
```

### Simulate Slow Network
```
1. DevTools → Network tab → Throttling dropdown
2. Select "Slow 3G"
3. Load professional detail
4. Watch loading spinners
5. Should take ~5-10 seconds to load
6. Verify UI remains responsive
```

---

## Performance Measurement

### Measure Load Time
```javascript
// In console:
performance.mark('detail-start');
// ... do action ...
performance.mark('detail-end');
performance.measure('detail-load', 'detail-start', 'detail-end');
console.table(performance.getEntriesByName('detail-load'));

// Should show duration < 2000ms
```

### Check Memory Usage
```javascript
// Chrome DevTools → Memory tab:
1. Take heap snapshot before loading detail
2. Load professional detail page
3. Wait 5 seconds
4. Take another heap snapshot
5. Memory delta should be < 50MB

Then:
6. Navigate away from detail page
7. Take final heap snapshot
8. Memory should decrease back to baseline
```

---

## Responsive Testing

### Mobile View
```
1. DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select "iPhone 12" or "Pixel 5"
3. Test:
   - Hero section fits screen
   - Buttons are tap-able (48px min)
   - Reviews scroll smoothly
   - Modal fits viewport
   - No horizontal scrolling
```

### Tablet View
```
1. DevTools → Toggle device toolbar
2. Select "iPad Air"
3. Verify layout adjusts
4. Review list shows more items per page
5. Columns might adjust
```

---

## Debugging Specific Features

### Debug: Review Form Validation
```javascript
// Add to console to see validation state:
// (Assuming React component debugging enabled)

// In form submission handler:
console.log('Rating:', rating);
console.log('Title:', title);
console.log('Content:', content);
console.log('Validation:', {
  hasRating: rating > 0,
  hasTitle: title.length > 3,
  hasContent: content.length > 10
});
```

### Debug: Infinite Scroll Not Working
```javascript
// Check if observer is working:
// (In browser console)

// 1. Check if reviews list exists
document.querySelector('[data-testid="reviews-list"]');

// 2. Scroll to bottom
window.scrollTo(0, document.body.scrollHeight);

// 3. Wait 1 second
setTimeout(() => {
  // 4. Check Network tab - should see new request
  // 5. Check if more reviews appended
  console.log('Reviews count:', document.querySelectorAll('[data-testid="review-item"]').length);
}, 1000);
```

### Debug: Images Not Loading
```javascript
// Check image URLs:
document.querySelectorAll('img').forEach(img => {
  console.log({
    url: img.src,
    loaded: img.complete,
    error: img.naturalHeight === 0
  });
});

// If error, check:
// 1. URL is valid (starts with https://)
// 2. CORS headers correct
// 3. Image exists in storage
```

---

## Accessibility Testing

### Keyboard Navigation
```
1. DevTools → Open page
2. Press Tab repeatedly
3. Verify focus moves through:
   - Package dropdown
   - Review helpful button
   - Write review button
   - Book session button
   
4. Press Enter on focused button
5. Should activate correctly
```

### Screen Reader (macOS)
```
1. System Preferences → Accessibility → Voice Over → Enable
2. Navigate page with VO+arrow keys
3. Should read:
   - Professional name
   - Rating (e.g., "4.5 stars")
   - Price
   - Specialties
   - Reviews
   - Buttons with descriptions
```

---

## Test Cleanup

### Clear Browser Data
```javascript
// In console:
// Clear local storage
localStorage.clear();

// Clear session storage
sessionStorage.clear();

// Clear cache (if service worker)
if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}

// Reload
location.reload();
```

---

## Continuous Testing Script

```bash
#!/bin/bash
# save as test-loop.sh

echo "Starting professional detail testing..."

# Start server
npm run dev &
SERVER_PID=$!

sleep 3

# Open in browser
open http://localhost:5173/professional/test-id

# Keep running
wait $SERVER_PID
```

Run with:
```bash
chmod +x test-loop.sh
./test-loop.sh
```

---

## Success Criteria

✅ **All Pass:**
- [ ] Hero section renders without errors
- [ ] Images load correctly
- [ ] Reviews load and paginate
- [ ] Form validation works
- [ ] Submission succeeds
- [ ] Helpful voting works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] < 2s initial load time

❌ **Blocker Issues:**
- Images fail to load
- Reviews stuck in loading state
- Form submission hangs
- Pagination duplicates reviews
- Console errors or warnings
- Memory leak (grows unbounded)

---

## Quick Reference Table

| Action | Expected Result | Status |
|--------|-----------------|--------|
| Load detail page | Hero + packages visible in < 2s | ⏳ |
| Scroll down | Reviews paginate smoothly | ⏳ |
| Click "Write Review" | Modal opens with form | ⏳ |
| Submit review | Toast "Success", modal closes | ⏳ |
| Click helpful | Counter increments, button highlights | ⏳ |
| Click "Book Session" | Navigate to booking or modal | ⏳ |
| Offline mode | Shows error message | ⏳ |
| Mobile view (iPhone) | Responsive, no overflow | ⏳ |

---

**Document Version:** 1.0  
**Created:** 2026-02-09  
**Status:** Ready for Testing
