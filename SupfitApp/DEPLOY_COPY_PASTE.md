# Deploy Edge Functions - Copy/Paste into Supabase Dashboard

## Step 1: Deploy generate-workout-plan

1. Go to: https://supabase.com/dashboard/project/qescuzpwuetnafgnmmrz/functions
2. Click **"Create a new function"**
3. Name: `generate-workout-plan`
4. Copy **ALL** the code below and paste into the editor:

---

```typescript
// Supabase Edge Function: Generate AI Workout Plan with Google Gemini
// Deploy: supabase functions deploy generate-workout-plan

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface WorkoutRequest {
  userId: string;
  preferences: {
    daysPerWeek: number;
    workoutStyle: string;
    sessionDuration: number;
    fitnessGoal: string;
    experienceLevel: string;
    equipment: string[];
  };
  // Minimal health data (anonymized)
  healthProfile: {
    bmiCategory: string; // 'underweight' | 'normal' | 'overweight' | 'obese'
    ageRange: string; // '18-25' | '26-35' | '36-45' | '46-55' | '56+'
    hasConditions: string[]; // Generic conditions only: ['hypertension', 'diabetes']
    medicationTypes: string[]; // Generic types: ['blood_pressure', 'insulin']
  };
}

serve(async (req) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // 2. Parse request
    const body: WorkoutRequest = await req.json();

    // 3. Validate user matches
    if (body.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'User mismatch' }), { status: 403 });
    }

    // 4. Build minimal, anonymized prompt for Gemini
    const systemPrompt = `You are an expert fitness coach providing educational fitness guidance only. 

CRITICAL COMPLIANCE RULES (Google Gemini Health Policy):
- This is EDUCATIONAL and INFORMATIONAL only - NOT medical advice
- DO NOT diagnose, treat, or cure any medical condition
- ALWAYS include disclaimer: "This is general fitness guidance. Consult a healthcare professional before starting any exercise program, especially if you have medical conditions."
- If medical conditions exist, provide gentle modifications and strongly recommend doctor consultation FIRST
- For "obese" BMI, prioritize low-impact exercises to protect joints
- Include proper warmup and cooldown
- Provide form tips and safety warnings
- Be conservative with intensity for beginners

Return ONLY valid JSON matching this structure:
{
  "planName": "string",
  "weeklyPlan": [
    {
      "day": "Monday",
      "muscleGroup": "Chest & Triceps",
      "exercises": [
        {
          "name": "Push-ups",
          "sets": "3",
          "reps": "10-12",
          "duration": "10 mins",
          "caloriesBurn": 80,
          "restPeriod": "60s",
          "tips": "Keep core tight"
        }
      ],
      "totalDuration": 60,
      "totalCalories": 400,
      "warmup": "5-10 min dynamic stretching",
      "cooldown": "5-10 min static stretching"
    }
  ],
  "legalDisclaimer": "IMPORTANT: This is general fitness guidance for educational purposes only, not medical advice. Consult a qualified healthcare professional before starting any exercise program, especially if you have pre-existing medical conditions, injuries, or take medications. Stop exercising and seek medical attention if you experience pain, dizziness, or unusual symptoms."
}`;

    const userPrompt = `Create a ${body.preferences.daysPerWeek}-day educational fitness plan for someone with these characteristics:

Preferences:
- Style: ${body.preferences.workoutStyle}
- Duration: ${body.preferences.sessionDuration} minutes per session
- Goal: ${body.preferences.fitnessGoal}
- Experience: ${body.preferences.experienceLevel}
- Equipment Available: ${body.preferences.equipment.join(', ')}

Health Profile (for educational guidance only):
- BMI Category: ${body.healthProfile.bmiCategory}
- Age Range: ${body.healthProfile.ageRange}
${body.healthProfile.hasConditions.length > 0 ? `- Has conditions (generic): ${body.healthProfile.hasConditions.join(', ')} - IMPORTANT: Emphasize doctor consultation FIRST` : ''}
${body.healthProfile.medicationTypes.length > 0 ? `- Takes medication types: ${body.healthProfile.medicationTypes.join(', ')} - IMPORTANT: Emphasize doctor consultation FIRST` : ''}

Generate a safe, educational fitness plan with exercises matching the equipment. Include comprehensive legal disclaimer. Remember: This is guidance only, NOT medical advice.`;

    // 5. Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable', fallback: true }),
        { status: 503 }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Parse Gemini response structure
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const generatedPlan = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // 6. Validate response structure
    if (!generatedPlan.weeklyPlan || !Array.isArray(generatedPlan.weeklyPlan)) {
      throw new Error('Invalid plan structure from AI');
    }

    // 7. Add metadata
    const finalPlan = {
      ...generatedPlan,
      generatedAt: new Date().toISOString(),
      preferences: body.preferences,
      totalWeeklyCalories: generatedPlan.weeklyPlan.reduce(
        (sum: number, day: any) => sum + (day.totalCalories || 0),
        0
      ),
    };

    // 8. Save to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('workout_programs')
      .insert({
        user_id: user.id,
        program_name: finalPlan.planName,
        plan_type: 'ai_generated',
        plan_data: finalPlan,
        is_active: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      // Return plan anyway, let client handle save
      return new Response(
        JSON.stringify({ plan: finalPlan, saved: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 9. Success response
    return new Response(
      JSON.stringify({ plan: finalPlan, saved: true, id: savedPlan.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, fallback: true }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

5. Click **"Deploy function"**
6. Wait for success message

✅ **DONE!** Now the function is live at:
`https://qescuzpwuetnafgnmmrz.supabase.co/functions/v1/generate-workout-plan`

---

## Notes
- The code is now fixed (removed incomplete line and duplicate OpenAI code)
- Fixed JSON structure in system prompt
- Ready to deploy without errors
