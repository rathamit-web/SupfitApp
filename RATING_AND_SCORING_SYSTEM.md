# Rating & Scoring System Documentation

## Overview

The Supfit platform implements a **comprehensive rating and scoring system** for professionals (Coaches & Dietitians). This document explains:
- How ratings are collected, calculated, and stored
- How ratings contribute to match scoring
- How ratings are used in search filtering and sorting
- Real-world examples and edge cases

---

## Table of Contents

1. [Data Structure](#data-structure)
2. [Rating Calculation Flow](#rating-calculation-flow)
3. [Match Scoring Formula](#match-scoring-formula)
4. [Search Filtering & Sorting](#search-filtering--sorting)
5. [UI Display](#ui-display)
6. [Real-World Example](#real-world-example)
7. [Star Distribution](#star-distribution)
8. [Edge Cases](#edge-cases)
9. [Performance Optimization](#performance-optimization)
10. [API Reference](#api-reference)

---

## Data Structure

### Database Tables

#### 1. `professional_reviews` - Individual Reviews

**Purpose:** Stores every client review/rating for a professional

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Review ID |
| `professional_package_id` | UUID | Links to professional_packages table |
| `reviewer_user_id` | UUID | Client who wrote the review |
| `reviewer_name` | TEXT | Client's name (for display) |
| `rating` | NUMERIC(3,2) | 0.0 to 5.0 stars |
| `title` | TEXT | Review title (optional) |
| `content` | TEXT | Review text |
| `status` | ENUM('pending', 'approved', 'rejected') | Moderation status |
| `helpful_count` | INT | How many found it helpful |
| `created_at` | TIMESTAMP | Review submission date |
| `updated_at` | TIMESTAMP | Last modification date |

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "professional_package_id": "660e8400-e29b-41d4-a716-446655440001",
  "reviewer_name": "Rajesh Kumar",
  "rating": 5.0,
  "title": "Excellent coach!",
  "content": "Priya helped me lose 10kg in 3 months...",
  "status": "approved",
  "helpful_count": 24,
  "created_at": "2026-01-15T10:30:00Z"
}
```

#### 2. `professional_review_stats` - Aggregated Statistics

**Purpose:** Denormalized aggregate of all reviews (for fast queries)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Stats ID |
| `professional_package_id` | UUID | Links to professional_packages |
| `total_reviews` | INT | Total count of approved reviews |
| `avg_rating` | NUMERIC(3,2) | Average rating (0.0-5.0) |
| `rating_distribution` | JSONB | Count by star: `{"5": 42, "4": 18, ...}` |
| `recent_reviews_3m` | INT | Reviews from last 90 days |
| `last_review_at` | TIMESTAMP | Most recent review date |
| `updated_at` | TIMESTAMP | Stats last recalculated |

**Example Data:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "professional_package_id": "660e8400-e29b-41d4-a716-446655440001",
  "total_reviews": 66,
  "avg_rating": 4.89,
  "rating_distribution": {
    "5": 42,
    "4": 18,
    "3": 5,
    "2": 0,
    "1": 1
  },
  "recent_reviews_3m": 15,
  "last_review_at": "2026-02-08T14:22:00Z",
  "updated_at": "2026-02-08T14:22:15Z"
}
```

#### 3. `professional_packages` - Denormalized Rating Cache

**Purpose:** Quick access to rating during search (avoids joins)

| Column | Type | Description |
|--------|------|-------------|
| `rating` | NUMERIC(3,2) | Copy of `professional_review_stats.avg_rating` |
| `review_count` | INT | Copy of `professional_review_stats.total_reviews` |

---

## Rating Calculation Flow

### Step 1: User Submits Review

**Location:** `ProfessionalDetailNative.tsx` (Line 650-680)

```typescript
// User taps "Write Review" → fills form → submits
const handleSubmitReview = async () => {
  try {
    const reviewData = {
      professional_package_id: professionalId,
      reviewer_user_id: userId,
      reviewer_name: reviewerName,
      rating: selectedReview.rating,  // 1-5 stars
      title: reviewTitle,
      content: reviewContent,
      status: 'pending'  // Awaits moderation
    };

    // Insert into database
    await supabaseClient
      .from('professional_reviews')
      .insert([reviewData]);

    Toast.show('Review submitted!', {
      duration: Toast.durations.SHORT
    });
  } catch (error) {
    console.error('Error submitting review:', error);
  }
};
```

### Step 2: Automatic Trigger - `refresh_professional_review_stats()`

**Location:** `supabase/migrations/20260209000000_phase_2_foundation.sql` (Line 120-210)

When a review is inserted/updated/deleted, PostgreSQL trigger automatically:

#### Step 2a: Count Approved Reviews
```sql
SELECT COUNT(*) INTO v_total_reviews
FROM public.professional_reviews
WHERE professional_package_id = v_package_id 
  AND status = 'approved';
-- Example result: 66
```

#### Step 2b: Calculate Average Rating
```sql
SELECT AVG(rating)::NUMERIC(3, 2) INTO v_avg_rating
FROM public.professional_reviews
WHERE professional_package_id = v_package_id 
  AND status = 'approved';
-- Example result: 4.89
-- Calculation: (5+5+5+...+4+3) / 66 = 4.89
```

#### Step 2c: Count Recent Reviews (90 Days)
```sql
SELECT COUNT(*) INTO v_recent_3m
FROM public.professional_reviews
WHERE professional_package_id = v_package_id 
  AND status = 'approved'
  AND created_at >= NOW() - INTERVAL '90 days';
-- Example result: 15 (shows if professional is actively getting new reviews)
```

#### Step 2d: Build Star Distribution
```sql
WITH rating_counts AS (
  SELECT
    COALESCE(FLOOR(rating)::INT, 5) AS star,
    COUNT(*) AS cnt
  FROM public.professional_reviews
  WHERE professional_package_id = v_package_id 
    AND status = 'approved'
  GROUP BY FLOOR(rating)::INT
)
SELECT jsonb_object_agg(
  CAST(star AS TEXT),
  cnt::TEXT
) INTO v_distribution
FROM full_distribution;

-- Example result:
-- {"5": "42", "4": "18", "3": "5", "2": "0", "1": "1"}
```

### Step 3: Store Aggregated Stats

```sql
INSERT INTO public.professional_review_stats (
  professional_package_id,
  total_reviews,
  avg_rating,
  rating_distribution,
  recent_reviews_3m,
  last_review_at
)
VALUES (
  v_package_id,
  v_total_reviews,           -- 66
  v_avg_rating,              -- 4.89
  v_distribution,            -- JSONB
  v_recent_3m,               -- 15
  (SELECT MAX(created_at)...)-- 2026-02-08
)
ON CONFLICT (professional_package_id) DO UPDATE SET
  total_reviews = v_total_reviews,
  avg_rating = v_avg_rating,
  rating_distribution = v_distribution,
  recent_reviews_3m = v_recent_3m,
  last_review_at = ...,
  updated_at = now();
```

### Step 4: Update Professional Profile Rating Cache

```sql
UPDATE public.professional_packages
SET 
  rating = (
    SELECT avg_rating 
    FROM professional_review_stats 
    WHERE professional_package_id = $1
  ),
  review_count = (
    SELECT total_reviews 
    FROM professional_review_stats 
    WHERE professional_package_id = $1
  )
WHERE id = $1;
```

---

## Match Scoring Formula

### Overview

The **Match Score (0-100 points)** determines ranking in search results. It combines:
- Professional rating credibility (50 pts)
- Review volume credibility (10 pts)
- Preferred mode match (15 pts)
- Goal/specialty alignment (25 pts)

### Formula Breakdown

**Location:** `supabase/migrations/20260207160000_search_criteria_schema.sql` (Line 172-185)

```sql
match_score = (
  -- 1. RATING COMPONENT: 0-50 pts
  COALESCE(
    ROUND((pp.rating::NUMERIC / 5) * 50), 
    0
  )::INT +

  -- 2. REVIEW COUNT COMPONENT: 0-10 pts
  CASE 
    WHEN pp.review_count >= 50 THEN 10
    WHEN pp.review_count >= 20 THEN 7
    WHEN pp.review_count >= 5 THEN 4
    ELSE 0
  END +

  -- 3. MODE BONUS: 0-15 pts
  CASE 
    WHEN p_preferred_mode IS NOT NULL 
      AND pp.mode && p_preferred_mode THEN 15
    ELSE 0
  END +

  -- 4. SPECIALTY OVERLAP: 0-25 pts
  (
    COALESCE(
      array_length(
        array_intersect(pp.specialties, p_goal_categories),
        1
      ),
      0
    ) * 5
  )
)
```

### Component Details

| Component | Points | Weight | How It's Calculated |
|-----------|--------|--------|---------------------|
| **Rating** | 0-50 | 50% | `(avg_rating / 5) × 50` |
| **Review Credibility** | 0-10 | 10% | Based on review count volume |
| **Mode Match** | 0-15 | 15% | Does professional offer preferred mode? |
| **Specialty Alignment** | 0-25 | 25% | Number of matching specialties |

### Detailed Breakdown

#### 1. Rating Component: 0-50 pts

```typescript
rating_score = (avg_rating / 5.0) * 50

Examples:
- 5.0 rating → (5.0 / 5) * 50 = 50 pts ⭐⭐⭐⭐⭐
- 4.5 rating → (4.5 / 5) * 50 = 45 pts ⭐⭐⭐⭐
- 4.0 rating → (4.0 / 5) * 50 = 40 pts ⭐⭐⭐⭐
- 3.5 rating → (3.5 / 5) * 50 = 35 pts ⭐⭐⭐
- 0 rating  → (0 / 5) * 50 = 0 pts (no reviews)
```

**Why 50 points?**
- Rating is the **most important signal** of professional quality
- A highly-rated professional (4.5+) should score 45+ out of 100
- This heavily favors professionals with strong track records

#### 2. Review Count Credibility: 0-10 pts

```typescript
review_count_score = CASE review_count
  WHEN >= 50: 10 pts  // Elite - proven track record
  WHEN >= 20: 7 pts   // Strong - many satisfied clients
  WHEN >= 5:  4 pts   // Fair - some customers
  ELSE:       0 pts   // New - no reviews yet

Examples:
- 100 reviews → 10 pts
- 50 reviews  → 10 pts
- 20 reviews  → 7 pts
- 5 reviews   → 4 pts
- 0 reviews   → 0 pts
```

**Why This Matters:**
- A 5.0 rating with 1 review is not as trustworthy as 5.0 with 50 reviews
- This bonus encourages credible professionals with volume
- Protects against fake reviews (1 perfect review = 0 bonus)

#### 3. Preferred Mode Match: 0-15 pts

```typescript
mode_match_score = CASE preferred_mode
  WHEN professional_offers_mode: 15 pts
  ELSE: 0 pts

Examples:
- User wants "Online" → Professional offers "Online" → +15 pts
- User wants "In-person" → Professional only offers "Online" → 0 pts
- User wants "Either" → Professional offers "Online + In-person" → +15 pts
```

**Why This Matters:**
- Mode preference is critical to user satisfaction
- Offering preferred mode = higher match score
- Ensures user gets exactly what they're looking for

#### 4. Specialty Alignment: 0-25 pts

```typescript
specialty_score = number_of_matching_specialties * 5

Examples:
- 5 matching specialties → 5 * 5 = 25 pts
- 4 matching specialties → 4 * 5 = 20 pts
- 3 matching specialties → 3 * 5 = 15 pts
- 2 matching specialties → 2 * 5 = 10 pts
- 1 matching specialty  → 1 * 5 = 5 pts
- 0 matching specialties → 0 * 5 = 0 pts
```

**Why This Matters:**
- Professional's expertise should align with user's goals
- More overlapping specialties = better match
- Incentivizes rounded professionals

---

## Real-World Example

### Scenario: User Searching for Weight Loss Coach

**User Profile:**
- Goal: Weight Loss
- Preferred Mode: Online
- Location: Bangalore (2 km radius)
- Max Price: ₹10,000/month
- Min Rating: 4.0⭐

### Professional 1: Priya Sharma

**Profile:**
- Specialties: Weight Loss, Nutrition, Gym Training
- Mode: Online + In-person
- Price: ₹5,000/month
- Rating: 4.9⭐
- Reviews: 210
- Distance: 2 km

**Match Score Calculation:**

| Component | Calculation | Points |
|-----------|-------------|--------|
| **Rating** | (4.9 / 5) × 50 | **49 pts** |
| **Review Count** | 210 ≥ 50 | **+10 pts** |
| **Mode Match** | Online offered | **+15 pts** |
| **Specialty Match** | 3 matches × 5 | **+15 pts** |
| | **TOTAL MATCH SCORE** | **89/100** 🏆 |

### Professional 2: Rajesh Kumar

**Profile:**
- Specialties: Weight Loss, Posture
- Mode: In-person only
- Price: ₹4,000/month
- Rating: 4.8⭐
- Reviews: 45
- Distance: 1.5 km

**Match Score Calculation:**

| Component | Calculation | Points |
|-----------|-------------|--------|
| **Rating** | (4.8 / 5) × 50 | **48 pts** |
| **Review Count** | 45 ≥ 20 | **+7 pts** |
| **Mode Match** | Only in-person (user wants online) | **0 pts** |
| **Specialty Match** | 2 matches × 5 | **+10 pts** |
| | **TOTAL MATCH SCORE** | **65/100** |

### Professional 3: Maya Patel

**Profile:**
- Specialties: Weight Loss, Nutrition, Yoga, Core Strength
- Mode: Online
- Price: ₹7,000/month
- Rating: 4.7⭐
- Reviews: 120
- Distance: 3.5 km (outside filter)

**Match Score Calculation:**
- ❌ **Filtered Out** - Distance 3.5 km > 2 km radius

---

## Search Filtering & Sorting

### Filter Criteria

**Location:** `supabase/migrations/20260207160000_search_criteria_schema.sql` (Line 195-205)

```sql
WHERE
  pp.status = 'active' AND
  pp.visibility = 'public' AND
  pp.rating >= p_min_rating AND              -- Rating filter
  pp.price <= p_max_price AND                -- Price filter
  ST_Distance(v_user_location, pp.location_geo) / 1000.0 <= p_radius_km AND
  (pp.specialties && p_goal_categories::TEXT[] OR 
   array_length(p_goal_categories, 1) IS NULL) AND
  (p_preferred_mode IS NULL OR pp.mode && p_preferred_mode)
```

### Sorting Priority

```sql
ORDER BY 
  match_score DESC,      -- Primary: Higher match score first
  pp.rating DESC,        -- Secondary: If match tied, higher rating wins
  distance_km ASC        -- Tertiary: If match & rating tied, closer location wins
```

### Example Result Set

Given the scenario above:

| Rank | Professional | Match Score | Rating | Distance | Reason |
|------|--------------|-------------|--------|----------|--------|
| 1️⃣ | **Priya Sharma** | **89** | 4.9⭐ | 2 km | Highest match (best on all factors) |
| 2️⃣ | **Rajesh Kumar** | **65** | 4.8⭐ | 1.5 km | Lower match (no online mode) |
| 3️⃣ | **Maya Patel** | — | 4.7⭐ | 3.5 km | ❌ Filtered out (distance > 2km) |

---

## UI Display

### Professional Detail Screen

**Location:** `SupfitApp/src/screens/ProfessionalDetailNative.tsx`

#### Display Format: Rating with Review Count

```tsx
// Line 290-293
<Text style={styles.rating}>
  {professional.rating ? professional.rating.toFixed(1) : 'N/A'}
  ⭐
</Text>
<Text style={styles.reviewCount}>
  ({professional.review_count} reviews)
</Text>

// Output:
// 4.9 ⭐
// (210 reviews)
```

#### In Statistics Section

```tsx
// Line 350-352
<View style={styles.signalItem}>
  <View style={[styles.signalDot, { backgroundColor: '#FFB800' }]} />
  <View style={styles.signalContent}>
    <Text style={styles.signalLabel}>High Rating</Text>
    <Text style={styles.signalValue}>
      {professional.rating ? professional.rating.toFixed(1) : 'N/A'} 
      stars from {professional.review_count} reviews
    </Text>
  </View>
</View>
```

### Search Results Screen

**Location:** `SupfitApp/src/screens/SearchResultsNative.tsx` (Line 98-106)

```tsx
{professional.rating && professional.rating > 0 ? (
  <View style={styles.ratingRow}>
    <Text style={styles.rating}>
      {professional.rating.toFixed(1)} 
      ({professional.review_count} reviews)
    </Text>
  </View>
) : (
  <Text style={styles.noRating}>No ratings yet</Text>
)}
```

### Review Cards

**Location:** `ProfessionalDetailNative.tsx` (Line 455-465)

```tsx
<View style={styles.ratingContainer}>
  {Array.from({ length: 5 }).map((_, i) => (
    <MaterialIcons
      key={i}
      name={i < item.rating ? 'star' : 'star-outline'}
      size={14}
      color={i < item.rating ? '#FFB800' : '#CCC'}
    />
  ))}
  <Text style={styles.ratingText}>
    {item.rating}.0 • {new Date(item.createdAt).toLocaleDateString()}
  </Text>
</View>

// Output for 4.5-star review:
// ★★★★☆ 4.0 • Feb 8, 2026
```

---

## Star Distribution

### What It Shows

The `rating_distribution` JSONB field stores a breakdown of how many reviews each rating received:

```json
{
  "5": 42,  // 42 people rated 5 stars
  "4": 18,  // 18 people rated 4 stars
  "3": 5,   // 5 people rated 3 stars
  "2": 0,   // 0 people rated 2 stars
  "1": 1    // 1 person rated 1 star
}

Total: 42 + 18 + 5 + 0 + 1 = 66 reviews
```

### Percentage Breakdown

```
⭐⭐⭐⭐⭐  42 out of 66  = 63.6%  ████████████████████░
⭐⭐⭐⭐    18 out of 66  = 27.3%  █████████░░░░░░░░░░░
⭐⭐⭐      5 out of 66   = 7.6%   ██░░░░░░░░░░░░░░░░░
⭐⭐      0 out of 66   = 0.0%   ░░░░░░░░░░░░░░░░░░░
⭐        1 out of 66   = 1.5%   ░░░░░░░░░░░░░░░░░░░
```

### Use Cases

**In Review Modal:**
- Show distribution to help users understand overall sentiment
- Let users see if most reviews are positive or mixed

**In Analytics:**
- Identify patterns (e.g., many 5s and 1s = polarized reviews)
- Detect fake reviews (all 5s with few reviews)
- Monitor quality trends over time

---

## Edge Cases

### Case 1: No Reviews Yet

**Scenario:** New professional, zero reviews submitted

**Handling:**
```typescript
if (professional.rating === null || professional.rating === 0) {
  displayText = "No rating yet";
  matchScore = 0;  // Can't score
}
```

**UI Output:**
```
Rating: "N/A"
Reviews: "(0 reviews)"
```

### Case 2: Pending Reviews

**Scenario:** User submits review, awaits moderation

**Handling:**
```sql
-- Only approved reviews count
WHERE status = 'approved'

-- Pending reviews stored but ignored in:
-- 1. avg_rating calculation
-- 2. rating_distribution
-- 3. match_score calculation
-- 4. filters
```

### Case 3: Same Match Score

**Scenario:** Two professionals with identical match scores

**Tiebreaker Priority:**
```sql
ORDER BY
  match_score DESC,    -- Both = 89
  pp.rating DESC,      -- Higher rating wins (4.9 vs 4.8)
  distance_km ASC      -- If tied rating, closer wins
```

**Example:**
```
Professional A: Score 89, Rating 4.9, Distance 2 km → Rank 1
Professional B: Score 89, Rating 4.8, Distance 1 km → Rank 2
Professional C: Score 89, Rating 4.8, Distance 1 km → Rank 2 (tied)
```

### Case 4: Rating Filter > Average Available

**Scenario:** User sets min rating 4.8⭐, but most professionals are 4.2-4.6

**Handling:**
```sql
WHERE pp.rating >= 4.8  -- Filters to very few results

-- Display: "Only 3 professionals match your criteria"
```

### Case 5: Review Deleted

**Scenario:** Admin removes inappropriate review

**Handling:**
```sql
-- Trigger automatically:
1. Recalculate avg_rating (without deleted review)
2. Rebuild rating_distribution
3. Update recent_reviews_3m
4. Update professional_packages.rating cache
```

**Result:** Profile rating updates instantly without manual refresh

### Case 6: Professional Rate Change Review

**Scenario:** Professional disputes negative review

**Handling:**
```sql
-- Admin can change status: 'approved' → 'rejected'

-- Trigger fires:
1. Removes from total_reviews count
2. Recalculates avg_rating (higher)
3. Rebuilds distribution
4. Updates profile cache
```

---

## Performance Optimization

### Indexing Strategy

**Location:** `supabase/migrations/20260209000000_phase_2_foundation.sql` (Line 49-50)

```sql
-- Speed up rating queries
CREATE INDEX idx_professional_reviews_rating
  ON public.professional_reviews(professional_package_id, rating DESC);

-- Speed up stats lookups
CREATE INDEX idx_professional_review_stats_avg_rating
  ON public.professional_review_stats(avg_rating DESC);
```

### Query Performance

#### Slow Query (Without Optimization)
```sql
-- ❌ Recalculates on every search
SELECT 
  pp.*,
  AVG(pr.rating) as avg_rating,  -- ⚠️ SLOW - aggregates all rows each time
  COUNT(pr.id) as review_count
FROM professional_packages pp
LEFT JOIN professional_reviews pr ON ...
WHERE pp.status = 'active'
ORDER BY avg_rating DESC;
-- Time: ~2-3 seconds on large datasets
```

#### Fast Query (With Denormalization)
```sql
-- ✅ Direct lookup from cache
SELECT 
  pp.*,
  prs.avg_rating,           -- ✅ FAST - already calculated
  prs.total_reviews
FROM professional_packages pp
LEFT JOIN professional_review_stats prs ON pp.id = prs.professional_package_id
WHERE pp.status = 'active'
ORDER BY prs.avg_rating DESC;
-- Time: <10ms (100x faster)
```

### Why Denormalization Works Here

| Aspect | Impact |
|--------|--------|
| **Read Heavy** | Search = read; Reviews = read often |
| **Infrequent Writes** | New reviews = rare compared to searches |
| **Calculation Cost** | AVG() on 1000s of reviews = expensive |
| **User Expectation** | Results should load in <100ms |
| **Trade-off** | Extra storage for speed = worth it |

### Cache Refresh Timing

```typescript
// Trigger runs IMMEDIATELY after:
1. Review inserted      → 0ms
2. Review updated       → 0ms
3. Review deleted       → 0ms
4. Status changed       → 0ms

// Cache updated synchronously
// No stale data risk
// No manual refresh needed
```

---

## API Reference

### Search Endpoint

**Function:** `search_professionals_by_goals`

**Location:** `supabase/migrations/20260207160000_search_criteria_schema.sql`

#### Parameters

```typescript
interface SearchParams {
  p_user_latitude: NUMERIC,           // User location (lat)
  p_user_longitude: NUMERIC,          // User location (lon)
  p_goal_categories: TEXT[],          // e.g., ['Weight Loss', 'Nutrition']
  p_preferred_mode: TEXT[],           // e.g., ['Online']
  p_radius_km: NUMERIC,               // e.g., 50
  p_min_rating: NUMERIC,              // e.g., 4.0 ⭐
  p_max_price: NUMERIC,               // e.g., 10000
  p_limit: INT                        // e.g., 20
}
```

#### Response

```typescript
interface SearchResult {
  professional_id: UUID,
  name: TEXT,
  description: TEXT,
  price: NUMERIC,
  rating: NUMERIC,              // avg_rating (4.9)
  review_count: INT,            // total_reviews (210)
  specialties: TEXT[],          // ['Weight Loss', 'Nutrition']
  mode: TEXT[],                 // ['Online', 'In-person']
  photo_url: TEXT,
  distance_km: NUMERIC,         // 2.5
  match_score: INT              // 0-100
}
```

#### Usage Example

```typescript
// In SearchResultsNative.tsx
const results = await supabaseClient
  .rpc('search_professionals_by_goals', {
    p_user_latitude: 12.9716,
    p_user_longitude: 77.5946,
    p_goal_categories: ['Weight Loss'],
    p_preferred_mode: ['Online'],
    p_radius_km: 50,
    p_min_rating: 4.0,
    p_max_price: 10000,
    p_limit: 20
  });

// results[0] = {
//   professional_id: "...",
//   name: "Priya Sharma",
//   rating: 4.9,
//   review_count: 210,
//   match_score: 89,
//   ...
// }
```

### Review Submission Endpoint

**Location:** `ProfessionalDetailNative.tsx` (Line 650-680)

#### Parameters

```typescript
interface SubmitReviewParams {
  professional_package_id: UUID,
  reviewer_user_id: UUID,
  reviewer_name: TEXT,
  rating: NUMERIC,              // 1.0 to 5.0
  title: TEXT,                  // Optional
  content: TEXT,                // Review text
  status: 'pending'             // Always starts pending
}
```

#### Response

```typescript
interface ReviewResponse {
  id: UUID,
  created_at: TIMESTAMP,
  status: 'pending'             // Awaiting moderation
}
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Review Range** | 0.0 - 5.0 stars (decimal precision) |
| **Calculation** | Automatic trigger on review add/edit/delete |
| **Update Latency** | <100ms (synchronous) |
| **Storage** | Denormalized for fast reads |
| **Match Weight** | 50% of total score (most important) |
| **Filtering** | `WHERE rating >= min_rating` |
| **Sorting** | Match → Rating → Distance (tiebreaker chain) |
| **UI Display** | "4.9 ⭐ (210 reviews)" format |
| **Distribution** | JSON breakdown of 1-5 star counts |

---

## Questions & Support

For questions about the rating system:

1. **How do I filter by rating?**
   - Use search filter slider: "Minimum Rating" (0-5 stars)

2. **Why did my rating change?**
   - New review deleted or rejected after moderation

3. **How often does rating update?**
   - Immediately when review is approved/modified

4. **Can I hide low ratings?**
   - No - all approved reviews count in average

5. **How is match score calculated?**
   - Rating (50%) + Reviews (10%) + Mode (15%) + Specialties (25%)

