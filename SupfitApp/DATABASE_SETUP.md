# AI Plan Generation - Database & Deployment Setup

## Daily Active Hours (New)

- Migration: `supabase/migrations/20260122090000_active_hours_mcp/20260122_active_hours_mcp.sql`
- Migration (consent): `supabase/migrations/20260122121000_active_hours_consent/20260122_active_hours_consent.sql`
- Edge Function: `supabase/functions/ingest-active-hours`
- Edge Function (consent): `supabase/functions/set-active-hours-consent`
- Notes: This stores **derived daily totals only** in `public.active_hours` (no raw samples). See `ACTIVE_HOURS_PIPELINE.md`.

## 1. Create Database Tables

### Diet Plans Table
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('ai_generated', 'dietician_assigned')),
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX idx_diet_plans_is_active ON public.diet_plans(is_active);

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own diet plans"
  ON public.diet_plans FOR ALL
  USING (auth.uid() = user_id);
```

### Workout Programs Table (if not exists)
```sql
CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('ai_generated', 'coach_assigned')),
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_workout_programs_user_id ON public.workout_programs(user_id);
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workout programs"
  ON public.workout_programs FOR ALL
  USING (auth.uid() = user_id);
```

## 2. Deploy Supabase Edge Functions

### Install Supabase CLI
```powershell
# If not installed
npm install -g supabase
```

### Login to Supabase
```powershell
supabase login
```

### Link Your Project
```powershell
cd C:\Users\Amit\MyProject\Supfit_Dev\SupfitApp
supabase link --project-ref your-project-id
```

### Set Environment Variables
```powershell
# Get your Google Gemini API key from: https://makersuite.google.com/app/apikey

# Set Gemini API key
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here

# Verify
supabase secrets list
```

### Deploy Functions
```powershell
# Deploy workout plan generator
supabase functions deploy generate-workout-plan

# Deploy diet plan generator
supabase functions deploy generate-diet-plan
```

## 3. Update Client Code

### Install Dependencies
```powershell
cd C:\Users\Amit\MyProject\Supfit_Dev\SupfitApp
npm install
```

### Environment Variables
Ensure `.env` has:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Test the Pipeline

### Test Workout Generation
```typescript
import { generateAIWorkoutPlan } from '@/lib/aiPlanGenerator';

const result = await generateAIWorkoutPlan(
  userId,
  {
    bmi: 24.5,
    age: 30,
    chronicConditions: ['hypertension'],
    medications: 'blood pressure medication',
    // ... other fields
  },
  {
    daysPerWeek: 4,
    workoutStyle: 'Strength Training',
    sessionDuration: 60,
    fitnessGoal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    equipment: ['Dumbbells', 'Barbell'],
  }
);

if (result.plan) {
  console.log('✅ AI Plan Generated:', result.plan.planName);
} else if (result.fallback) {
  console.log('⚠️ Using fallback mock plan');
}
```

### Monitor Logs
```powershell
# View function logs
supabase functions logs generate-workout-plan
supabase functions logs generate-diet-plan
```

## 5. Privacy & Security Checklist

✅ **API Key Server-Side**: OpenAI key stored in Supabase secrets, never exposed to client
✅ **Data Anonymization**: BMI → category, Age → range, Generic conditions only
✅ **No PII to OpenAI**: No names, emails, exact ages, or specific medications sent
✅ **Authentication**: All requests verified with JWT token
✅ **RLS Policies**: Users can only access their own plans
✅ **Input Validation**: User ID mismatch blocked
✅ **Error Handling**: Fallback to mock if AI unavailable
✅ **Medical Disclaimers**: AI responses include health warnings

## 6. Cost Optimization

### Google Gemini API Pricing
- **FREE TIER**: 60 requests/minute, 1,500 requests/day (Gemini 1.5 Pro)
- Workout plan: ~2,000 tokens = **FREE** (within limits)
- Diet plan: ~2,500 tokens = **FREE** (within limits)
- **Paid tier**: $0.00025 per 1K characters input, $0.0005 per 1K characters output (~$0.002/plan)

### Caching Strategy (Optional)
```typescript
// Cache similar requests
const cacheKey = `plan_${userId}_${JSON.stringify(preferences)}`;
const cached = await supabase
  .from('plan_cache')
  .select('plan_data')
  .eq('cache_key', cacheKey)
  .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hour cache
  .single();

if (cached.data) {
  return cached.data.plan_data; // Use cached plan
}
```

## 7. Troubleshooting

### Function won't deploy
```powershell
# Check function syntax
deno check supabase/functions/generate-workout-plan/index.ts

# View deployment logs
supabase functions deploy generate-workout-plan --debug
```

### API key not working
```powershell
# Re-set secret
supabase secrets set GEMINI_API_KEY=your-new-key

# Get new key from: https://makersuite.google.com/app/apikey
# Verify in dashboard: Supabase Dashboard → Edge Functions → Secrets
```

### No response from function
Check CORS and authentication:
```typescript
// In Edge Function, add CORS headers if needed
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## 8. Production Checklist

Before going live:
- [ ] Database tables created with RLS enabled
- [ ] Edge Functions deployed successfully
- [ ] Google Gemini API key set in Supabase secrets (get from: https://makersuite.google.com/app/apikey)
- [ ] Test with real user accounts
- [ ] Monitor function logs for errors
- [ ] Verify staying within Gemini free tier limits (60 req/min, 1,500 req/day)
- [ ] Add rate limiting if needed: `supabase functions deploy --rate-limit 10/minute`
- [ ] Document API usage patterns
- [ ] Verify legal disclaimers display correctly in app UI
- [ ] Ensure compliance with Google's Generative AI Prohibited Use Policy

## 9. Monitoring & Analytics

```sql
-- Track AI plan usage
SELECT 
  date_trunc('day', created_at) as day,
  plan_type,
  COUNT(*) as plans_generated
FROM workout_programs
WHERE plan_type = 'ai_generated'
GROUP BY day, plan_type
ORDER BY day DESC;
```

---

**Last Updated**: January 9, 2026
**Status**: Ready for Deployment
