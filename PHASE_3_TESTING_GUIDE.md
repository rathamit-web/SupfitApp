# Phase 3 Testing Guide - Complete

## 🧪 Testing Strategy

**Level 1**: Function deployment verification (5 min)  
**Level 2**: Database integration testing (10 min)  
**Level 3**: Manual UI testing (20 min)  
**Level 4**: End-to-end user flow (30 min)  

---

## 🚀 Level 1: Deploy & Verify Edge Function

### Step 1: Deploy Function
```bash
cd /workspaces/SupfitApp
supabase functions deploy match-professionals
```

**Expected Output**:
```
✓ Deploying function "match-professionals"...
✓ Function deployed successfully
```

### Step 2: Get Function URL
```bash
supabase functions list
```

**You'll see**:
```
match-professionals | v1 | 2026-02-07 | 0
```

Function URL: `https://[your-project].supabase.co/functions/v1/match-professionals`

### Step 3: Test Function Directly (Curl)
```bash
# First, get an auth token
curl -X POST https://[your-project].supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'

# Then call the function (replace TOKEN and USERID)
curl -X POST https://[your-project].supabase.co/functions/v1/match-professionals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR-USER-ID",
    "limit": 5
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "professional_id": "pro-123",
      "name": "Rajesh Kumar",
      "distance_km": 1.5,
      "price": 500,
      "overall_score": 85.3,
      "signal_breakdown": {
        "proximity": { "score": 80, "weight": 0.3, "explanation": "..." },
        "goal_alignment": { "score": 90, "weight": 0.25, "explanation": "..." },
        ...
      }
    }
  ],
  "count": 5
}
```

✅ **Success**: Function is running and returning data

---

## 🗄️ Level 2: Database Integration Testing

### Prerequisite: Create Test Data

**1. Create test user with location & goals**:
```sql
-- Add test user (if not exists)
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  location_lat,
  location_lng,
  location_geo,
  location_precision_source,
  location_quality_score,
  fitness_goals,
  budget_min,
  budget_max,
  preferred_radius_km
) VALUES (
  'test-user-' || gen_random_uuid()::text,
  'testuser@example.com',
  'Test User',
  28.6139,  -- Mumbai lat
  77.2090,  -- Mumbai lng
  'POINT(77.2090 28.6139)',  -- PostGIS GEOGRAPHY point
  'gps',
  95,
  ARRAY['strength training', 'weight loss'],  -- Goals
  500,  -- Budget min
  5000, -- Budget max
  5     -- Preferred radius (5km)
) RETURNING id;

-- Copy the returned ID
```

**2. Create test professionals with locations**:
```sql
INSERT INTO professional_packages (
  professional_id,
  name,
  location_lat,
  location_lng,
  location_geo,
  location_precision_source,
  specialties,
  price,
  rating,
  review_count,
  mode,
  available_slots
) VALUES
  (
    'pro-1-' || gen_random_uuid()::text,
    'Rajesh Coaching',
    28.6200,  -- 1km away from test user
    77.2150,
    'POINT(77.2150 28.6200)',
    'gps',
    ARRAY['strength training', 'cardio', 'nutrition'],
    500,
    4.8,
    48,
    ARRAY['in-person'],
    jsonb_build_object(
      2026-02-07, '2024-02-07 15:00:00',  -- Today
      2026-02-08, '2024-02-08 10:00:00'   -- Tomorrow
    )
  ),
  (
    'pro-2-' || gen_random_uuid()::text,
    'Priya Yoga',
    28.5900,  -- 3km away
    77.1900,
    'POINT(77.1900 28.5900)',
    'address',
    ARRAY['yoga', 'flexibility', 'mindfulness'],
    800,
    4.5,
    22,
    ARRAY['in-person', 'hybrid'],
    jsonb_build_object(
      2026-02-07, '2024-02-07 18:00:00'
    )
  ),
  (
    'pro-3-' || gen_random_uuid()::text,
    'Arjun Weights',
    28.7000,  -- 10km away (outside radius)
    77.3000,
    'POINT(77.3000 28.7000)',
    'gps',
    ARRAY['strength training'],
    600,
    4.9,
    65,
    ARRAY['in-person'],
    jsonb_build_object(
      2026-02-08, '2024-02-08 08:00:00'  -- Tomorrow
    )
  );
```

### Test 1: Check Audit Trail Created
```sql
SELECT * FROM match_signals_log
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC
LIMIT 20;
```

**Expected**: 5+ rows per match calculation (one per signal)

**Check**:
- ✅ `signal_name` = 'proximity', 'goal_alignment', 'budget_fit', 'rating', 'availability'
- ✅ `signal_value` = 0-100 score
- ✅ `reasoning` contains JSON with calculation details

### Test 2: Verify Cache Working
```sql
SELECT * FROM match_cache
WHERE user_id = 'YOUR-TEST-USER-ID'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected**: One row per professional_type

**Check**:
- ✅ `expires_at` is in future
- ✅ `results_snapshot` contains array of matches
- ✅ TTL is 6h (active user), 24h (medium), or 72h (low activity)

### Test 3: Verify Match Calculation
```sql
-- Get one match from cache
SELECT 
  results_snapshot->0->>'professional_id' as pro_id,
  results_snapshot->0->>'name' as pro_name,
  results_snapshot->0->>'distance_km' as distance,
  results_snapshot->0->>'overall_score' as score
FROM match_cache
WHERE user_id = 'YOUR-TEST-USER-ID'
LIMIT 1;
```

**Expected**: Professional data with calculated score (0-100)

---

## 🎨 Level 3: Manual UI Testing

### Setup: Start Dev Server
```bash
npm run dev
```

**Expected**: App launches on localhost:8080

### Test 1: Navigate to Matched Professionals Page

**Path**: Pages → Search → Find Professionals (or create route)

**Expected State**:
- ✅ Loading spinner shows briefly
- ✅ List of professionals appears
- ✅ Each card shows: Photo, Name, Rating, Distance, Price
- ✅ Match scores visible (0-100, color-coded)
- ✅ Rank badges (#1, #2, #3)

### Test 2: Verify Score Color Coding

| Score | Expected Color | Tier |
|-------|----------------|------|
| 90-100 | 🟢 Green | HIGH |
| 60-89 | 🟠 Orange | MEDIUM |
| 40-59 | 🔴 Red | LOW |
| 0-39 | ⚪ Gray | UNAVAILABLE |

**Test**: Open card for top match
- ✅ Score display matches expected color
- ✅ Tier label shows (HIGH/MEDIUM/LOW/UNAVAILABLE)

### Test 3: Expand Signal Breakdown

**Action**: Tap "Why this match?" button

**Expected**:
- Shows 5 sections:
  - 📍 Proximity: X/100 (30% weight) - "Y km away"
  - 💪 Goal Aligned: X/100 (25% weight) - "N/M goals matched"
  - 💵 Budget Fit: X/100 (20% weight) - "₹X within budget"
  - ⭐ Rating: X/100 (15% weight) - "4.8★ (48 reviews)"
  - 📅 Availability: X/100 (10% weight) - "Available today"
- Each shows progress bar
- Each shows explanation text

**Check**:
- ✅ Scores add up correctly to overall score
- ✅ Explanations are accurate
- ✅ Progress bars proportional

### Test 4: Test Filter Panel

**Action**: Tap filter icon

**Expected**: Filter panel opens with options:

```
Minimum Rating
├─ 3⭐   ○
├─ 3.5⭐ ○
├─ 4⭐   ⦿ (selected)
├─ 4.5⭐ ○
└─ 5⭐   ○

Maximum Price
├─ ₹1k   ○
├─ ₹3k   ○
├─ ₹5k   ⦿ (selected)
└─ ₹10k  ○

☐ Available Today Only
```

**Test Filtering**:
- Change min rating to 4.5 → List updates
- Change max price to ₹800 → Some professionals disappear
- Toggle "Available Today" → Only pros with today slots show

**Expected**: Filtering works instantly (no lag)

### Test 5: Pull-to-Refresh

**Action**: Pull down on list

**Expected**:
- Refresh spinner appears
- List re-queries matches
- Results may change (based on cache expiry)
- Spinner disappears

**Success**: List updates without errors

### Test 6: Action Buttons

**Action**: Tap "View Profile" button

**Expected**: Navigate to professional detail page

**Action**: Tap "Subscribe" button

**Expected**: Navigate to subscription flow

---

## 📊 Level 4: End-to-End Testing

### Scenario 1: New User Matching

```
1. User logs in (first time)
   ├─ No location set yet
   └─ Redirect to Phase 2: Capture Location

2. User captures GPS location in Settings
   └─ Location saved with quality score = 100

3. User navigates to "Find Professionals"
   ├─ App calls useMatchedProfessionals(userId)
   ├─ Hook calls edge function
   ├─ Edge function:
   │  ├─ Gets user location from DB
   │  ├─ Queries all professionals
   │  ├─ Scores each on 5 signals
   │  ├─ Logs each signal to match_signals_log
   │  ├─ Caches results
   │  └─ Returns sorted array
   └─ Page displays list

4. User sees professionals ranked by score
   ├─ Top match: Professional 1 (score 95)
   ├─ Second: Professional 2 (score 82)
   └─ Bottom: Professional 3 (score 45)

5. User taps "Why this match?" on #1
   └─ Sees: "Proximity 90 (30%) + Goal 95 (25%) + Budget 100 (20%) + Rating 95 (15%) + Available 100 (10%) = 94.25"

EXPECTED: ✅ User understands why matched
```

### Scenario 2: Re-Matching After Changes

```
1. User adjusts fitness goals in profile
   └─ Old matches cached (within 5 min fresh time)

2. User pulls down to refresh
   ├─ Hook detects "need fresh data"
   ├─ Edge function re-runs
   ├─ Goal alignment scores recalculated
   └─ New matches show (different order?)

EXPECTED: ✅ Matches reflect new goals
```

### Scenario 3: Admin Weight Tuning

```
1. Admin navigates to "Match Tuning" (admin panel)
   ├─ Sees current weights:
   │  ├─ Proximity: 30%
   │  ├─ Goal: 25%
   │  ├─ Budget: 20%
   │  ├─ Rating: 15%
   │  └─ Availability: 10%
   └─ Total: 100% ✓

2. Admin adjusts sliders
   ├─ Goal importance: 25% → 40%
   ├─ Proximity: 30% → 15%
   └─ Total: Still 100% ✓

3. Admin clicks "Save"
   ├─ New weights saved to match_config
   ├─ Audit logged to config_audit_log
   └─ Toast: "Weights saved!"

4. New user gets matched
   ├─ Uses new weights (40% goal, 15% proximity)
   ├─ Results different from old weights
   └─ Goal-aligned professionals rank higher

EXPECTED: ✅ Weights immediately apply to new matches
```

---

## 🔍 Debugging Commands

### Check Function Logs
```bash
supabase functions logs match-professionals --limit 100
```

**Look for**:
- ✅ "Match algorithm error:" - errors during matching
- ✅ Successful signal logging
- ✅ Cache hit/miss messages

### Query Audit Trail
```sql
-- See all signals for a user's last match
SELECT 
  signal_name,
  signal_value,
  reasoning,
  created_at
FROM match_signals_log
WHERE user_id = 'YOUR-USER-ID'
ORDER BY created_at DESC
LIMIT 50;
```

### Check Cache Status
```sql
-- How long until cache expires?
SELECT 
  professional_type,
  expires_at - NOW() as TTL_remaining,
  (results_snapshot::text || '...')::varchar(100) as preview
FROM match_cache
WHERE user_id = 'YOUR-USER-ID';
```

### Verify Weights Configuration
```sql
-- See current signal weights
SELECT * FROM match_config WHERE config_key = 'signal_weights';

-- See all weight changes
SELECT 
  admin_id,
  new_value->>'proximity' as proximity_weight,
  new_value->>'goal_alignment' as goal_weight,
  created_at
FROM config_audit_log
WHERE config_key = 'signal_weights'
ORDER BY created_at DESC;
```

### Test Each Signal Independently

**Proximity Signal**:
```sql
-- Calculate distance between user and professional
SELECT 
  ST_Distance(
    u.location_geo,
    p.location_geo
  ) / 1000 as distance_km,
  u.preferred_radius_km,
  CASE 
    WHEN ST_Distance(u.location_geo, p.location_geo) / 1000 > u.preferred_radius_km THEN 0
    ELSE 100 - (ST_Distance(u.location_geo, p.location_geo) / 1000 / u.preferred_radius_km * 100)
  END as proximity_score
FROM user_profiles u, professional_packages p
WHERE u.id = 'YOUR-USER-ID'
LIMIT 1;
```

**Goal Alignment Signal**:
```sql
-- See goal overlap
SELECT 
  array_agg(s.specialty) as professional_specialties,
  (SELECT fitness_goals FROM user_profiles WHERE id = 'YOUR-USER-ID') as user_goals,
  (SELECT COUNT(*) FROM UNNEST((SELECT fitness_goals FROM user_profiles WHERE id = 'YOUR-USER-ID')) AS goal
   WHERE goal = ANY(array_agg(s.specialty))
  ) as matching_goals
FROM professional_packages p, UNNEST(p.specialties) s
WHERE p.id = 'PRO-ID'
LIMIT 1;
```

---

## ✅ Testing Checklist

### Pre-Deployment
- [ ] All 5 code files created (ls -la shows all files)
- [ ] No TypeScript errors (npm run lint)
- [ ] Edge function deploys without error

### Post-Deployment
- [ ] Edge function responds <500ms
- [ ] Test data created in database
- [ ] Audit trail logs signals
- [ ] Cache table populates
- [ ] Weights load from config

### UI Testing
- [ ] Page loads with spinner
- [ ] Professionals list displays
- [ ] Scores show 0-100
- [ ] Color coding matches tier
- [ ] "Why?" button expands signals
- [ ] All 5 signals show correctly
- [ ] Filters work
- [ ] Pull-to-refresh works
- [ ] Buttons navigate correctly

### Admin Testing
- [ ] Weight tuning page loads
- [ ] Sliders adjust 0-100%
- [ ] Total shows real-time
- [ ] Save button enables at 100%
- [ ] Save persists to database
- [ ] Audit log records change
- [ ] New matches use new weights

### Data Integrity
- [ ] Signal scores 0-100 (no negatives)
- [ ] Overall score matches weighted sum
- [ ] Cache respects TTL
- [ ] Audit log never empty
- [ ] No data loss on refresh

---

## 🐛 Common Issues & Fixes

### Issue: "Function not found" Error
```
Error: 404 Not Found
```
**Fix**:
```bash
# Re-deploy function
supabase functions deploy match-professionals

# Verify it's listed
supabase functions list
```

### Issue: "No matches returned" / Empty list
```
Expected: 5+ professionals
Got: 0 results
```
**Fix**:
```sql
-- Check if user has location set
SELECT location_geo, location_quality_score FROM user_profiles 
WHERE id = 'YOUR-USER-ID';

-- Check if professionals exist nearby
SELECT id, name, location_geo FROM professional_packages
WHERE ST_DWithin(location_geo, 'POINT(77.2090 28.6139)'::geography, 5000);
-- (5000 meters = 5km)

-- If empty, create test data (see Level 2 above)
```

### Issue: Scores all 0
```
Expected: Varied scores (80, 45, 60)
Got: All 0 scores
```
**Fix**: Check if user has `fitness_goals` set
```sql
SELECT fitness_goals FROM user_profiles WHERE id = 'YOUR-USER-ID';
-- Should show: ARRAY['strength training', 'weight loss']

-- If empty, update:
UPDATE user_profiles 
SET fitness_goals = ARRAY['strength training', 'weight loss']
WHERE id = 'YOUR-USER-ID';
```

### Issue: Caching not working
```
Expected: Same results on second call (within 5 min)
Got: Different results each time
```
**Fix**: Check cache table
```sql
SELECT * FROM match_cache 
WHERE user_id = 'YOUR-USER-ID'
AND expires_at > NOW();

-- If empty, function may not be caching
-- Check: Are signals being logged? (means function ran)
SELECT COUNT(*) FROM match_signals_log
WHERE user_id = 'YOUR-USER-ID'
AND created_at > NOW() - INTERVAL '5 minutes';
```

### Issue: Admin weight changes not applying
```
Expected: New matches use new weights
Got: Same scores as before
```
**Fix**:
```sql
-- Verify weights were saved
SELECT config_value FROM match_config 
WHERE config_key = 'signal_weights';

-- Verify audit logged
SELECT * FROM config_audit_log 
WHERE config_key = 'signal_weights' 
ORDER BY created_at DESC LIMIT 1;

-- Clear cache (forces re-calculation with new weights)
DELETE FROM match_cache WHERE user_id = 'YOUR-USER-ID';
```

---

## 📈 Performance Benchmarks

| Metric | Target | How to Test |
|--------|--------|------------|
| Function latency | <500ms | time curl request |
| Page load time | <2s | DevTools Network tab |
| Signal calc | <100ms | Check logs |
| Cache hit | 70%+ | Query match_cache repeatedly |
| UI render | <100ms | React DevTools Profiler |

**Test**:
```bash
# Time 10 requests
for i in {1..10}; do
  time curl -X POST https://[project].supabase.co/functions/v1/match-professionals \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "test-id", "limit": 5}'
done
```

---

## 🎯 Success Criteria

✅ **All Green**: Ready for production

- [ ] Edge function deploys + responds
- [ ] Signals calculated correctly (0-100)
- [ ] Audit trail logs all signals
- [ ] Cache working (hits after first call)
- [ ] UI displays professionals + scores
- [ ] Filters work
- [ ] Signal breakdown expandable
- [ ] Admin weights tuning works
- [ ] Weights apply to new matches
- [ ] Error states handled gracefully
- [ ] No crashes or unhandled errors
- [ ] Performance <500ms target

---

## 📞 Quick Test Commands

**One-liner test**:
```bash
# Deploy + basic verification
supabase functions deploy match-professionals && \
  echo "✅ Function deployed" && \
  supabase functions list | grep match-professionals
```

**Full test flow**:
```bash
# 1. Deploy
supabase functions deploy match-professionals

# 2. Check logs
supabase functions logs match-professionals --limit 5

# 3. Query audit trail
supabase sql --query "SELECT COUNT(*) FROM match_signals_log WHERE created_at > NOW() - INTERVAL '5 minutes';"

# 4. Check cache
supabase sql --query "SELECT * FROM match_cache ORDER BY updated_at DESC LIMIT 1;"

# 5. Start app
npm run dev
```

---

**You're ready to test! Follow Level 1 → 2 → 3 → 4 for comprehensive validation.**
