# Phase 3: Match Algorithm & Explainability Roadmap

## 🎯 Phase 3 Overview

Implement the core matching algorithm that powers Supfit's hyperlocal AI marketplace:
- **What**: Rule-based 5-signal scoring engine for professional-user matching
- **Why**: Convert location data (Phase 2) into ranked matches
- **By When**: Ready to start immediately (Phase 2 fully unblocks Phase 3)
- **Follow**: Amazon (ranking algorithms), Meta (explainability), Google (quality signals)

---

## 📋 Phase 3 Tasks (In Order)

### Task 1️⃣: Match Algorithm Edge Function
**File**: `supabase/functions/match-professionals/index.ts`  
**Type**: Deno edge function (Supabase)  
**Time**: ~2 hours  

**Input**:
```typescript
{
  user_id: string;
  professional_type?: 'coach' | 'nutritionist' | 'physiotherapist' | 'yoga' | 'gym';
  limit?: number;  // default 10
  filters?: {
    min_rating?: number;  // 1-5 stars
    max_price?: number;
    available_today?: boolean;
  };
}
```

**Algorithm** (5-signal scoring):
```
PROXIMITY (30% weight):
  - Get user location: call get_user_location_with_fallback()
  - For each professional within preferred_radius_km:
    * distance_km = ST_Distance_Sphere(user.location_geo, prof.location_geo)
    * score = MAX(0, 100 - (distance_km / radius_km * 100))
    * Adjust by user.location_quality_score (high quality = higher weight)

GOAL ALIGNMENT (25% weight):
  - User fitness_goals: ['strength training', 'weight loss']
  - Professional specialties: ['strength training', 'cardio', 'nutrition']
  - Overlap TF-IDF: similarity(goals, specialties)
  - score = (overlap_count / total_goals) * 100

BUDGET FIT (20% weight):
  - user.budget_min ≤ professional.price ≤ user.budget_max
  - score = 100 if fit, 0 if not (binary)
  - Explanation: "Within budget" or "₹X over budget"

RATING & REVIEWS (15% weight):
  - Normalize professional.rating (0-5 stars) to 0-100
  - score = (rating / 5) * 100
  - Bonus if review_count > 10: +5 points
  
AVAILABILITY (10% weight):
  - Check professional.available_slots vs user.schedule
  - score = 100 if slot available today/tomorrow
  - score = 50 if available this week
  - score = 0 if no availability
```

**Output**:
```typescript
{
  professional_id: string;
  name: string;
  location: { lat, lng };
  distance_km: number;
  price: number;
  rating: number;
  overall_score: number;  // 0-100
  signal_breakdown: {
    proximity: { score, weight, explanation };
    goal_alignment: { score, weight, explanation };
    budget_fit: { score, weight, explanation };
    rating: { score, weight, explanation };
    availability: { score, weight, explanation };
  };
  matched_at: timestamp;
}[]
```

**Logging**: Insert each signal calculation into `match_signals_log`:
```sql
INSERT INTO match_signals_log (
  user_id, 
  signal_name, 
  signal_value,
  reasoning,
  created_at
) VALUES (
  $1, 
  'proximity',  -- or 'goal_alignment', 'budget_fit', etc
  $2,           -- score (0-100)
  $3,           -- JSON: { distance_km, radius_km, quality_score, ... }
  NOW()
)
```

**Caching** (Phase 3 Adaptive Cache):
```sql
UPSERT INTO match_cache (
  user_id, 
  professional_type,
  results_snapshot,  -- store output JSON
  expires_at         -- TTL based on cohort
)
VALUES (
  $1, $2, $3,
  NOW() + INTERVAL '6 hours'  -- if high activity
  -- OR NOW() + INTERVAL '72 hours'  -- if low activity
)
```

---

### Task 2️⃣: Frontend Hook
**File**: `src/hooks/useMatchedProfessionals.ts`  
**Type**: React/React Native hook  
**Time**: ~1 hour  

**Implementation**:
```typescript
export function useMatchedProfessionals(
  userId: string,
  professionalType?: string,
  filters?: MatchFilters
) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['professionals', userId, professionalType, filters],
    queryFn: async () => {
      const response = await fetch(
        `https://${SUPABASE_URL}/functions/v1/match-professionals`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${supabaseAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            professional_type: professionalType,
            filters: filters
          })
        }
      );
      return response.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 30 * 60 * 1000,  // 30 minutes
  });
}
```

**Usage**:
```typescript
const { data: professionals, isLoading, error } = useMatchedProfessionals(
  userId,
  'coach',
  { min_rating: 4, max_price: 5000 }
);

professionals?.forEach(prof => {
  console.log(`${prof.name}: ${prof.overall_score}/100`);
  console.log(`  📍 ${prof.distance_km} km away`);
  console.log(`  💪 Goal alignment: ${prof.signal_breakdown.goal_alignment.score}/100`);
});
```

---

### Task 3️⃣: Match Card Component
**File**: `src/components/MatchedProfessionalCard.tsx`  
**Type**: React Native component  
**Time**: ~1.5 hours  

**UI Layout**:
```
┌─────────────────────────────────┐
│ [Profile Photo]  Name           │
│                  ⭐⭐⭐⭐⭐ (4.8)│
│                  📍 1.2 km away  │
│                  ₹500/session    │
├─────────────────────────────────┤
│ 💪 Strength Training, Weight Loss│
│ 📅 Available Today at 3:00 PM    │
├─────────────────────────────────┤
│ Why this match: 82/100 score     │
│ [Tap to expand signal breakdown] │
│ ┌─────────────────────────────────┐│
│ │ 📍 Proximity     30/100 (30%)   ││
│ │ 💪 Goal Aligned   95/100 (25%)  ││
│ │ 💵 Budget Fit    100/100 (20%)  ││
│ │ ⭐ Rating         90/100 (15%)  ││
│ │ 📅 Available     100/100 (10%)  ││
│ └─────────────────────────────────┘│
├─────────────────────────────────┤
│ [View Profile]  [Subscribe]     │
└─────────────────────────────────┘
```

**Props**:
```typescript
interface MatchedProfessionalCardProps {
  professional: MatchResult;
  onViewProfile: (id: string) => void;
  onSubscribe: (id: string) => void;
}
```

**Logic**:
```typescript
export function MatchedProfessionalCard({
  professional,
  onViewProfile,
  onSubscribe,
}: MatchedProfessionalCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Color based on score
  const scoreColor = professional.overall_score >= 80 
    ? '#34C759'  // Green
    : professional.overall_score >= 60 
    ? '#FF9500'  // Orange
    : '#FF6B6B'; // Red
  
  return (
    <Card>
      <Header>
        <Image src={professional.avatar} />
        <Name>{professional.name}</Name>
        <Rating>{professional.rating} ⭐</Rating>
        <Distance>{professional.distance_km} km</Distance>
      </Header>
      
      <Body>
        <Price>₹{professional.price}/session</Price>
        <Specialties>{professional.specialties.join(', ')}</Specialties>
        <Availability>{professional.available_slot}</Availability>
      </Body>
      
      <SignalSummary>
        <ScoreText color={scoreColor}>
          {professional.overall_score}/100 match
        </ScoreText>
        <Button onPress={() => setShowBreakdown(!showBreakdown)}>
          Why this match?
        </Button>
        
        {showBreakdown && (
          <SignalBreakdown signals={professional.signal_breakdown} />
        )}
      </SignalSummary>
      
      <Footer>
        <Button onPress={() => onViewProfile(professional.id)}>
          View Profile
        </Button>
        <Button onPress={() => onSubscribe(professional.id)}>
          Subscribe
        </Button>
      </Footer>
    </Card>
  );
}
```

---

### Task 4️⃣: Explainability UI
**File**: `src/components/SignalBreakdown.tsx`  
**Type**: React Native component  
**Time**: ~1 hour  

**Display Each Signal**:
```typescript
const SignalBreakdown = ({ signals }) => {
  return (
    <View>
      {signals.map(signal => (
        <SignalRow key={signal.name}>
          <Icon>{signal.icon}</Icon>
          <Label>{signal.label}</Label>
          <Score>{signal.score}/100</Score>
          <Weight>{signal.weight}%</Weight>
          <Explanation>{signal.explanation}</Explanation>
        </SignalRow>
      ))}
    </View>
  );
};
```

**Example Output Format**:
```
📍 Proximity: 30/100 (30% weight)
   1.2 km within your 5 km preference
   • Quality: High accuracy GPS

💪 Goal Alignment: 95/100 (25% weight)
   ✓ Strength Training (exact match)
   ✓ Weight Loss (exact match)
   • 100% goal overlap

💵 Budget Fit: 100/100 (20% weight)
   ₹500/session within ₹300-₹800 budget
   • Exact fit

⭐ Rating: 90/100 (15% weight)
   4.8 stars from 24 reviews
   • Bonus: +5 for 10+ reviews

📅 Availability: 100/100 (10% weight)
   Available today at 3:00 PM
```

---

### Task 5️⃣: Matching Page
**File**: `src/pages/MatchedProfessionals.tsx`  
**Type**: React Native page  
**Time**: ~1.5 hours  

**Features**:
- Load user location from Phase 2
- Fetch matches via `useMatchedProfessionals` hook
- Filter by professional type (coach, nutritionist, etc)
- Sort by score (highest first)
- Pull-to-refresh to recalculate matches
- Infinite scroll pagination

---

### Task 6️⃣: Weight Tuning Dashboard (Optional)
**File**: `src/pages/admin/MatchWeightTuning.tsx`  
**Type**: React Native admin page  
**Time**: ~2 hours  

**UI**: Sliders to adjust signal weights:
```
Proximity:       ████░░░░░░  30%
Goal Alignment:  █████░░░░░  25%
Budget Fit:      ████░░░░░░  20%
Rating:          ███░░░░░░░  15%
Availability:    ██░░░░░░░░  10%

[Save Config]
```

**Backend**: Update `match_config` table + log to `config_audit_log`

---

## 🔄 Task Dependency Order

```
Task 1: Edge Function (algorithm)
   ↓
   └─→ Task 2: Hook (binds function to frontend)
        ↓
        ├─→ Task 3: Card Component (displays result)
        │           ↓
        │           └─→ Task 4: Explainability (shows signals)
        │
        └─→ Task 5: Matching Page (UI integration)
                    ↓
                    └─→ Task 6: Weight Tuning (optional, admin only)
```

**Critical Path** (Tasks 1-4 must be done in order):
1. Algorithm function must work before UI
2. UI code depends on function output
3. Card displays function results
4. Explainability breaks down those results

---

## 🚀 Quick Start Command

To begin Phase 3 immediately:

```bash
# 1. Create edge function stub
supabase functions new match-professionals

# 2. Create React hook file
mkdir -p src/hooks
touch src/hooks/useMatchedProfessionals.ts

# 3. Create component files
touch src/components/MatchedProfessionalCard.tsx
touch src/components/SignalBreakdown.tsx

# 4. Create page file
touch src/pages/MatchedProfessionals.tsx

# 5. Run tests
npm run dev
```

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Algorithm accuracy | 90%+ matches within user radius | Test on 10 users × 5 pros = 50 matches |
| Signal contribution | Each signal should affect score 10-30% | Check signal_breakdown variance |
| Query latency | <500ms edge function | Chrome DevTools network tab |
| Cache hit rate | 70%+ reused results | Log cache hits vs misses |
| Explainability | 100% of matches show signals | Every card has breakdown |

---

## 🔗 Phase 3 Dependencies

**Consumes from Phase 2**:
- ✅ `user_profiles.location_geo` (GEOGRAPHY point)
- ✅ `user_profiles.location_quality_score` (0-100)
- ✅ `professional_packages.location_geo` (GEOGRAPHY point)
- ✅ `match_signals_log` (audit trail)
- ✅ `city_centroids` (fallback locations)

**Produces for Phase 4** (Reviews & Refinement):
- 📤 `match_results` (ranked array)
- 📤 `signal_breakdown` (explainability)
- 📤 `user_activity_log` (engagement)

---

## ⚙️ Implementation Standards

**Follow Meta's Explainability Framework**:
- ✅ Show why: "Why is this professional ranked #1?"
- ✅ Show signals: Break down 5 signals
- ✅ Show weights: Which signal influenced most
- ✅ Show alternatives: What if signal changed?

**Follow Amazon's Ranking Algorithm**:
- ✅ Multi-signal: Don't rely on single metric
- ✅ Composite score: Weight signals, blend them
- ✅ Audit trail: Log every calculation for transparency
- ✅ A/B test ready: Easy to tweak weights

**Follow Google's Quality Signals**:
- ✅ Recency: Prefer fresh data (Phase 2 quality score)
- ✅ Authority: Rating + review count matter
- ✅ Relevance: Goal alignment is primary
- ✅ Freshness: Availability checked daily

---

## ✅ Phase 3 is Ready to Start!

All Phase 2 infrastructure in place:
- Database procedures ready ✅
- Location data available ✅
- Quality scoring implemented ✅
- Audit logging enabled ✅
- Caching layer ready ✅

**Next Step**: Tell me "start phase 3" and I'll implement all tasks in sequence!

---

## 📞 Reference

- Phase 2 Quick Reference: [PHASE_2_QUICK_REFERENCE.md](PHASE_2_QUICK_REFERENCE.md)
- Phase 2 Integration Guide: [PHASE_2_LOCATION_INTEGRATION_GUIDE.md](PHASE_2_LOCATION_INTEGRATION_GUIDE.md)
- Phase 2 Deployment Report: [PHASE_2_DEPLOYMENT_REPORT.md](PHASE_2_DEPLOYMENT_REPORT.md)
