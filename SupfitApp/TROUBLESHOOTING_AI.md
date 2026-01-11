# Edge Function Deployment Checklist

## 1. Verify Gemini API Key is Set

Go to: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/settings/functions

Click **"Edge Functions"** → **"Secrets"** tab

**You should see:**
- ✅ `GEMINI_API_KEY` = `AIzaSyCuo7SOXQqp-trBrrFakjmxdfcHTffEiN8`

**If NOT there:**
1. Click "Add secret"
2. Name: `GEMINI_API_KEY`
3. Value: `AIzaSyCuo7SOXQqp-trBrrFakjmxdfcHTffEiN8`
4. Click "Create"

---

## 2. Verify Edge Function is Deployed

Go to: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions

**You should see:**
- ✅ `generate-workout-plan` with status "Active" (green)

**If NOT there or status is "Failed":**
1. Click "Create function"
2. Name: `generate-workout-plan`
3. Copy code from: `SupfitApp/supabase/functions/generate-workout-plan/index.ts`
4. Paste and click "Deploy"

---

## 3. Check Edge Function Logs (IMPORTANT!)

Go to: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions

Click on **`generate-workout-plan`**

Click **"Logs"** tab

**Look for:**
- Recent requests (should appear when you test)
- Error messages
- Status codes (200 = success, 401 = auth, 503 = Gemini failed)

---

## 4. Test with Console Logging

1. **Restart Expo**:
   ```powershell
   cd C:\Users\Amit\MyProject\Supfit_Dev\SupfitApp
   npx expo start --clear
   ```

2. **Open Browser Console** (if using web) or **React Native Debugger**

3. **Generate a plan** and watch console output:
   ```
   🤖 Attempting to generate AI workout plan...
   ✅ User authenticated: <user-id>
   📊 Health data: {...}
   ⚙️ Preferences: {...}
   🔐 Getting auth session...
   ✅ Session obtained
   🔗 Calling Edge Function: https://...
   🛡️ Anonymized health profile: {...}
   📡 Response status: 200 (or error code)
   ```

**Common Issues & Solutions:**

### Issue: "Response status: 404"
**Cause:** Edge Function not deployed
**Fix:** Deploy function via dashboard (step 2 above)

### Issue: "Response status: 401 Unauthorized"
**Cause:** JWT token invalid or user not logged in
**Fix:** Log out and log back in to refresh token

### Issue: "Response status: 500 Internal Server Error"
**Cause:** Edge Function code error or missing environment variable
**Fix:** 
- Check Edge Function logs for exact error
- Verify GEMINI_API_KEY is set in secrets
- Redeploy Edge Function

### Issue: "Response status: 503 Service Unavailable"
**Cause:** Gemini API failed (wrong API key, rate limit, or API down)
**Fix:**
- Verify API key is correct in Supabase secrets
- Check Gemini API dashboard: https://makersuite.google.com/app/apikey
- Ensure you haven't exceeded free tier (1,500 req/day)

### Issue: "Not authenticated"
**Cause:** No session or expired session
**Fix:**
- Log out and log back in
- Check AsyncStorage has valid session

---

## 5. Manual API Test (Optional)

Get your JWT token from console logs, then test directly:

```powershell
# Windows PowerShell
$token = "YOUR_JWT_TOKEN_FROM_CONSOLE"
$userId = "YOUR_USER_ID_FROM_CONSOLE"

$body = @{
  userId = $userId
  preferences = @{
    daysPerWeek = 4
    workoutStyle = "Strength Training"
    sessionDuration = 60
    fitnessGoal = "Muscle Gain"
    experienceLevel = "Intermediate"
    equipment = @("Dumbbells", "Barbell")
  }
  healthProfile = @{
    bmiCategory = "normal"
    ageRange = "26-35"
    hasConditions = @()
    medicationTypes = @()
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://qescuzpwuetnafgnmmrz.supabase.co/functions/v1/generate-workout-plan" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

**Expected output:**
```json
{
  "plan": { ... workout plan ... },
  "saved": true,
  "id": "uuid"
}
```

---

## 6. Next Steps After Fixing

Once logs show **"✅ AI plan generated successfully!"**:

1. The plan will display in the modal
2. It will be different each time you generate
3. Check Supabase Table Editor → `workout_programs` for saved data
4. Verify legal disclaimer is included in plan

---

**Start with Step 1 & 2 to ensure deployment is correct, then Step 3 to see exact error!**
