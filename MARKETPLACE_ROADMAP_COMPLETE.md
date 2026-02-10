# AI-Based Marketplace for Coaches & Dietitians: Complete Implementation Roadmap

**Current Date:** February 8, 2026  
**Project:** Supfit - Professional Coaching & Nutrition Marketplace  
**Status:** Phase 1 Complete (Coach Package Management) → Phase 2-5 Roadmap Below

---

## Executive Summary

The Supfit platform has successfully completed:
- ✅ Role-based authentication (coach/dietician/individual)
- ✅ Half database schema for professional packages
- ✅ Coach-side package management UI
- ✅ Multi-criteria search function with availability filtering
- ✅ RLS policies for data isolation

**Remaining work** spans 5 major phases to achieve a production-ready, AI-powered marketplace:
1. **Phase 2 (Current):** Client Discovery & Professional Profiles
2. **Phase 3:** Booking, Payments & Subscriptions
3. **Phase 4:** Engagement & Communication
4. **Phase 5:** Analytics, AI Optimization & Scale

---

## Phase Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 5: Analytics, AI & ML (Months 4-5)                        │
│ - Advanced scoring algorithms                                    │
│ - Recommendation engine                                          │
│ - Predictive analytics                                           │
│ - A/B testing framework                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│ Phase 4: Engagement & Communication (Months 3-4)                │
│ - Real-time messaging                                            │
│ - Video consultation SDK                                         │
│ - Progress tracking                                              │
│ - Notification hub                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Booking, Payments & Subscriptions (Months 2-3)         │
│ - Payment gateway integration                                    │
│ - Subscription lifecycle                                         │
│ - Invoice & billing                                              │
│ - Refund management                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Client Discovery & Profiles (Months 1-2)               │
│ - Professional directory                                         │
│ - Advanced filtering & search UI                                 │
│ - Rating & reviews                                               │
│ - Professional profiles                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: COMPLETE ✅                                              │
│ - Auth & role management                                         │
│ - Package management (coach side)                                │
│ - Database schema & RLS                                          │
│ - Search function with scoring                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## **PHASE 2: Client Discovery & Professional Profiles**
### Timeline: Weeks 1-8 | Priority: Critical

### Overview
Clients need to find, evaluate, and understand what coaches/dietitians offer. This phase builds the "storefront" experience.

---

### 2.1 Professional Discovery Pages

#### 2.1.1 Professional Directory UI
**What:** Searchable directory of all active professionals  
**User:** Individual/Client  
**Location:** New screen: `src/screens/FindCoachesNative.tsx`

**Components:**
```typescript
interface FindCoachesScreen {
  // Search bar with multi-criteria filters
  SearchHeader
    - Goal categories (fitness, nutrition, wellness)
    - Location radius slider (0-50km)
    - Price range (₹500-₹50,000)
    - Availability filter
    - Rating filter (3.0+ stars)

  // Results list with infinite scroll
  ProfessionalCard
    - Photo, name, specialty
    - Price, rating, review count
    - "View Profile" button
    - "Quick Book" action
    - Distance badge

  // Filters sidebar (mobile drawer)
  FilterPanel
    - Advanced mode/timing preferences
    - Specialties (multi-select)
    - Languages spoken
    - Certifications/credentials
    - Response time filter
}
```

**Database Queries Needed:**
```sql
-- Current: Already exists in search_professionals_by_goals()
-- Enhancements needed:
- Add specialization filtering
- Add language support
- Add availability window filtering
- Add reputation/rating sorting
```

**API/RPC Functions:**
```
GET /search/professionals
  - params: goal_categories, location, radius, price_range, limit, offset
  - returns: ProfessionalCard[]
  
GET /search/professionals/filters
  - returns: available filters with counts
```

---

#### 2.1.2 Professional Profile Pages
**What:** Detailed view of a single coach/dietician  
**User:** Individual/Client  
**Location:** New screen: `src/screens/ProfessionalProfileNative.tsx`

**Components:**
```typescript
interface ProfessionalProfile {
  // Hero section
  HeroSection
    - Large profile photo
    - Name, title, specialty
    - Rating (stars + count)
    - "Book Now" CTA
    - Share/Favorite buttons

  // Professional info
  AboutSection
    - Bio/description (markdown)
    - Years of experience
    - Certifications & credentials
    - Languages spoken

  // Services section
  ServicesSection
    - Offered packages
    - For each package:
      - Name, price, duration
      - Features (from feature_list)
      - Availability summary
      - "Select Package" button

  // Reviews section
  ReviewsSection
    - Star distribution chart
    - Individual 5-star reviews
    - Client photos/testimonials
    - Infinite scroll
    - Filters: "Most Helpful", "Recent"

  // Availability section
  AvailabilitySection
    - Calendar view (next 30 days)
    - Available times highlighted
    - Quick-book slots
    - "Request Custom Time" link

  // Social proof
  StatsSection
    - Total clients served
    - Session completion rate
    - Average rating trend (6-month)
    - Repeat client % 

  // Contact/Action section
  CtaSection
    - "Book Package" button (primary)
    - "Message Professional" button
    - "Add to Favorites" button
    - Report/block option
}
```

**New Database Columns/Tables:**
```sql
-- Professional profiles extension
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
  bio TEXT,
  certifications JSONB DEFAULT '[]',
  languages TEXT[] DEFAULT ARRAY['English'],
  years_of_experience INT,
  profile_photo_url TEXT,
  verified_badge BOOLEAN DEFAULT FALSE,
  response_time_minutes INT;

-- Already exists but needs population:
-- coach_stats: (rating, review_count, etc)
-- professional_packages: (services offered)
```

**RPC/Functions:**
```sql
-- Get complete professional profile for display
CREATE OR REPLACE FUNCTION get_professional_profile(p_professional_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  certifications JSONB,
  years_of_experience INT,
  rating NUMERIC,
  review_count INT,
  verified BOOLEAN,
  response_time_minutes INT,
  packages JSONB,           -- Array of packages
  available_slots JSONB,    -- Next 30 days
  stats JSONB               -- Clients served, completion rate, etc
) AS $$
SELECT
  c.id,
  u.name,
  c.bio,
  c.certifications,
  c.years_of_experience,
  COALESCE(cs.rating, 0),
  COALESCE(cs.review_count, 0),
  c.verified_badge,
  c.response_time_minutes,
  -- Aggregate packages
  jsonb_agg(jsonb_build_object(
    'id', pp.id,
    'name', pp.name,
    'price', pp.price,
    'features', pp.feature_list
  )) FILTER (WHERE pp.status = 'active')::JSONB,
  -- Aggregate available slots (next 30 days)
  (SELECT generate_series(
    now()::date,
    (now() + interval '30 days')::date,
    interval '1 day'
  )),
  jsonb_build_object(
    'clients_served', cs.total_clients,
    'completion_rate', cs.completion_rate,
    'repeat_client_pct', cs.repeat_client_percentage
  )
FROM coaches c
LEFT JOIN user_profiles u ON c.user_id = u.id
LEFT JOIN coach_stats cs ON c.id = cs.coach_id
LEFT JOIN professional_packages pp ON c.id = pp.owner_user_id
WHERE c.id = p_professional_id
GROUP BY c.id, u.name, c.bio, c.certifications, cs.*;
$$ LANGUAGE SQL;
```

---

#### 2.1.3 Reviews & Ratings System
**What:** Client reviews, ratings, and testimonials for professionals

**New Database Tables:**
```sql
CREATE TABLE professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES professional_packages(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewer_name TEXT NOT NULL,
  reviewer_photo_url TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  pros JSONB DEFAULT '[]',      -- Array of strengths
  cons JSONB DEFAULT '[]',      -- Array of improvements
  would_recommend BOOLEAN,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified_buyer BOOLEAN
);

CREATE TABLE professional_review_responses (
  id UUID PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES professional_reviews(id),
  professional_id UUID NOT NULL REFERENCES users(id),
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Denormalized stats (computed daily)
CREATE TABLE professional_review_stats (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id),
  avg_rating NUMERIC(3,2),
  total_reviews INT,
  rating_distribution JSONB,    -- {5: 50, 4: 30, 3: 15, 2: 4, 1: 1}
  helpful_review_count INT,
  verified_buyer_count INT,
  would_recommend_pct NUMERIC(5,2),
  last_computed TIMESTAMPTZ
);
```

**RLS Policies:**
```sql
-- Clients can view all reviews for public professionals
CREATE POLICY professional_reviews_public_read
  ON professional_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professional_packages pp
      WHERE pp.id = professional_reviews.package_id
      AND pp.visibility = 'public'
    )
  );

-- Clients can create reviews for their own subscriptions
CREATE POLICY professional_reviews_client_create
  ON professional_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM professional_package_subscriptions pps
      WHERE pps.package_id = professional_reviews.package_id
      AND pps.client_user_id = auth.uid()
      AND pps.status IN ('active', 'completed')
    )
  );

-- Professionals can respond to reviews on their packages
CREATE POLICY professional_reviews_owner_respond
  ON professional_review_responses FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM professional_reviews pr
      LEFT JOIN professional_packages pp 
        ON pr.package_id = pp.id
      WHERE pr.id = professional_review_responses.review_id
      AND pp.owner_user_id = auth.uid()
    )
  );
```

**UI Components:**
```typescript
// Rating component
<RatingDisplay
  rating={4.5}
  reviewCount={128}
  distribution={{ 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 }}
/>

// Review card
<ReviewCard
  reviewer="Priya M."
  rating={5}
  date="2 weeks ago"
  title="Life-changing coaching!"
  pros={['Responsive', 'Knowledgeable', 'Motivating']}
  cons={['Slightly expensive']}
  verified={true}
  helpful={15}
  response="Thank you for the review..."
/>

// Submit review modal
<SubmitReviewModal
  onSubmit={(review) => submitReview(review)}
  packageName="Premium Package"
/>
```

---

### 2.2 Search & Filtering Enhancements

#### 2.2.1 Advanced Search UI
**What:** Rich filtering experience with facets and refinement

**Components:**
```typescript
interface SearchFilters {
  goals: {
    label: 'What are you looking for?'
    type: 'multi-select'
    options: [
      'Weight Loss',
      'Muscle Building',
      'General Fitness',
      'Sports Training',
      'Nutrition',
      'Wellness',
      'Injury Recovery'
    ]
  },
  specialties: {
    label: 'Specialization'
    type: 'multi-select'
    options: [] // Dynamically loaded from DB
  },
  priceRange: {
    label: 'Price (₹)'
    type: 'range-slider'
    min: 500
    max: 50000
  },
  availability: {
    label: 'When can you start?'
    type: 'select'
    options: [
      'Immediately',
      'This Week',
      'Next Week',
      'Flexible'
    ]
  },
  mode: {
    label: 'Coaching Mode'
    type: 'multi-select'
    options: [
      'Online',
      'In-person',
      'Hybrid'
    ]
  },
  timing: {
    label: 'Session Timing'
    type: 'multi-select'
    options: [
      'Early Morning (5-7 AM)',
      'Morning (7-10 AM)',
      'Afternoon (12-3 PM)',
      'Evening (5-8 PM)',
      'Night (8-10 PM)'
    ]
  },
  minRating: {
    label: 'Minimum Rating'
    type: 'star-select'
    options: [3, 3.5, 4, 4.5, 5]
  },
  location: {
    label: 'Location'
    type: 'distance-slider'
    default: 10  // km
    max: 50
  }
}
```

**Database Indexes:**
```sql
-- For fast filtering, we need these indexes
CREATE INDEX idx_professional_packages_visibility_status
  ON professional_packages(visibility, status);
CREATE INDEX idx_coaches_verified_rating
  ON coaches(verified_badge, rating DESC);
CREATE INDEX idx_professional_packages_price_range
  ON professional_packages(price);
CREATE INDEX idx_user_profiles_location_geo
  ON user_profiles USING GIST(location_geo);
```

---

#### 2.2.2 Search Function Enhancement
**What:** Enhance existing `search_professionals_by_goals` with better ML scoring

**Current Scoring (in search_professionals_by_goals):**
```sql
(
  -- Base score from rating (0-50)
  COALESCE(ROUND((pp.rating::NUMERIC / 5) * 50), 0)::INT +
  -- Bonus for reviews (0-10)
  CASE WHEN pp.review_count >= 50 THEN 10 ... +
  -- Mode match (0-15)
  CASE WHEN p_preferred_mode IS NOT NULL AND pp.mode && p_preferred_mode THEN 15 +
  -- Specialties (0-25)
  (array_length(array_intersect(...)) * 5) +
  -- Availability (0-15)
  CASE WHEN availability.next_slot <= now() + INTERVAL '3 days' THEN 15 ...
)
```

**Enhanced Scoring Model (v2):**
```sql
-- Add these factors:
- Time zone match (±5 for favorable)
- Response time (0-10) - faster = higher
- Repeat client rate (0-15) - loyalty indicator
- Recent reviews positivity (0-10) - sentiment
- Certification level (0-20) - credential quality
- Language match (±10) - communication
- Availability density (0-10) - more slots = better
- Price match to budget (±10) - value alignment
- Professional bio quality (0-5) - profile completeness

NEW FORMULA:
match_score = 
  50 * (rating / 5) +                    -- Rating (0-50)
  max(10, min(review_count / 10, 15)) +  -- Reviews (0-15)
  (CASE specialties_match WHEN true THEN 20 ELSE 0 END) +
  (CASE availability_within_window WHEN true THEN 15 ELSE 0 END) +
  (CASE mode_match WHEN true THEN 10 ELSE 0 END) +
  (CASE timing_match WHEN true THEN 15 ELSE 0 END) +
  (repeat_client_rate * 20) +            -- Loyalty (0-20)
  (response_time_score * 10) +           -- Speed (0-10)
  (language_match * 10) +                -- Communication (0-10)
  (certification_score * 20) +           -- Credentials (0-20)
  (price_affinity * 10) +                -- Value (0-10)
  (profile_completeness * 5)             -- Quality (0-5)
-- Total: 0-200
```

**Database Changes:**
```sql
-- Add computed fields to coaches/coach_stats
ALTER TABLE coach_stats ADD COLUMN IF NOT EXISTS (
  repeat_client_percentage NUMERIC(5,2) DEFAULT 0,    
  avg_response_time_minutes INT DEFAULT 0,             
  certification_level TEXT DEFAULT 'basic',            
  profile_completeness_score INT DEFAULT 0             
);

-- Add language support
CREATE TABLE professional_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES users(id),
  language TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('basic', 'fluent', 'native')), 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite search view
CREATE OR REPLACE VIEW professional_search_view AS
SELECT
  pp.id,
  pp.owner_user_id,
  pp.name,
  pp.price,
  pp.professional_type,
  cs.rating,
  cs.review_count,
  cs.repeat_client_percentage,
  cs.avg_response_time_minutes,
  (SELECT array_agg(language) FROM professional_languages WHERE professional_id = pp.owner_user_id) as languages,
  up.location_geo,
  pp.available_slots,
  cs.certification_level
FROM professional_packages pp
LEFT JOIN coach_stats cs ON ...
LEFT JOIN user_profiles up ON ...;
```

---

### 2.3 Favorites & Wishlist

**New Database Table:**
```sql
CREATE TABLE client_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  professional_id UUID NOT NULL REFERENCES users(id),
  package_id UUID REFERENCES professional_packages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, professional_id)
);

CREATE INDEX idx_client_favorites_client ON client_favorites(client_id);
```

**RLS Policy:**
```sql
CREATE POLICY client_favorites_own
  ON client_favorites
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
```

**UI Actions:**
```typescript
// Heart/star icon on professional cards
<FavoriteButton
  isFavorited={is_favorited}
  onToggle={() => toggleFavorite(professional_id)}
/>

// View in "My Favorites" collection
<FavoritesScreen
  favorites={getFavorites()}
  renderCard={(professional) => <ProfessionalCard {...professional} />}
/>
```

---

### 2.4 Professional Profile Enhancements (Coach/Dietician Side)

**What:** Coaches can manage their public-facing profile

**New Screen:** `src/screens/ManageProfessionalProfileNative.tsx`

**Components:**
```typescript
interface ManageProfileForm {
  // Basic info
  profilePhoto: FileUpload,
  bio: TextArea,
  specialization: MultiSelect,
  yearsOfExperience: NumberInput,
  
  // Credentials
  certifications: DynamicArray,
  languages: MultiSelect,
  
  // Mode & Availability
  preferredModes: MultiSelect,
  preferredTimings: MultiSelect,
  responseTime: Select,
  
  // Visibility
  profileVisibility: Select,  // draft, private, public
  
  // Contact
  email: EmailInput,
  phone: PhoneInput,
  
  // Buttons
  SaveChanges
  PreviewProfile
  Publish
}
```

**Database Updates:**
```sql
-- Profile completion score (calculated field)
CREATE FUNCTION calculate_profile_completeness(p_coach_id UUID)
RETURNS INT AS $$
SELECT ROUND(
  (
    (CASE WHEN c.bio IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN c.profile_photo_url IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN array_length(c.certifications, 1) > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN c.years_of_experience IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN array_length((SELECT array_agg(language) FROM professional_languages 
      WHERE professional_id = ?), 1) > 0 THEN 1 ELSE 0 END)
  ) * 20
)::INT;
$$ LANGUAGE SQL;
```

---

## **PHASE 3: Booking, Payments & Subscriptions**
### Timeline: Weeks 9-16 | Priority: Critical

### 3.1 Booking Workflow

**New Screens:**
- `src/screens/BookPackageNative.tsx` - Package selection & confirmation
- `src/screens/BookingConfirmationNative.tsx` - Success screen
- `src/screens/MySubscriptionsNative.tsx` - Active subscriptions view

**Booking Flow:**
```
1. Client views professional profile
2. Clicks "Book Package"
3. SelectPackage screen - choose which package
4. SelectDateTime screen - pick start date & timing
5. ReviewOrder screen - confirm details & terms
6. Payment screen - process payment (Stripe/Razorpay)
7. ConfirmationScreen - order success, email sent
8. MySubscriptions - subscription appears in client's list
```

**Database Table (already exists, needs population):**
```sql
-- Already defined in schema.sql:
CREATE TABLE professional_package_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES professional_packages(id),
  owner_user_id UUID NOT NULL,        -- Coach/Dietician
  client_user_id UUID NOT NULL,       -- Client
  status subscription_status_enum,    -- active, paused, cancelled, expired
  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'INR',
  billing_cycle billing_cycle_enum,   -- monthly, quarterly, yearly
  billing_frequency INT DEFAULT 1,
  auto_renew BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  cancellation_reason TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.2 Payment Integration

#### 3.2.1 Razorpay Integration (Primary for India)

**What:** Process Indian Rupee payments securely

**Implementation:**
```typescript
// src/lib/razorpayClient.ts
import RazorpayCheckout from 'react-native-razorpay';

export async function initiatePayment(order: {
  package_id: string;
  amount: number;  // in paise (amount * 100)
  client_id: string;
  email: string;
  phone: string;
}) {
  const razorpayOrderId = await createRazorpayOrder({
    amount: order.amount,
    currency: 'INR',
    receipt: order.package_id,
    notes: {
      package_id: order.package_id,
      client_id: order.client_id
    }
  });

  const options = {
    description: 'Coaching Package Subscription',
    image: 'https://..../logo.png',
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID,
    amount: order.amount,
    order_id: razorpayOrderId,
    name: 'Supfit',
    description: 'Professional Coaching',
    prefill: {
      email: order.email,
      contact: order.phone,
    },
  };

  try {
    const result = await RazorpayCheckout.open(options);
    // Handle successful payment
    await confirmPayment(result.razorpay_payment_id, razorpayOrderId);
  } catch (error) {
    // Handle failed payment
    console.error('Payment failed:', error);
  }
}
```

**Backend (Supabase Edge Function):**
```typescript
// supabase/functions/razorpay-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import * as crypto from 'https://deno.land/std/crypto/mod.ts';

serve(async (req) => {
  if (req.method === 'POST') {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha256', Deno.env.get('RAZORPAY_KEY_SECRET'))
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.authorized') {
      const { payment_id, notes } = event.payload.payment.entity;
      
      // Create subscription in DB
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL'),
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      );

      const { data, error } = await supabase
        .from('professional_package_subscriptions')
        .insert({
          package_id: notes.package_id,
          client_user_id: notes.client_id,
          owner_user_id: notes.owner_user_id,
          amount: event.payload.payment.entity.amount / 100,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          end_date: calculateEndDate(...),
          metadata: {
            razorpay_payment_id: payment_id,
            razorpay_order_id: event.payload.payment.entity.order_id
          }
        });

      // Send confirmation email
      await supabase.functions.invoke('send-email', {
        body: {
          template: 'booking_confirmed',
          to: notes.client_email,
          data: { subscription: data }
        }
      });
    }

    return new Response('OK', { status: 200 });
  }
});
```

**Database Table for Payments:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES professional_package_subscriptions(id),
  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'INR',
  status TEXT CHECK (status IN ('pending', 'authorized', 'failed', 'refunded')),
  gateway TEXT CHECK (gateway IN ('razorpay', 'stripe')),
  gateway_payment_id TEXT,
  gateway_order_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

#### 3.2.2 Stripe Integration (Optional, for International)

```typescript
// Alternative for USD/EUR support
import Stripe from 'stripe';

export async function createStripePaymentIntent(order) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.amount * 100,  // Convert to cents
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: {
      package_id: order.package_id,
      client_id: order.client_id
    }
  });

  return {
    clientSecret: paymentIntent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  };
}
```

---

### 3.3 Subscription Management

#### 3.3.1 Client Subscription Views

**Screen:** `src/screens/MySubscriptionsNative.tsx`

```typescript
interface MySubscriptions {
  activeSubscriptions: [
    {
      id: string;
      professionalName: string;
      packageName: string;
      price: number;
      billingCycle: 'monthly' | 'quarterly' | 'yearly';
      renewalDate: date;
      status: 'active' | 'paused';
      actions: ['View Professional', 'Message', 'Pause', 'Cancel'];
    }
  ],
  
  pausedSubscriptions: Subscription[],
  
  expiredSubscriptions: Subscription[],
}
```

**Database Queries:**
```sql
-- Get active subscriptions for a client
SELECT 
  pps.*,
  pp.name as package_name,
  u.name as professional_name,
  u.profile_photo_url,
  cs.rating as professional_rating
FROM professional_package_subscriptions pps
LEFT JOIN professional_packages pp ON pps.package_id = pp.id
LEFT JOIN users u ON pps.owner_user_id = u.id
LEFT JOIN coach_stats cs ON pps.owner_user_id = cs.coach_id
WHERE pps.client_user_id = $1
  AND pps.status IN ('active', 'paused')
ORDER BY pps.created_at DESC;
```

---

#### 3.3.2 Subscription Lifecycle Management

**Actions:**
```typescript
interface SubscriptionActions {
  // Pause subscription
  pauseSubscription(subscription_id, reason): Promise<void>,
  
  // Resume subscription
  resumeSubscription(subscription_id): Promise<void>,
  
  // Cancel subscription
  cancelSubscription(subscription_id, reason, feedback): Promise<void>,
  
  // Renew subscription
  renewSubscription(subscription_id): Promise<void>,
  
  // Request refund
  requestRefund(subscription_id, reason): Promise<RefundRequest>,
}
```

**Database Triggers:**
```sql
-- Auto-expire subscriptions past end_date
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE professional_package_subscriptions
  SET status = 'expired'
  WHERE end_date < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily
SELECT cron.schedule('expire_subscriptions', '0 2 * * *', 'SELECT expire_subscriptions()');

-- Auto-renew if auto_renew = true
CREATE OR REPLACE FUNCTION auto_renew_subscriptions()
RETURNS void AS $$
BEGIN
  INSERT INTO professional_package_subscriptions (
    package_id, owner_user_id, client_user_id,
    amount, currency, billing_cycle, billing_frequency,
    start_date, end_date, auto_renew, status
  )
  SELECT
    pps.package_id,
    pps.owner_user_id,
    pps.client_user_id,
    pps.amount,
    pps.currency,
    pps.billing_cycle,
    pps.billing_frequency,
    pps.end_date + INTERVAL '1 day' as start_date,
    pps.end_date + interval_calc(pps.billing_cycle, pps.billing_frequency) as end_date,
    pps.auto_renew,
    'active'
  FROM professional_package_subscriptions pps
  WHERE pps.auto_renew = true
    AND pps.status = 'expired'
    AND pps.end_date = NOW()::date;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('auto_renew_subscriptions', '5 2 * * *', 'SELECT auto_renew_subscriptions()');
```

---

### 3.4 Invoice & Billing

**New Tables:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES professional_package_subscriptions(id),
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount_paid NUMERIC(10,2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Invoice Generation:**
```typescript
export async function generateInvoice(subscriptionId: string) {
  const { data: subscription } = await supabase
    .from('professional_package_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  const invoice = {
    invoice_number: `INV-${Date.now()}`,
    issue_date: new Date(),
    due_date: addDays(new Date(), 7),
    amount: subscription.amount,
    tax_amount: calculateTax(subscription.amount),
    total: subscription.amount + calculateTax(subscription.amount),
    status: 'issued',
    subscription_id: subscriptionId
  };

  const { data } = await supabase
    .from('invoices')
    .insert(invoice);

  // Generate PDF
  const pdf = await generatePDF(invoice);
  
  // Send email
  await sendEmail({
    to: subscription.client_email,
    subject: `Invoice ${invoice.invoice_number}`,
    attachments: [pdf]
  });

  return data;
}
```

---

## **PHASE 4: Engagement & Communication**
### Timeline: Weeks 17-24 | Priority: High

### 4.1 Real-Time Messaging

**New Database Table:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES professional_package_subscriptions(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_subscription ON messages(subscription_id);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at);
```

**Real-Time Sync (Supabase Realtime):**
```typescript
// src/hooks/useChat.ts
export function useChat(subscriptionId: string) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Subscribe to new messages
    const subscription = supabase
      .from(`messages:subscription_id=eq.${subscriptionId}`)
      .on('*', payload => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [subscriptionId]);

  const sendMessage = async (content: string) => {
    await supabase.from('messages').insert({
      subscription_id: subscriptionId,
      sender_id: user.id,
      recipient_id: recipient.id,
      content
    });
  };

  return { messages, sendMessage };
}
```

---

### 4.2 Video Consultation Integration

**Technology:** Agora SDK or Daily.co (alternatives to Zoom)

```typescript
// src/lib/videoConsultation.ts
import AgoraRTC from 'agora-rtc-sdk-ng';

export async function initiateVideoCall(subscriptionId: string) {
  const agoraAppId = process.env.AGORA_APP_ID;
  
  // Generate token from Supabase Edge Function
  const { data: tokenResponse } = await supabase.functions.invoke('generate-agora-token', {
    body: { channelName: subscriptionId }
  });

  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
  
  const uid = await client.join(agoraAppId, subscriptionId, tokenResponse.token, null);
  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  const localVideoTrack = await AgoraRTC.createCameraVideoTrack();

  await client.publish([localAudioTrack, localVideoTrack]);

  return {
    client,
    localAudioTrack,
    localVideoTrack,
    uid
  };
}
```

**UI Component:**
```typescript
// src/screens/VideoCallNative.tsx
export function VideoCallScreen() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);

  useEffect(() => {
    // Subscribe to remote user joins
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => [...prev, user]);
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Local video feed */}
      <View style={styles.localVideo}></View>
      
      {/* Remote video feeds */}
      {remoteUsers.map(user => (
        <View key={user.uid} style={styles.remoteVideo}></View>
      ))}
      
      {/* Call controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMic}><MicIcon /></TouchableOpacity>
        <TouchableOpacity onPress={toggleVideo}><CameraIcon /></TouchableOpacity>
        <TouchableOpacity onPress={endCall} style={styles.endCallBtn}>
          <Text>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

### 4.3 Progress Tracking & Dashboard

**New Tables:**
```sql
CREATE TABLE client_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES professional_package_subscriptions(id),
  measurement_date DATE NOT NULL,
  metrics JSONB NOT NULL,     -- {weight: 75, chest: 102, arms: 32, ...}
  notes TEXT,
  photos_urls TEXT[],
  created_by UUID NOT NULL REFERENCES users(id),  -- Coach or Client
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES professional_package_subscriptions(id),
  session_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  duration_minutes INT,
  session_notes TEXT,
  homework_assigned TEXT,
  homework_completed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Progress Dashboard Components:**
```typescript
interface ProgressDashboard {
  // Metrics chart
  <MetricsChart
    metrics={progressData}
    timerange="3-months"
    onDateChange={(range) => loadMetrics(range)}
  />
  
  // Progress photos gallery
  <ProgressPhotos
    photos={progressPhotos}
    onUpload={(photo) => uploadPhoto(photo)}
  />
  
  // Session history
  <SessionHistory
    sessions={sessions}
    onLogSession={() => openSessionLogModal()}
  />
  
  // Goals & Milestones
  <GoalsAndMilestones
    goals={activeGoals}
    milestones={completedMilestones}
  />
}
```

---

### 4.4 Notification System

**New Database Table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'booking_confirmed',
    'session_reminder',
    'message_received',
    'subscription_renewal',
    'payment_received',
    'new_review',
    'professional_update'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

**Push Notifications (Firebase Cloud Messaging):**
```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as admin from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js';

serve(async (req) => {
  const { userId, title, body, data } = await req.json();

  // Get user's FCM token
  const { data: userData } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('id', userId)
    .single();

  if (!userData?.fcm_token) return;

  // Send via Firebase
  await admin.messaging().send({
    token: userData.fcm_token,
    notification: { title, body },
    data: data
  });

  // Also save to DB for in-app display
  await supabase
    .from('notifications')
    .insert({ user_id: userId, type: 'booking_confirmed', title, body, data });
});
```

---

## **PHASE 5: Analytics, AI & ML Optimization**
### Timeline: Weeks 25-32 | Priority: Medium (but High ROI)

### 5.1 Analytics Infrastructure

**Events Table:**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create partitions for better query performance
CREATE TABLE analytics_events_202601 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Event Types:**
```
- search_initiated
- search_filtered
- professional_viewed
- review_read
- package_viewed
- booking_started
- booking_completed
- message_sent
- video_call_started
- subscription_renewed
- subscription_cancelled
```

---

### 5.2 AI-Powered Search Ranking

**Current Scoring:** 0-200  
**Enhanced Scoring with ML:** 0-1000 (weighted by user behavior)

**Personalization Factors:**
```sql
CREATE TABLE search_personalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  professional_id UUID NOT NULL REFERENCES users(id),
  views INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  booking_click_count INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  added_to_favorites BOOLEAN DEFAULT FALSE,
  booking_completed BOOLEAN DEFAULT FALSE,
  review_left BOOLEAN DEFAULT FALSE,
  last_interacted TIMESTAMPTZ,
  interaction_score NUMERIC(5,3) COMPUTED AS (
    (views * 0.05) +
    (messages_sent * 0.2) +
    (booking_click_count * 0.15) +
    (time_spent_seconds / 60 * 0.02) +
    (added_to_favorites::int * 0.3) +
    (booking_completed::int * 0.5) +
    (review_left::int * 0.1)
  ) STORED
);

-- Track search engagement
INSERT INTO search_personalization (client_id, professional_id, views)
VALUES ($1, $2, 1)
ON CONFLICT (client_id, professional_id)
DO UPDATE SET views = views + 1;
```

**Recommendation Algorithm:**
```sql
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_client_id UUID,
  p_limit INT = 10
)
RETURNS TABLE (
  professional_id UUID,
  name TEXT,
  score NUMERIC
) AS $$
SELECT
  sp.professional_id,
  u.name,
  (
    -- Base search score (already calculated)
    base_score +
    -- Personalization boost
    COALESCE(sp.interaction_score, 0) * 100 +
    -- Collaborative filtering (users who browsed X also booked Y)
    (SELECT AVG(sp2.interaction_score * 100)
     FROM search_personalization sp2
     WHERE sp2.professional_id = sp.professional_id
     AND sp2.client_id IN (
       SELECT sp3.client_id FROM search_personalization sp3
       WHERE sp3.professional_id IN (
         SELECT sp4.professional_id FROM search_personalization sp4
         WHERE sp4.client_id = p_client_id
         ORDER BY sp4.interaction_score DESC LIMIT 5
       )
     )
    ) * 50
  ) as final_score
FROM search_personalization sp
LEFT JOIN users u ON sp.professional_id = u.id
WHERE sp.client_id = p_client_id
ORDER BY final_score DESC
LIMIT p_limit;
$$ LANGUAGE SQL;
```

---

### 5.3 Churn Prediction

**Features for Churn Model:**
```python
# Features to track
features = {
    'days_since_signup': int,
    'subscriptions_count': int,
    'messages_sent': int,
    'avg_session_completion_rate': float,    # %
    'support_tickets_submitted': int,
    'last_activity_days_ago': int,
    'payment_failures': int,
    'review_count': int,
    'avg_rating_received': float,
    'bookings_cancelled': int,
    'bookings_rescheduled': int,
}

# Target: churn_probability (0-1)
```

**Churn Prevention Actions:**
```sql
-- Identify at-risk users
SELECT
  u.id,
  u.email,
  (
    CASE WHEN days_since_last_activity > 30 THEN 1 ELSE 0 END +
    CASE WHEN subscription_cancel_rate > 0.5 THEN 1 ELSE 0 END +
    CASE WHEN payment_failures > 2 THEN 1 ELSE 0 END +
    CASE WHEN avg_rating < 3.0 THEN 1 ELSE 0 END
  ) as risk_score
FROM users u
WHERE risk_score >= 2
ORDER BY risk_score DESC;

-- Take action: send re-engagement email, offer discount
```

---

### 5.4 Recommendation Engine

**Collaborative Filtering:**
```sql
-- Find similar professionals
CREATE OR REPLACE FUNCTION find_similar_professionals(
  p_professional_id UUID,
  p_similarity_threshold NUMERIC = 0.7
)
RETURNS TABLE (
  similar_professional_id UUID,
  similarity_score NUMERIC
) AS $$
SELECT
  pp2.owner_user_id as similar_professional_id,
  (
    -- Specialty overlap
    (array_length(array_intersect(pp1.specialties, pp2.specialties), 1)::NUMERIC /
     GREATEST(array_length(pp1.specialties, 1), array_length(pp2.specialties, 1))::NUMERIC) * 0.4 +
    -- Rating similarity
    (1 - ABS(cs1.rating - cs2.rating) / 5) * 0.3 +
    -- Price similarity
    (1 - ABS(pp1.price - pp2.price) / GREATEST(pp1.price, pp2.price)) * 0.3
  ) as similarity_score
FROM professional_packages pp1
LEFT JOIN professional_packages pp2 ON true
LEFT JOIN coach_stats cs1 ON pp1.owner_user_id = cs1.coach_id
LEFT JOIN coach_stats cs2 ON pp2.owner_user_id = cs2.coach_id
WHERE pp1.owner_user_id = p_professional_id
  AND similarity_score >= p_similarity_threshold
ORDER BY similarity_score DESC;
$$ LANGUAGE SQL;
```

---

### 5.5 Content Recommendation

**For Clients:**
```sql
-- Recommend professionals based on browsing history
CREATE VIEW recommended_professionals_for_client AS
SELECT DISTINCT
  pp.owner_user_id,
  u.name,
  pp.name as package_name,
  cs.rating,
  (
    -- View history weight
    0.3 * (
      SELECT COUNT(*) FROM analytics_events
      WHERE user_id = current_setting('auth.current_user_id')
      AND event_type = 'professional_viewed'
      AND event_data->>'professional_id' = pp.owner_user_id::text
    ) +
    -- Similar clients' preferences
    0.5 * (
      SELECT AVG(sp.interaction_score)
      FROM search_personalization sp
      WHERE sp.professional_id = pp.owner_user_id
    ) +
    -- Rating & popularity
    0.2 * (cs.rating / 5)
  ) as recommendation_score
FROM professional_packages pp
LEFT JOIN coach_stats cs ON pp.owner_user_id = cs.coach_id
LEFT JOIN users u ON pp.owner_user_id = u.id
WHERE pp.status = 'active' AND pp.visibility = 'public'
ORDER BY recommendation_score DESC;
```

---

### 5.6 A/B Testing Framework

**Experiment Table:**
```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hypothesis TEXT,
  variant_a_description TEXT,
  variant_b_description TEXT,
  status TEXT CHECK (status IN ('planning', 'running', 'analyzing', 'complete')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  primary_metric TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  variant TEXT CHECK (variant IN ('A', 'B')),
  exposed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, user_id)
);

CREATE TABLE experiment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  metric_name TEXT,
  metric_value NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example A/B Test (Recommendation Algorithm):**
```sql
-- Variant A: Current algorithm
-- Variant B: New ML-based algorithm

SELECT
  variant,
  COUNT(*) as users,
  AVG(bookings_made) as avg_bookings,
  AVG(conversion_rate) as avg_conversion,
  AVG(revenue_generated) as avg_revenue
FROM experiment_assignments ea
LEFT JOIN experiment_metrics em ON ea.user_id = em.user_id
WHERE ea.experiment_id = 'exp-recommendation-v2'
GROUP BY variant;
```

---

## Implementation Priority Matrix

### Critical Path (Do First)
1. ✅ **Phase 1:** Auth + Coach packages (DONE)
2. **Phase 2.1-2.2:** Professional discovery + search UI (WEEKS 1-2)
3. **Phase 3.1-3.2:** Booking + payments (WEEKS 3-4)
4. **Phase 4.1-4.2:** Messaging + video calls (WEEKS 5-6)

### High Value (Do Second)
5. **Phase 2.3:** Reviews & ratings (WEEKS 7-8)
6. **Phase 3.3-3.4:** Subscription management + invoicing (WEEKS 9-10)
7. **Phase 4.3-4.4:** Progress tracking + notifications (WEEKS 11-12)

### Scale & Optimize (Do After MVP)
8. **Phase 5.1-5.2:** Analytics + AI scoring (WEEKS 13-16)
9. **Phase 5.3-5.6:** Churn prediction, recommendations, A/B tests (WEEKS 17-20)

---

## Technology Stack Recommendations

### Frontend
- **Mobile:** React Native + Expo (existing)
- **Web:** React + Vite (future)
- **Video:** Agora RTC SDK or Daily.co
- **Maps:** React Native Maps with Google Places API
- **UI:** shadcn/ui + Tailwind CSS (existing)

### Backend
- **Database:** PostgreSQL 15+ on Supabase (existing)
- **Real-time:** Supabase Realtime (for messaging)
- **Auth:** Supabase Auth with Google/Apple OAuth (existing)
- **Payments:** Razorpay (primary) + Stripe (secondary)
- **Files:** Supabase Storage for photos/videos
- **Edge Functions:** Deno for serverless functions

### Analytics & ML
- **Analytics Warehouse:** BigQuery or Snowflake
- **ML Platforms:** Vertex AI or AWS SageMaker
- **Dashboards:** Metabase or Looker for internal analytics
- **Recommendation Engine:** Custom ML models or Firebase Predictions

### DevOps
- **CI/CD:** GitHub Actions (existing)
- **Monitoring:** Sentry for error tracking
- **APM:** Datadog or New Relic for performance
- **Logging:** CloudWatch or Loggly

---

## Success Metrics & KPIs

### User Acquisition
-[ ] 1,000+ active coaches/dietitians by Month 3
- [ ] 5,000+ active clients by Month 3
- [ ] 10,000+ downloads by Month 6

### Engagement
- [ ] 40%+ DAU/MAU ratio
- [ ] 25%+ conversion from search to booking
- [ ] 3+ average messages per subscription

### Revenue
- [ ] $50K+ monthly revenue by Month 6
- [ ] $200K+ MRR by Month 12
- [ ] 70%+ subscription renewal rate

### Quality
- [ ] 4.5+ average platform rating
- [ ] < 2% payment failure rate
- [ ] < 5% support ticket volume

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Payment gateway downtime | High | Implement fallback gateway, queue system |
| Poor AI/ML model performance | Medium | Start with rule-based, iterate with ML |
| Fake reviews/ratings | High | Implement verification, sentiment analysis |
| Data privacy/GDPR | High | Built-in consent, data retention policies |
| Marketplace trust issues | High | Verified badges, insurance, dispute resolution |

---

## Next Steps

### Immediate (This Week)
1. [ ] Finalize Phase 2.1 technical design
2. [ ] Set up Razorpay test account
3. [ ] Create professional directory mockups
4. [ ] Begin database migrations

### Short-term (Next 4 Weeks)
1. [ ] Implement professional discovery UI
2. [ ] Build booking workflow
3. [ ] Integrate Razorpay payments
4. [ ] Launch MVP with 20 coaches

### Medium-term (Weeks 5-12)
1. [ ] Add reviews & ratings system
2. [ ] Implement real-time messaging
3. [ ] Set up video consultation framework
4. [ ] Build admin dashboard

### Long-term (Months 4+)
1. [ ] Advanced AI/ML models
2. [ ] Marketplace analytics
3. [ ] Professional tools (client management)
4. [ ] International expansion

---

## Code Repository Structure

```
/workspaces/SupfitApp/
├── app/                              # Expo Router
├── src/
│   ├── screens/
│   │   ├── CoachSubscriptionNative.tsx           ✅ DONE
│   │   ├── FindCoachesNative.tsx                 📋 PHASE 2
│   │   ├── ProfessionalProfileNative.tsx         📋 PHASE 2
│   │   ├── BookPackageNative.tsx                 📋 PHASE 3
│   │   ├── MySubscriptionsNative.tsx             📋 PHASE 3
│   │   ├── ChatNative.tsx                        📋 PHASE 4
│   │   └── VideoCallNative.tsx                   📋 PHASE 4
│   ├── components/
│   │   ├── ProfessionalCard.tsx                  📋 PHASE 2
│   │   ├── ReviewCard.tsx                        📋 PHASE 2
│   │   ├── BookingFlow.tsx                       📋 PHASE 3
│   │   └── ProgressChart.tsx                     📋 PHASE 4
│   ├── lib/
│   │   ├── razorpayClient.ts                     📋 PHASE 3
│   │   ├── agoraClient.ts                        📋 PHASE 4
│   │   ├── recommendationEngine.ts               📋 PHASE 5
│   │   └── analyticsClient.ts                    📋 PHASE 5
│   ├── hooks/
│   │   ├── useSearch.ts                          📋 PHASE 2
│   │   ├── useBooking.ts                         📋 PHASE 3
│   │   ├── useChat.ts                            📋 PHASE 4
│   │   └── useAnalytics.ts                       📋 PHASE 5
│   └── types/
│       └── marketplace.ts                        📋 PHASE 2
├── supabase/
│   ├── migrations/
│   │   ├── 2026-02-01_professional_packages.sql ✅ DONE
│   │   ├── 20260208_reviews_system.sql           📋 PHASE 2
│   │   ├── 20260210_payments_invoicing.sql       📋 PHASE 3
│   │   ├── 20260215_messaging_notifications.sql  📋 PHASE 4
│   │   └── 20260225_analytics_events.sql         📋 PHASE 5
│   └── functions/
│       ├── razorpay-webhook.ts                   📋 PHASE 3
│       ├── generate-agora-token.ts               📋 PHASE 4
│       ├── send-notification.ts                  📋 PHASE 4
│       └── ml-scoring.ts                         📋 PHASE 5
└── docs/
    ├── ROADMAP.md                                📋 THIS FILE
    ├── ARCHITECTURE.md                           📋 TODO
    ├── API_REFERENCE.md                          📋 TODO
    └── DEPLOYMENT_GUIDE.md                       📋 TODO
```

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Owner:** Engineering Team  
**Status:** Ready for Phase 2 Implementation
