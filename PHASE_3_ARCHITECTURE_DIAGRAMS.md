# Phase 3: Architecture Diagram & Visual Summary
## Professional Reviews: Database Design & UI Flow

---

## Database Schema Visualization

### Single Source of Truth: professional_reviews

```
┌─────────────────────────────────────────────────────────────┐
│          professional_reviews (THE ONLY TABLE)              │
│                   Individual Reviews                         │
├─────────────────────────────────────────────────────────────┤
│ Column                 │ Type        │ Purpose              │
├────────────────────────┼─────────────┼──────────────────────┤
│ id                     │ UUID        │ Review ID            │
│ professional_package   │ UUID        │ Which package        │
│ reviewer_user_id       │ UUID        │ Who reviewed         │
│ rating                 │ NUMERIC 3,2 │ 1-5 stars           │
│ title                  │ TEXT        │ Review title         │
│ content                │ TEXT        │ Full review text     │
│ status                 │ ENUM        │ pending/approved/... │
│ helpful_count          │ INT         │ Helpful votes        │
│ unhelpful_count        │ INT         │ Unhelpful votes      │
│ response_text          │ TEXT        │ Pro's reply          │
│ response_at            │ TIMESTAMPTZ │ When replied         │
│ created_at             │ TIMESTAMPTZ │ Submitted date       │
│ updated_at             │ TIMESTAMPTZ │ Last modified        │
└────────────────────────┴─────────────┴──────────────────────┘
```

### Denormalized Cache: professional_review_stats

```
┌─────────────────────────────────────────────────────────────┐
│       professional_review_stats (AUTO-MAINTAINED)           │
│              Aggregate Statistics                            │
├─────────────────────────────────────────────────────────────┤
│ Column                 │ Type        │ Purpose              │
├────────────────────────┼─────────────┼──────────────────────┤
│ professional_package   │ UUID PK     │ Which package        │
│ total_reviews          │ INT         │ Count of approved    │
│ avg_rating             │ NUMERIC 3,2 │ Average of approved  │
│ rating_distribution    │ JSONB       │ {"5":42,"4":18,...}  │
│ recent_reviews_3m      │ INT         │ Last 90 days count   │
│ helpful_count          │ INT         │ Total helpful votes  │
│ last_review_at         │ TIMESTAMPTZ │ Most recent approved │
│ updated_at             │ TIMESTAMPTZ │ Last recalculated    │
└────────────────────────┴─────────────┴──────────────────────┘

✅ AUTO-UPDATED BY TRIGGER
   When: professional_reviews INSERT/UPDATE/DELETE
   Filter: Only counts status='approved'
   Result: Always accurate, no manual sync
```

---

## Data Flow: Review Lifecycle

### Step 1: User Submits (Phase 1 ✅ COMPLETE)

```
IndividualUserHome.tsx
├─ User views active subscription
├─ Taps [⭐ FEEDBACK] button (capsule style)
├─ Beautiful modal opens
├─ Selects rating (1-5 stars)
├─ Writes review (multiline)
├─ Taps [Submit Feedback]
│
└─→ professional_reviews INSERT
    {
      professional_package_id: "pkg-123",
      reviewer_user_id: "user-456",
      rating: 4.5,
      title: "User Feedback",
      content: "Great coaching experience!",
      status: 'pending',           ← ← ← AWAITING APPROVAL
      created_at: now()
    }

✅ Result: Review stored with status='pending'
```

---

### Step 2: Professional Approves (Phase 3 🚀 THIS)

```
TestimonialsNative.tsx (Professional Dashboard)
├─ Query: SELECT * FROM professional_reviews 
│         WHERE status='pending' 
│         AND professional_package_id IN (my packages)
│
├─ Display: List of pending reviews
│   ├─ Reviewer: John Doe (from user_profiles)
│   ├─ Rating: ⭐⭐⭐⭐⭐ (5.0)
│   ├─ Review: "Amazing results!"
│   ├─ Date: Feb 8, 2026
│   ├─ Package: Gym Coach | Premium
│   │
│   └─ Actions:
│       ├─ [✓ APPROVE]  → Updates status → 'approved'
│       ├─ [✗ REJECT]   → Updates status → 'rejected'
│       └─ [💬 REPLY]   → Optional response
│
└─→ professional_reviews UPDATE
    {
      id: "review-789",
      status: 'pending' → 'approved'    ← TRIGGER FIRES HERE
    }

🔄 AUTOMATIC: Trigger refresh_professional_review_stats()
   1. Count: total_reviews = 66 (only 'approved')
   2. Average: avg_rating = 4.89
   3. Distribution: {"5": 42, "4": 18, "3": 5, ...}
   4. Recent: recent_reviews_3m = 15 (last 90 days)

✅ Result: Rating updated, visible to public
```

---

### Step 3: Public Views Reviews (Phase 3 🚀 THIS)

```
ProfessionalDetailNative.tsx (Professional Profile)
├─ Query 1: SELECT professional_review_stats
│           WHERE professional_package_id = 'pkg-123'
│
├─ Display: Rating Summary
│   ├─ Average: 4.9 ⭐
│   ├─ Total: 66 reviews
│   ├─ Distribution:
│   │   ⭐⭐⭐⭐⭐ 42 (63.6%) ████████████████████░
│   │   ⭐⭐⭐⭐   18 (27.3%) █████████░
│   │   ⭐⭐⭐     5 (7.6%)  ██░
│   │   ⭐⭐      0 (0%)    ░
│   │   ⭐        1 (1.5%)  ░
│   │
│   └─ "Read all reviews" link
│
├─ Query 2: SELECT professional_reviews
│           WHERE status='approved' AND professional_package='pkg-123'
│           ORDER BY created_at DESC
│           LIMIT 20
│
├─ Display: Reviews List
│   ├─ ReviewCard #1
│   │   ├─ Reviewer: John D. (optional masked)
│   │   ├─ Rating: ⭐⭐⭐⭐⭐
│   │   ├─ Review: "Amazing results in 3 months!"
│   │   ├─ Date: Feb 8, 2026
│   │   ├─ 👍 Helpful (click to vote)
│   │   │
│   │   └─ Professional Reply: (if exists)
│   │       "Thank you John! Glad you reached your goal! 💪"
│   │       (Feb 9, 2026)
│   │
│   ├─ ReviewCard #2
│   │   └─ [Similar structure]
│   │
│   └─ [...more reviews, pagination if >20]
│
└─ User Interactions:
   ├─ Click [👍 Helpful] → helpful_count++
   ├─ Click review title → View full review modal
   └─ Click professional reply → See response details

✅ Result: Users see approved reviews with ratings
```

---

### Step 4: Automatic Ranking Update (Phase 3 🚀 THIS)

```
Search & Matching (Automatic)
├─ User searches: "Weight Loss Coach"
│
├─ Query: search_professionals_by_goals()
│  ├─ SELECT professional_packages pp
│  ├─ LEFT JOIN professional_review_stats prs
│  └─ Calculate match_score:
│     = (pp.rating / 5) * 50          ← New or updated rating
│       + review_count_bonus
│       + mode_bonus
│       + specialty_bonus
│
├─ Results Sorted:
│   1. Priya Sharma  | Score: 89 | Rating: 4.9⭐ | 210 reviews
│   2. Rajesh Kumar  | Score: 78 | Rating: 4.7⭐ | 145 reviews
│   3. Maya Patel    | Score: 65 | Rating: 4.5⭐ | 82 reviews
│
└─ ✅ Updated rating automatically affects ranking
   (No manual refresh needed, trigger keeps it current)
```

---

## No Duplicate Tables: Proof

### ❌ Before (Anti-Pattern)

```
professional_reviews     (individual reviews)
    ↓
testimonials            (COPY of reviews - DUPLICATE!)
    ↓
ratings                 (aggregates - DUPLICATE!)
    ↓
review_approvals        (status tracking - DUPLICATE!)
    ↓
professional_responses  (replies - DUPLICATE!)

❌ Problems:
- 5 tables to keep in sync
- Data inconsistency risk
- Migrations become complex
- Query performance suffers
- Storage bloat
```

### ✅ After (Consolidated - Current)

```
professional_reviews         (ONE source of truth)
├─ individual_reviews table
├─ approval_status (pending|approved|rejected|archived)
├─ professional_responses (response_text + response_at)
├─ helpful_voting (helpful_count + unhelpful_count)
└─ all_needed_fields in ONE row

    ↓ (auto-maintained by trigger)

professional_review_stats    (aggregates only, never written manually)
├─ total_reviews
├─ avg_rating
├─ rating_distribution (JSONB)
├─ recent_reviews_3m
└─ last_review_at

✅ Benefits:
- ONE table: professional_reviews
- ONE truth source
- Trigger maintains aggregates automatically
- No sync issues
- Fast queries with proper indexes
- Zero duplication
```

---

## Component Architecture

### TestimonialsNative.tsx (Professional Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│             TestimonialsNative.tsx (Professional)           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Header                                                 │ │
│  │ ├─ Title: "Reviews and Ratings"                        │ │
│  │ ├─ Notification Badge: 3 pending                       │ │
│  │ └─ Subtitle: "Review, reply, and publish feedback"    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ReviewList                                             │ │
│  │ ├─ ScrollView (pending reviews sorted by date DESC)    │ │
│  │ │                                                       │ │
│  │ │ ┌──────────────────────────────────────────────────┐ │
│  │ │ │ ReviewCard                                        │ │
│  │ │ ├─ ReviewerInfo                                     │ │
│  │ │ │  ├─ Name: "John Doe"                              │ │
│  │ │ │  ├─ Type: "Gym Coach | Premium"                  │ │
│  │ │ │  └─ Date: "Feb 8, 2026"                           │ │
│  │ │ ├─ RatingStars: ⭐⭐⭐⭐⭐ (5.0)                      │ │
│  │ │ ├─ ReviewText (truncated): "Amazing coaching..."    │ │
│  │ │ ├─ ExpandButton: "Read more"                        │ │
│  │ │ └─ ActionButtons                                    │ │
│  │ │    ├─ [✓ Approve]  → UPDATE status='approved'       │ │
│  │ │    ├─ [✗ Reject]   → UPDATE status='rejected'       │ │
│  │ │    └─ [💬 Reply]   → openReplyModal()               │ │
│  │ │                                                       │ │
│  │ │ ┌──────────────────────────────────────────────────┐ │
│  │ │ │ [If Replied] Show response                        │ │
│  │ │ │ ┌────────────────────────────────────────────────┐ │
│  │ │ │ │ Professional Reply: "Thank you! Keep it up! 💪"│ │
│  │ │ │ │ (Feb 9, 2026)                                  │ │
│  │ │ │ └────────────────────────────────────────────────┘ │
│  │ │ └──────────────────────────────────────────────────┘ │
│  │ │                                                       │
│  │ │ ┌──────────────────────────────────────────────────┐ │
│  │ │ │ ReviewCard #2 (similar structure)                │ │
│  │ │ └──────────────────────────────────────────────────┘ │
│  │ │                                                       │
│  │ │ [More reviews...pagination if >50]                   │
│  │ │                                                       │
│  │ └─────────────────────────────────────────────────────┘ │
│  │                                                          │
│  │ EmptyState (if no pending):                             │
│  │ "No pending reviews. All feedback has been handled!"    │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ReplyModal (Overlay)                                   │ │
│  │ ├─ Header: "Reply to Feedback"                         │ │
│  │ ├─ OriginalReview (read-only)                          │ │
│  │ │  ├─ Reviewer: "John Doe"                             │ │
│  │ │  ├─ Rating: ⭐⭐⭐⭐⭐                               │ │
│  │ │  └─ Text: "Amazing coaching..."                      │ │
│  │ ├─ TextInput                                           │ │
│  │ │  └─ "Write your professional response..." (500 chr)  │ │
│  │ └─ Actions                                             │ │
│  │    ├─ [Cancel]  → Close modal                          │ │
│  │    └─ [Send]    → UPDATE response_text + response_at   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ActionToasts                                           │ │
│  │ ├─ "✓ Review approved! Now visible to public"         │ │
│  │ ├─ "✗ Review rejected"                                │ │
│  │ └─ "✓ Reply sent!"                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FooterNav (navigation)                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STATE MANAGEMENT:
├─ [professionalReviews] = fetch pending reviews
├─ [selectedReview] = for reply modal
├─ [replyText] = reply input
├─ [isLoading] = data fetch state
└─ [isSubmitting] = mutation state

HOOKS NEEDED:
├─ useEffect() → Load pending reviews on mount
├─ useCallback() → handleApprove(reviewId)
├─ useCallback() → handleReject(reviewId)
├─ useCallback() → handleReply(reviewId, replyText)
└─ useCallback() → handleRefresh() → refetch
```

---

### ProfessionalDetailNative.tsx (Public Display)

```
┌─────────────────────────────────────────────────────────────┐
│        ProfessionalDetailNative.tsx (Public Profile)        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ProfessionalHeader (existing)                          │ │
│  │ ├─ Photo                                               │ │
│  │ ├─ Name: "Priya Sharma"                                │ │
│  │ ├─ Title: "Fitness Coach"                              │ │
│  │ └─ Bio: "Certified trainer..."                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RatingSection (NEW)                                    │ │
│  │ ┌────────────────────────────────────────────────────┐ │
│  │ │ AverageRating                                      │ │
│  │ │ ├─ Rating: 4.9 ⭐                                  │ │
│  │ │ └─ ReviewCount: (66 reviews)                       │ │
│  │ └────────────────────────────────────────────────────┘ │
│  │                                                         │
│  │ ┌────────────────────────────────────────────────────┐ │
│  │ │ RatingDistribution                                 │ │
│  │ │ ├─ ⭐⭐⭐⭐⭐ 42 reviews (63.6%) ████████████░     │ │
│  │ │ ├─ ⭐⭐⭐⭐   18 reviews (27.3%) █████░  │ │
│  │ │ ├─ ⭐⭐⭐     5 reviews (7.6%)  ██░   │ │
│  │ │ ├─ ⭐⭐      0 reviews (0%)    ░     │ │
│  │ │ └─ ⭐        1 review (1.5%)   ░     │ │
│  │ └────────────────────────────────────────────────────┘ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ReviewsList (NEW)                                      │ │
│  │ ├─ ScrollView (approved reviews, paginated)            │ │
│  │ │                                                       │ │
│  │ │ ┌──────────────────────────────────────────────────┐ │
│  │ │ │ ReviewCard                                        │ │
│  │ │ ├─ ReviewerInfo                                     │ │
│  │ │ │  ├─ Name: "John D." (masked if privacy enabled)   │ │
│  │ │ │  └─ Date: "Feb 8, 2026"                           │ │
│  │ │ ├─ RatingStars: ⭐⭐⭐⭐⭐ (5.0)                      │ │
│  │ │ ├─ ReviewText: "Amazing results in 3 months!"       │ │
│  │ │ ├─ HelpfulButton                                    │ │
│  │ │ │  └─ "👍 Helpful (24)" → Click to toggle           │ │
│  │ │ │                                                    │ │
│  │ │ └─ ProfessionalReply (if exists)                    │ │
│  │ │    ├─ BgColor: rgba(255, 107, 53, 0.1)             │ │
│  │ │    ├─ "Coach Reply:"                                │ │
│  │ │    ├─ Reply: "Thank you John! 💪"                  │ │
│  │ │    └─ Date: "Feb 9, 2026"                           │ │
│  │ │                                                       │ │
│  │ │ ┌──────────────────────────────────────────────────┐ │
│  │ │ │ ReviewCard #2 (similar)                            │ │
│  │ │ └──────────────────────────────────────────────────┘ │
│  │ │                                                       │
│  │ │ [Pagination: "Load more reviews" if >5]              │ │
│  │ │                                                       │
│  │ └─────────────────────────────────────────────────────┘ │
│  │                                                          │
│  │ EmptyState (if no approved):                            │
│  │ "No reviews yet. Be the first to share your experience!"│
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FullReviewsModal (Optional - view all reviews)         │ │
│  │ └─ Shows all approved reviews with full text           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STATE MANAGEMENT:
├─ [stats] = professional_review_stats
├─ [reviews] = professional_reviews (approved)
├─ [page] = pagination cursor
├─ [isLoading] = data fetch state
└─ [userHelpfulReviews] = track which user marked helpful

HOOKS NEEDED:
├─ useEffect() → Load stats + reviews on mount
├─ useCallback() → handleMarkHelpful(reviewId)
├─ useCallback() → loadMoreReviews(nextPage)
└─ useCallback() → handleViewAllReviews()
```

---

## Query Performance (No N+1 Problems)

### ✅ Efficient Queries (Phase 3)

**Query 1: Pending Reviews (Professional Dashboard)**
```sql
SELECT pr.*, up.full_name, pp.name 
FROM professional_reviews pr
LEFT JOIN user_profiles up ON pr.reviewer_user_id = up.user_id
LEFT JOIN professional_packages pp ON pr.professional_package_id = pp.id
WHERE pp.owner_user_id = ? AND pr.status = 'pending'
ORDER BY pr.created_at DESC

✅ Index: idx_professional_reviews_status
   └─ (professional_package_id, status)
   └─ One scan, no sequential check
   └─ <50ms typical
```

**Query 2: Approved Reviews (Public Display)**
```sql
SELECT pr.*, up.full_name
FROM professional_reviews pr
LEFT JOIN user_profiles up ON pr.reviewer_user_id = up.user_id
WHERE pr.professional_package_id = ? 
  AND pr.status = 'approved'
ORDER BY pr.created_at DESC
LIMIT 20

✅ Index: idx_professional_reviews_package
   └─ One scan with filter
   └─ <30ms typical
```

**Query 3: Rating Stats (Profile Display)**
```sql
SELECT * FROM professional_review_stats
WHERE professional_package_id = ?

✅ Primary key lookup
   └─ Direct index access
   └─ <10ms typical
```

### ❌ Avoid (Would create N+1)

```sql
-- ❌ BAD: Separate query per review
SELECT * FROM professional_reviews WHERE professional_package_id = ?
FOR EACH review:
  SELECT * FROM user_profiles WHERE user_id = ?  ← N+1!

-- ✅ GOOD: Single query with join
SELECT pr.*, up.full_name 
FROM professional_reviews pr
LEFT JOIN user_profiles up ON ...
WHERE pr.professional_package_id = ?
```

---

## Summary Table: What to Build

| Component | Location | Phase | Effort | Status |
|---|---|---|---|---|
| **TestimonialsNative Integration** | TestimonialsNative.tsx | 3.1 | 3-4h | 🚀 Next |
| - Remove mock data | - | - | 0.5h | - |
| - Fetch pending reviews | - | - | 1h | - |
| - Review cards UI | - | - | 1.5h | - |
| - Approve/Reject/Reply | - | - | 1h | - |
| **ProfessionalDetail Integration** | ProfessionalDetailNative.tsx | 3.2 | 3-4h | 🚀 Next |
| - Rating section | - | - | 1.5h | - |
| - Reviews list | - | - | 1.5h | - |
| - Helpful voting | - | - | 1h | - |
| **Aggregation Testing** | Database | 3.3 | 1-2h | 🚀 Next |
| - Verify trigger | - | - | 0.5h | - |
| - Test search ranking | - | - | 1.5h | - |

---

## Database: ZERO CHANGES NEEDED ✅

```sql
-- NO NEW MIGRATIONS
-- NO NEW TABLES
-- NO NEW COLUMNS
-- NO TRIGGER CHANGES
-- All tables ready in migration 20260209000000_phase_2_foundation.sql

✅ professional_reviews          (exists, status column supports workflow)
✅ professional_review_stats     (exists, auto-maintained by trigger)
✅ Indexes                        (exists, optimized for queries)
✅ Trigger                        (exists, auto-maintains stats)
✅ RLS Policies                   (exists, if configured)

🚀 Ready to implement UI immediately
```

