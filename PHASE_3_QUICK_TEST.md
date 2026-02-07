# Phase 3 Quick Testing - 30 Minutes

## 🚀 Get Started Now

### **5 Minutes: Deploy & Verify**

```bash
# 1. Deploy function
cd /workspaces/SupfitApp
supabase functions deploy match-professionals

# 2. Verify deployed
supabase functions list
# Look for: match-professionals | v1
```

✅ **Success**: Function appears in list

---

### **10 Minutes: Create Test Data**

**Copy-paste into Supabase SQL Editor**:

```sql
-- Create test user with location + goals
INSERT INTO user_profiles (
  id, email, full_name,
  location_lat, location_lng, location_geo,
  location_precision_source, location_quality_score,
  fitness_goals, budget_min, budget_max, preferred_radius_km
) VALUES (
  'test-user-' || gen_random_uuid()::text,
  'test@example.com',
  'Test User',
  28.6139, 77.2090, 'POINT(77.2090 28.6139)',
  'gps', 95,
  ARRAY['strength training', 'weight loss'],
  500, 5000, 5
) RETURNING id;
```

Copy the returned ID → Save as `YOUR_USER_ID`

```sql
-- Create 3 test professionals
-- Note: Uses correct column names from professional_packages table
INSERT INTO professional_packages (
  owner_user_id, name,
  location_lat, location_lng, location_geo,
  specialties, price, rating, review_count, mode, available_slots
) VALUES
  (
    gen_random_uuid(), 'Rajesh Coaching',
    28.6200, 77.2150, 'POINT(77.2150 28.6200)',
    ARRAY['strength training', 'cardio'],
    500, 4.8, 48, ARRAY['in-person'],
    jsonb_build_object(
      'today', '2026-02-07 15:00:00',
      'tomorrow', '2026-02-08 10:00:00'
    )
  ),
  (
    gen_random_uuid(), 'Priya Yoga',
    28.5900, 77.1900, 'POINT(77.1900 28.5900)',
    ARRAY['yoga', 'flexibility'],
    800, 4.5, 22, ARRAY['in-person', 'hybrid'],
    jsonb_build_object(
      'today', '2026-02-07 18:00:00'
    )
  ),
  (
    gen_random_uuid(), 'Arjun Weights',
    28.7000, 77.3000, 'POINT(77.3000 28.7000)',
    ARRAY['strength training'],
    600, 4.9, 65, ARRAY['in-person'],
    jsonb_build_object(
      'tomorrow', '2026-02-08 08:00:00'
    )
  );
```

✅ **Success**: No errors, rows inserted

---

### **5 Minutes: Test Edge Function with Curl**

```bash
# Run this (replace YOUR_USER_ID with the ID from above)
curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/match-professionals \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA2OTkwNDAwLCJleHAiOjE4MzY5OTA0MDB9.your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "limit": 5
  }'
```

**Get your API key**:
```bash
# From Supabase dashboard → Settings → API → anon public
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "professional_id": "pro1-...",
      "name": "Rajesh Coaching",
      "distance_km": 1.5,
      "price": 500,
      "overall_score": 85.3,
      "signal_breakdown": {
        "proximity": { "score": 80, "weight": 0.3, "explanation": "1.5 km away" },
        "goal_alignment": { "score": 100, "weight": 0.25, "explanation": "2/2 goals matched" },
        ...
      }
    }
  ],
  "count": 3
}
```

✅ **Success**: Got data, all 5 signals present, scores 0-100

---

### **5 Minutes: Verify Database**

**Check audit trail**:
```sql
SELECT signal_name, signal_value, created_at 
FROM match_signals_log
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: 15 rows (3 professionals × 5 signals each)

✅ **Success**: Signals logged for audit trail

**Check cache**:
```sql
SELECT professional_type, expires_at - NOW() as ttl_remaining
FROM match_cache
WHERE user_id = 'YOUR_USER_ID';
```

**Expected**: One row, `ttl_remaining` = 6+ hours

✅ **Success**: Results cached

---

## 🎨 UI Testing (In App)

### **Start Dev Server**
```bash
npm run dev
# Open: localhost:8080
```

### **Test Checklist**

- [ ] Navigate to "Find Professionals" page
- [ ] Page shows list of professionals
- [ ] Each card displays:
  - [ ] Photo/placeholder
  - [ ] Name + Rating
  - [ ] Distance (should show ~1.5km, ~3km, ~10km)
  - [ ] Price (₹500, ₹800, ₹600)
  - [ ] Match score (should be different for each)
- [ ] Scores are color-coded:
  - [ ] Top match: 🟢 GREEN (85+)
  - [ ] Mid match: 🟠 ORANGE (60-85)
  - [ ] Low match: 🔴 RED (40-60)
- [ ] Rank badges show: #1, #2, #3
- [ ] Tap "Why this match?" on top card
  - [ ] See 📍 Proximity (score, %)
  - [ ] See 💪 Goal Alignment (score, %)
  - [ ] See 💵 Budget Fit (score, %)
  - [ ] See ⭐ Rating (score, %)
  - [ ] See 📅 Availability (score, %)
- [ ] Pull down to refresh
  - [ ] Spinner appears
  - [ ] Results update
- [ ] Filter button works
  - [ ] Change rating → list updates
  - [ ] Change price → list updates

✅ **Success**: All UI components work

---

## 📊 Admin Testing

### Navigate to Weight Tuning

```
Settings → Admin → Match Tuning
```

**Test Checklist**:
- [ ] Page loads with current weights:
  - Proximity: 30%
  - Goal: 25%
  - Budget: 20%
  - Rating: 15%
  - Availability: 10%
  - Total: 100%
- [ ] Can adjust sliders (e.g., Goal: 25% → 40%)
- [ ] Total updates in real-time
- [ ] If total ≠ 100%, Save button disabled
- [ ] Adjust until total = 100% → Save button enabled
- [ ] Click Save → Toast: "Weights saved!"
- [ ] Go back to matching page
- [ ] Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Matches may have different order (new weights applied)

✅ **Success**: Weight tuning works, new matches use new weights

---

## 🔍 Debugging

### Check Function Logs
```bash
supabase functions logs match-professionals --limit 20
```

Look for errors or successful signal logging.

### Check Audit Trail
```sql
SELECT signal_name, COUNT(*) as count
FROM match_signals_log
WHERE user_id = 'YOUR_USER_ID'
GROUP BY signal_name;
```

**Expected**:
```
proximity           | 3
goal_alignment      | 3
budget_fit          | 3
rating              | 3
availability        | 3
match_results_snapshot | 1
```

### Manual Signal Calculation (Verify)

**Check proximity**:
```sql
SELECT ST_Distance(
  'POINT(77.2090 28.6139)'::geography,
  'POINT(77.2150 28.6200)'::geography
) / 1000 as distance_km;
```

**Expected**: ~1.5-2 km for test data

---

## ✅ Final Checklist

- [ ] Function deployed
- [ ] Function responds <500ms
- [ ] Test data created
- [ ] Signals logged to audit trail
- [ ] Cache populated
- [ ] UI displays professionals
- [ ] Scores color-coded correctly
- [ ] Signal breakdown shows all 5
- [ ] Filters work
- [ ] Admin can change weights
- [ ] New weights apply to new matches
- [ ] No errors in console
- [ ] No unhandled exceptions

---

## 🎯 Success = ALL CHECKS PASS

✅ **Ready for Production**

---

## 📞 Quick Fixes

**"Function not found"** → `supabase functions deploy match-professionals`

**"No matches"** → Check if test data exists: `SELECT COUNT(*) FROM professional_packages;`

**"Scores all 0"** → Set user goals: `UPDATE user_profiles SET fitness_goals = ARRAY['strength training'] WHERE id = '...';`

**"Cache not working"** → Check cache table: `SELECT * FROM match_cache WHERE user_id = '...';`

**"Weights not applying"** → Clear cache: `DELETE FROM match_cache WHERE user_id = '...';`

---

**Time Estimate**: 30 minutes for full testing  
**Effort**: Copy-paste SQL + navigate UI  
**Success Rate**: Should be 100% if deployment worked
