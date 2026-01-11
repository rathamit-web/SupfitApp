# Quick Deployment Steps for Supfit AI

## 1. Set Gemini API Key in Supabase Dashboard

Since CLI login has issues, use the dashboard:

1. Go to: **https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/settings/functions**
   (Your Project: qescuzpwuetnafgnmmrz)

2. Click **"Edge Functions"** → **"Secrets"** tab

3. Click **"New Secret"**

4. Add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyCuo7SOXQqp-trBrrFakjmxdfcHTffEiN8`

5. Click **"Save"**

## 2. Deploy Edge Functions

### Option A: Via Supabase Dashboard (Easiest)

**Deploy Workout Plan Generator:**

1. Go to: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions
2. Click **"Create a new function"**
3. Name: `generate-workout-plan`
4. Copy code from: `SupfitApp/supabase/functions/generate-workout-plan/index.ts`
5. Paste and click **"Deploy"**

**Deploy Diet Plan Generator:**

1. Click **"Create a new function"**
2. Name: `generate-diet-plan`
3. Copy code from: `SupfitApp/supabase/functions/generate-diet-plan/index.ts`
4. Paste and click **"Deploy"**

### Option B: Via CLI (If login works later)

```powershell
# Login first
npx supabase login

# Link project
npx supabase link --project-ref qescuzpwuetnafgnmmrz

# Deploy functions
npx supabase functions deploy generate-workout-plan
npx supabase functions deploy generate-diet-plan
```

## 3. Create Database Tables (If Not Already Created)

Go to: **https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/editor**

Click **"SQL Editor"** → **"New Query"** and run:

```sql
-- Workout Programs Table (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_workout_programs_user_id ON public.workout_programs(user_id);
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own workout programs"
  ON public.workout_programs FOR ALL
  USING (auth.uid() = user_id);

-- Diet Plans Table (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON public.diet_plans(user_id);
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own diet plans"
  ON public.diet_plans FOR ALL
  USING (auth.uid() = user_id);
```

## 4. Update PlanNative.tsx to Use Real AI

I'll now update the code to integrate the real AI service!

---

**Your Supabase Project Details:**
- URL: `https://qescuzpwuetnafgnmmrz.supabase.co`
- Project ID: `qescuzpwuetnafgnmmrz`
- Anon Key: Already in your `.env`
