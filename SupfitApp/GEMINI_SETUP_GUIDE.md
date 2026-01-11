# Google Gemini API Setup Guide for Supfit

## Why Google Gemini?

✅ **Free Tier**: 60 requests/min, 1,500 requests/day (perfect for MVP)  
✅ **Health/Wellness Compliant**: Designed for educational content  
✅ **Faster Response**: Gemini 1.5 Pro with 8K token output  
✅ **Better Safety**: Built-in content filtering and safety settings  
✅ **Lower Cost**: ~$0.002/plan vs OpenAI's $0.015-0.020/plan  

## Step-by-Step Setup

### 1. Get Google Gemini API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with Google account
3. Click **"Create API Key"**
4. Select project or create new one
5. Copy the API key (starts with `AIza...`)

**Security Note**: Keep this key secret! Never commit to git.

### 2. Deploy to Supabase

```powershell
# Navigate to project
cd C:\Users\Amit\MyProject\Supfit_Dev\SupfitApp

# Login to Supabase (if not already)
supabase login

# Link your project
supabase link --project-ref your-project-id

# Set Gemini API key as secret
supabase secrets set GEMINI_API_KEY=AIza_your_key_here

# Verify secret was set
supabase secrets list
```

### 3. Deploy Edge Functions

```powershell
# Deploy workout plan generator
supabase functions deploy generate-workout-plan

# Deploy diet plan generator
supabase functions deploy generate-diet-plan
```

Expected output:
```
✓ Deployed Function generate-workout-plan
  URL: https://your-project.supabase.co/functions/v1/generate-workout-plan
```

### 4. Create Database Tables

Run in **Supabase SQL Editor**:

```sql
-- Workout Programs Table
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

-- Diet Plans Table
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
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own diet plans"
  ON public.diet_plans FOR ALL
  USING (auth.uid() = user_id);
```

### 5. Test the Functions

**Test Workout Plan Generation:**

```powershell
# Get your auth token from Supabase Dashboard → Authentication → Users → Copy JWT

# Test via curl (PowerShell)
$headers = @{
    'Authorization' = 'Bearer YOUR_JWT_TOKEN'
    'Content-Type' = 'application/json'
}

$body = @{
    userId = 'your-user-id'
    preferences = @{
        daysPerWeek = 4
        workoutStyle = 'Strength Training'
        sessionDuration = 60
        fitnessGoal = 'Muscle Gain'
        experienceLevel = 'Intermediate'
        equipment = @('Dumbbells', 'Barbell')
    }
    healthProfile = @{
        bmiCategory = 'normal'
        ageRange = '26-35'
        hasConditions = @()
        medicationTypes = @()
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri 'https://your-project.supabase.co/functions/v1/generate-workout-plan' -Method Post -Headers $headers -Body $body
```

Expected response:
```json
{
  "plan": {
    "planName": "Muscle Gain - Strength Training Plan",
    "weeklyPlan": [...],
    "recommendations": [...],
    "legalDisclaimer": "This is general fitness guidance..."
  },
  "saved": true,
  "id": "uuid-here"
}
```

### 6. Monitor Usage

**View Function Logs:**
```powershell
# Real-time logs
supabase functions logs generate-workout-plan --follow

# Last 100 logs
supabase functions logs generate-workout-plan --limit 100
```

**Monitor Gemini API Usage:**
- Visit: https://console.cloud.google.com/apis/dashboard
- Select your project
- Click "Gemini API"
- View usage metrics

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per month

### 7. Compliance Checklist

✅ **Legal Disclaimers in UI**: Display disclaimer text from API response  
✅ **Educational Purpose**: App copy states "for educational purposes only"  
✅ **Professional Consultation**: Recommends consulting healthcare professionals  
✅ **No Medical Claims**: Never claims to diagnose, treat, or cure  
✅ **Data Privacy**: User data anonymized before API call  
✅ **Terms Acceptance**: Users accept terms before generating plans  

**Add to your Terms of Service:**
> "AI-generated workout and diet plans are for educational and informational purposes only and do not constitute medical, health, or dietary advice. Always consult with a qualified healthcare professional, registered dietitian, or certified fitness trainer before starting any new exercise program or making significant dietary changes, especially if you have pre-existing medical conditions, injuries, or take medications."

### 8. Troubleshooting

**Error: "Invalid API key"**
```powershell
# Re-create API key at: https://makersuite.google.com/app/apikey
# Re-set secret:
supabase secrets set GEMINI_API_KEY=new_key_here
```

**Error: "Function not found"**
```powershell
# Re-deploy function
supabase functions deploy generate-workout-plan --debug
```

**Error: "Rate limit exceeded"**
- You've hit the 60 req/min or 1,500 req/day limit
- Wait for the limit to reset
- Consider upgrading to paid tier if needed

**Error: "Safety filter blocked content"**
- Gemini blocked the response due to safety settings
- Review your prompt for potentially problematic content
- Adjust safety thresholds in the Edge Function

**Plans not saving to database**
```powershell
# Check RLS policies
# Run in Supabase SQL Editor:
SELECT * FROM workout_programs WHERE user_id = 'your-user-id';

# If empty, verify RLS:
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
```

### 9. Production Readiness

Before launching:

- [ ] Test with 10+ different user profiles
- [ ] Verify all disclaimers display correctly
- [ ] Ensure medical condition handling is safe
- [ ] Test error handling (network failures, API downtime)
- [ ] Set up monitoring alerts
- [ ] Document API usage for users
- [ ] Add "Report Issue" button in app
- [ ] Review Google's Prohibited Use Policy: https://ai.google.dev/gemini-api/terms

### 10. Cost Monitoring

**Free Tier Math:**
- 1,500 requests/day ÷ 2 plans per user = 750 users/day max
- ~22,500 users per month (if evenly distributed)

**When to upgrade:**
- Consistently hitting daily limits
- Need higher rate limits (60 req/min is usually enough)
- Want higher priority support

**Paid Tier Pricing:**
- Input: $0.000125 per 1K characters (~$0.00025/plan)
- Output: $0.00025 per 1K characters (~$0.0005/plan)
- **Total**: ~$0.002 per plan (100x cheaper than OpenAI GPT-4)

### 11. Next Steps

1. **Integrate into PlanNative.tsx** (see INTEGRATION_EXAMPLE.tsx)
2. **Add disclaimer modal** before first plan generation
3. **Test with real users** in beta
4. **Monitor logs** for errors
5. **Collect feedback** on plan quality
6. **Iterate on prompts** to improve results

---

## Quick Reference

**Gemini API Key**: https://makersuite.google.com/app/apikey  
**Usage Dashboard**: https://console.cloud.google.com/apis/dashboard  
**Documentation**: https://ai.google.dev/tutorials/rest_quickstart  
**Supabase Functions**: `supabase functions logs generate-workout-plan`  

**Support:**
- Gemini API Issues: https://issuetracker.google.com/issues?q=componentid:1370976
- Supabase Issues: https://supabase.com/dashboard/support

---

**Status**: ✅ Ready for deployment  
**Last Updated**: January 9, 2026  
**API**: Google Gemini 1.5 Pro  
**Cost**: FREE (within limits) or ~$0.002/plan paid
