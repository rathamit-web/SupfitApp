# Supfit AI Pipeline Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPFIT MOBILE APP                             │
│                                                                       │
│  User Input:                                                         │
│  ├─ Workout Preferences (days, style, duration, goals)             │
│  ├─ Diet Preferences (meals, calories, macros)                     │
│  └─ Equipment Available                                             │
│                                                                       │
│  Health Data (from user_details):                                   │
│  ├─ Weight: 75kg  →  [ANONYMIZED] → BMI Category: "normal"        │
│  ├─ Height: 175cm                                                   │
│  ├─ Age: 32       →  [ANONYMIZED] → Age Range: "26-35"            │
│  ├─ Conditions: "Hypertension, Type 2 Diabetes"                    │
│  │                →  [FILTERED]  → ["hypertension", "diabetes"]    │
│  └─ Medications: "Lisinopril 10mg, Metformin 500mg"               │
│                   →  [GENERIC]   → ["blood_pressure", "insulin"]   │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ HTTPS (JWT Token)
                             │ Payload: Anonymized data only
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                            │
│                 (Server-side, secure environment)                    │
│                                                                       │
│  1. Authentication Verification                                      │
│     ├─ Validate JWT token                                           │
│     ├─ Extract user.id                                              │
│     └─ Verify user_id matches request                               │
│                                                                       │
│  2. Data Validation                                                  │
│     ├─ Check required fields                                        │
│     ├─ Sanitize inputs                                              │
│     └─ Enforce business rules                                        │
│                                                                       │
│  3. Build AI Prompt                                                  │
│     ├─ System: Safety rules, JSON format                            │
│     └─ User: Preferences + Anonymized health profile                │
│                                                                       │
│  4. OpenAI API Call                                                  │
│     ├─ Model: GPT-4o                                                │
│     ├─ Headers: Authorization with OPENAI_API_KEY (secret)         │
│     ├─ Temperature: 0.7                                             │
│     └─ Response Format: JSON                                         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ HTTPS (API Key in URL param)
                             │ Payload: Anonymized + Prompt
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GOOGLE GEMINI API                               │
│                      (Third-party service)                           │
│                                                                       │
│  Data Received (MINIMAL):                                            │
│  ├─ BMI Category: "normal" (not exact 24.3)                        │
│  ├─ Age Range: "26-35" (not exact 32)                              │
│  ├─ Generic Conditions: ["hypertension", "diabetes"]               │
│  ├─ Medication Types: ["blood_pressure", "insulin"]                │
│  ├─ Workout Style: "Strength Training"                             │
│  ├─ Equipment: ["Dumbbells", "Barbell"]                            │
│  └─ NO: name, email, exact age, specific meds, exact weight        │
│                                                                       │
│  AI Processing:                                                      │
│  ├─ Generate safe workout/diet plan                                │
│  ├─ Apply medical condition modifications                           │
│  ├─ Include form tips and safety warnings                           │
│  └─ Return structured JSON                                           │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ Generated Plan (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                            │
│                                                                       │
│  5. Validate AI Response                                             │
│     ├─ Check JSON structure                                         │
│     ├─ Verify required fields                                       │
│     └─ Calculate totals (calories, duration)                         │
│                                                                       │
│  6. Add Metadata                                                     │
│     ├─ generatedAt timestamp                                        │
│     ├─ User preferences (original)                                  │
│     └─ Medical disclaimers                                           │
│                                                                       │
│  7. Save to Database                                                 │
│     ├─ Table: workout_programs / diet_plans                         │
│     ├─ RLS: Only user can access                                    │
│     └─ JSONB: Full plan data                                         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ Success Response
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPFIT MOBILE APP                             │
│                                                                       │
│  Display Plan:                                                       │
│  ├─ Weekly workout schedule with exercises                          │
│  ├─ Daily diet with meals and macros                                │
│  ├─ Personalized recommendations                                     │
│  └─ Medical disclaimers and safety tips                             │
│                                                                       │
│  User Actions:                                                       │
│  ├─ View and follow plan                                            │
│  ├─ Regenerate with different preferences                           │
│  └─ Track progress                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Privacy & Security Layers

### Layer 1: Client-Side Anonymization
```typescript
// Convert exact values to ranges/categories
BMI: 24.3 → "normal"
Age: 32 → "26-35"
Medications: "Lisinopril 10mg" → "blood_pressure"
```

### Layer 2: Server-Side Validation
```typescript
// Edge Function verifies:
- JWT token authenticity
- User ID match
- Input sanitization
- Business rules
```

### Layer 3: Minimal Data Transmission
```
Only send to OpenAI:
✅ Categories (not exact values)
✅ Generic conditions (filtered list)
✅ Medication types (not names/doses)
✅ Preferences and goals

Never send:
❌ User name
❌ Email
❌ Exact age/BMI
❌ Specific medication names
❌ Phone number
❌ Address
```

### Layer 4: Database Security
```sql
-- Row Level Security
- Users can only access their own plans
- No cross-user data leakage
- Automatic user_id filtering
```

## Cost & Performance

### Google Gemini API Costs
- **FREE TIER**: 60 requests/minute, 1,500 requests/day
- **Workout Plan**: ~2,000 tokens = **$0 (free tier)** or $0.002 paid
- **Diet Plan**: ~2,500 tokens = **$0 (free tier)** or $0.003 paid
- **Monthly estimate** (100 users, 2 plans each): **FREE** (within limits) or ~$1 if paid

### Response Times
- Client → Edge Function: <100ms
- Edge Function → Gemini: 2-4s (AI processing)
- Database save: <100ms
- **Total**: ~2-5 seconds

### Fallback Strategy
```
If AI fails → Use local mock generation
If database save fails → Return plan anyway, let user retry
If network error → Queue for retry
```

## Compliance & Safety

### Legal Disclaimers (Google Gemini Compliance)
Every AI-generated plan includes:
Google after generation

### Compliance
**GDPR/Privacy:**ter generation

### GDPR/Privacy Compliance

### Compliance Feature Flags & Backend State

### Master Data Models (Step 2)
- User master: `user_profile` (id/user_id via auth.users), region, language, consent_status, preferences, timestamps.
- Coach master: `coaches` with user_id, certifications, specialties, org_id, timestamps.
- Dietitian master: `dietitians` with user_id, credentials, org_id, specialties, timestamps.
- Assignments: existing `client_assignments` (combined) plus explicit `coach_client_assignments` and `dietitian_client_assignments` with scoped permissions (`read_vitals`, `read_nutrition`, `write_notes`) and expiry.
- Derived views: `coach_assigned_clients`, `dietitian_assigned_clients` provide per-coach/dietitian client listings (RLS enforced by underlying tables).
RLS/policies included for owners and assigned coaches/dietitians; insert/update policies for coaches/dietitians and assignment owners; `updated_at` triggers on all master/assignment tables.

### App Layer (Step 2 wiring)
- Types: `src/types/masterData.ts` defines shapes for profiles and assignments with scope flags.
- Client helpers: `src/lib/masterData.ts` wraps Supabase for profile upsert/fetch and coach/dietitian/client assignment inserts/lists, normalizing default scopes.
- Hooks: `src/hooks/useMasterData.ts` provides React stateful wrappers for profiles and assignments (fetch, assign, refresh, save) for UI consumption.

### Compliance Sanity Check (dev helper)
- Use `runVitalsAndConsentCheck()` in `src/lib/devComplianceCheck.ts` (manual call) to seed a consent, insert a debug vital into `health_vitals_raw` with purpose/consent, and read it back. Useful after migrations/flag enablement to verify enforcement paths.
- ✅ Educational/informational purpose only
- ✅ No diagnosis, treatment, or cure claims
- ✅ Clear disclaimers included
- ✅ Recommends professional consultation
- ✅ Does not replace medical/dietary advice
- ✅ Respects content policy and safety settings

---

**Security Audit Status**: ✅ Ready for production
**Compliance Status**: ✅ Google Gemini health/wellness terms compliant
**Last Updated**: January 9, 2026
**API**: Google Gemini 1.5 Pro
**Security Audit Status**: ✅ Ready for production
**Last Updated**: January 9, 2026
