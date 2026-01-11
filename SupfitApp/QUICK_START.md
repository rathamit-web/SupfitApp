# 🚀 Quick Start - AI Deployment (5 Minutes)

## Your Credentials
- **Supabase URL**: `https://qescuzpwuetnafgnmmrz.supabase.co`
- **Project ID**: `qescuzpwuetnafgnmmrz`
- **Gemini API Key**: `AIzaSyCuo7SOXQqp-trBrrFakjmxdfcHTffEiN8`

---

## Deploy in 5 Steps:

### 1️⃣ Set API Key (1 min)
https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/settings/functions
→ Secrets tab → New Secret → Name: `GEMINI_API_KEY` → Value: `AIzaSyCuo7SOXQqp-trBrrFakjmxdfcHTffEiN8`

### 2️⃣ Deploy Workout Function (2 mins)
https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions
→ Create function → Name: `generate-workout-plan`
→ Copy code from `SupfitApp/supabase/functions/generate-workout-plan/index.ts`
→ Deploy

### 3️⃣ Deploy Diet Function (1 min)
→ Create function → Name: `generate-diet-plan`
→ Copy code from `SupfitApp/supabase/functions/generate-diet-plan/index.ts`
→ Deploy

### 4️⃣ Create Tables (1 min)
https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/editor
→ SQL Editor → Copy SQL from `AI_INTEGRATION_COMPLETE.md` (Step 3)
→ Run

### 5️⃣ Test App (1 min)
```powershell
cd C:\Users\Amit\MyProject\Supfit_Dev\SupfitApp
npm start
```
→ Open app → Plans tab → Toggle "Google Gemini AI" → Generate Plan

---

## ✅ Success Indicators:
- Toggle shows "🤖 Google Gemini AI"
- Plan generates in 5-10 seconds
- Modal shows weekly workouts with exercises
- Plan saved to database (check Table Editor)

---

## 🐛 If Something Fails:
- Toggle to "💡 Local Algorithm" (always works as fallback)
- Check Function Logs: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions
- See full troubleshooting in `AI_INTEGRATION_COMPLETE.md`

---

## 📊 What's Live:
✅ PlanNative.tsx updated with AI toggle
✅ aiPlanGenerator.ts helper library
✅ Edge Functions ready to deploy
✅ Database schema ready
✅ Legal disclaimers included
✅ Free tier: 1,500 plans/day

**Cost**: $0 (FREE tier)

---

## 📚 Full Docs:
- `AI_INTEGRATION_COMPLETE.md` - Complete guide
- `GEMINI_SETUP_GUIDE.md` - Detailed setup
- `ARCHITECTURE.md` - System design
- `DEPLOYMENT_QUICK_START.md` - Alternative methods

**You're ready to go! 🎉**
