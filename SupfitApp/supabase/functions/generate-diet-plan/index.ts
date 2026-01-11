// Supabase Edge Function: Generate AI Diet Plan with Google Gemini
// Deploy: supabase functions deploy generate-diet-plan

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface DietRequest {
  userId: string;
  preferences: {
    dietType: string; // 'balanced', 'keto', 'vegan', 'paleo', 'mediterranean'
    mealsPerDay: number; // 3-6
    calorieTarget: number; // calculated from TDEE
    macroSplit: {
      protein: number; // percentage
      carbs: number;
      fats: number;
    };
    allergies: string[];
    dislikes: string[];
  };
  healthProfile: {
    bmiCategory: string;
    ageRange: string;
    activityLevel: string; // 'sedentary', 'light', 'moderate', 'active', 'very_active'
    hasConditions: string[];
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

    // 2. Parse and validate
    const body: DietRequest = await req.json();
    if (body.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'User mismatch' }), { status: 403 });
    }

    // 3. Build diet plan prompt for Gemini
    const systemPrompt = `You are a nutrition educator providing general dietary guidance for educational purposes only.

CRITICAL COMPLIANCE RULES (Google Gemini Health Policy):
- This is EDUCATIONAL and INFORMATIONAL only - NOT medical/nutrition advice
- DO NOT diagnose, treat, or cure any medical condition or nutritional deficiency
- DO NOT prescribe specific diets for medical conditions
- ALWAYS include disclaimer: "This is general nutritional guidance for educational purposes only. Consult a registered dietitian or healthcare professional before making significant dietary changes, especially if you have medical conditions or take medications."
- Never recommend extreme calorie restriction (<1200 for women, <1500 for men)
- For diabetes: Suggest general low-GI principles, emphasize doctor consultation
- For hypertension: Suggest low-sodium principles, emphasize doctor consultation
- Respect food allergies/dislikes restrictions
- Provide portion sizes and meal timing as general guidance
- Include hydration recommendations

Return ONLY valid JSON:
{
  "planName": "string",
  "dailyCalories": number,
  "meals": [
    {
      "mealType": "Breakfast",
      "time": "7:00 AM",
      "foods": [
        {
          "name": "Oatmeal with berries",
          "portion": "1 cup oats, 1/2 cup berries",
          "calories": 250,
          "protein": 8,
          "carbs": 45,
          "fats": 5,
          "notes": "High fiber, sustained energy"
        }
      ],
      "totalCalories": 350,
      "mealTips": "Eat within 1 hour of waking"
    }
  ],
  "snacks": [],
  "hydration": "3-4 liters water daily",
  "supplements": [],
  "recommendations": [],
  "legalDisclaimer": "IMPORTANT: This is general nutritional guidance for educational purposes only, not medical or dietary advice. Consult a registered dietitian or qualified healthcare professional before making significant dietary changes, especially if you have medical conditions, food allergies, take medications, or have special dietary needs. Individual nutritional needs vary significantly."
}`;

    const userPrompt = `Create a ${body.preferences.mealsPerDay}-meal educational nutrition plan for someone with these characteristics:

Preferences:
- Diet Type: ${body.preferences.dietType}
- Target Calories: ${body.preferences.calorieTarget} kcal (as general guidance)
- Macro Distribution: ${body.preferences.macroSplit.protein}% protein, ${body.preferences.macroSplit.carbs}% carbs, ${body.preferences.macroSplit.fats}% fats
${body.preferences.allergies.length > 0 ? `- Must Avoid (Allergies): ${body.preferences.allergies.join(', ')}` : ''}
${body.preferences.dislikes.length > 0 ? `- Preferences to Avoid: ${body.preferences.dislikes.join(', ')}` : ''}

Profile (for educational guidance only):
- BMI Category: ${body.healthProfile.bmiCategory}
- Age Range: ${body.healthProfile.ageRange}
- Activity Level: ${body.healthProfile.activityLevel}
${body.healthProfile.hasConditions.length > 0 ? `- Has conditions (generic): ${body.healthProfile.hasConditions.join(', ')} - IMPORTANT: Emphasize dietitian/doctor consultation FIRST` : ''}

Generate a balanced, educational meal plan with comprehensive legal disclaimer. Remember: This is guidance only, NOT medical/dietary advice.`;

    // 4. Call Google Gemini API
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
            }
          ]
        }),
      }
    );

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service unavailable', fallback: true }),
        { status: 503 }
      );
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const generatedPlan = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // 5. Add metadata
    const finalPlan = {
      ...generatedPlan,
      generatedAt: new Date().toISOString(),
      preferences: body.preferences,
    };

    // 6. Save to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('diet_plans')
      .insert({
        user_id: user.id,
        plan_name: finalPlan.planName,
        plan_type: 'ai_generated',
        plan_data: finalPlan,
        is_active: true,
      })
      .select()
      .single();

    if (saveError) {
      return new Response(
        JSON.stringify({ plan: finalPlan, saved: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
