// Client-side AI Plan Generator
// Calls Supabase Edge Functions with minimal, anonymized data

import { supabase } from './supabaseClient';

interface UserHealthData {
  bmi: number | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  chronicConditions: string[];
  medications: string;
  allergies: string;
}

interface WorkoutPreferences {
  daysPerWeek: number;
  workoutStyle: string;
  sessionDuration: number;
  fitnessGoal: string;
  experienceLevel: string;
  equipment: string[];
}

interface DietPreferences {
  dietType: string;
  mealsPerDay: number;
  calorieTarget: number;
  macroSplit: { protein: number; carbs: number; fats: number };
  allergies: string[];
  dislikes: string[];
}

// Privacy helper: Anonymize sensitive health data
export function anonymizeHealthData(healthData: UserHealthData) {
  // Convert BMI to category
  let bmiCategory = 'normal';
  if (healthData.bmi) {
    if (healthData.bmi < 18.5) bmiCategory = 'underweight';
    else if (healthData.bmi < 25) bmiCategory = 'normal';
    else if (healthData.bmi < 30) bmiCategory = 'overweight';
    else bmiCategory = 'obese';
  }

  // Convert age to range
  let ageRange = '26-35'; // default
  if (healthData.age) {
    if (healthData.age < 26) ageRange = '18-25';
    else if (healthData.age < 36) ageRange = '26-35';
    else if (healthData.age < 46) ageRange = '36-45';
    else if (healthData.age < 56) ageRange = '46-55';
    else ageRange = '56+';
  }

  // Generic condition names only (no specific medications)
  const genericConditions = healthData.chronicConditions
    .map((c) => c.toLowerCase())
    .filter((c) =>
      ['hypertension', 'diabetes', 'asthma', 'arthritis'].includes(c)
    );

  // Generic medication types (not specific drug names)
  const medicationTypes: string[] = [];
  const medLower = healthData.medications.toLowerCase();
  if (medLower.includes('blood pressure') || medLower.includes('hypertension')) {
    medicationTypes.push('blood_pressure');
  }
  if (medLower.includes('insulin') || medLower.includes('diabetes')) {
    medicationTypes.push('insulin');
  }
  if (medLower.includes('inhaler') || medLower.includes('asthma')) {
    medicationTypes.push('respiratory');
  }

  return {
    bmiCategory,
    ageRange,
    hasConditions: genericConditions,
    medicationTypes,
  };
}

// Generate AI Workout Plan
export async function generateAIWorkoutPlan(
  userId: string,
  healthData: UserHealthData,
  preferences: WorkoutPreferences
) {
  try {
    console.log('🔐 Getting auth session...');
    
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    console.log('✅ Session obtained');
    console.log('🔗 Calling Edge Function:', `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-workout-plan`);

    // Anonymize health data
    const healthProfile = anonymizeHealthData(healthData);
    console.log('🛡️ Anonymized health profile:', healthProfile);

    // Call Edge Function
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-workout-plan`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences,
          healthProfile,
        }),
      }
    );

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📦 Result:', result);

    // Check if fallback is needed
    if (result.fallback) {
      console.warn('⚠️ AI service unavailable, using fallback');
      return { plan: null, error: 'AI_UNAVAILABLE', fallback: true };
    }

    console.log('✅ AI plan generated successfully!');
    return { plan: result.plan, saved: result.saved, id: result.id };
  } catch (error: any) {
    console.error('❌ AI workout generation error:', error);
    console.error('Error details:', error.message, error.stack);
    return { plan: null, error: error.message, fallback: true };
  }
}

// Generate AI Diet Plan
export async function generateAIDietPlan(
  userId: string,
  healthData: UserHealthData,
  preferences: DietPreferences
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const healthProfile = {
      ...anonymizeHealthData(healthData),
      activityLevel: calculateActivityLevel(preferences.calorieTarget, healthData),
    };

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-diet-plan`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences,
          healthProfile,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate diet plan');
    }

    const result = await response.json();

    if (result.fallback) {
      return { plan: null, error: 'AI_UNAVAILABLE', fallback: true };
    }

    return { plan: result.plan, saved: result.saved, id: result.id };
  } catch (error: any) {
    console.error('AI diet generation error:', error);
    return { plan: null, error: error.message, fallback: true };
  }
}

// Helper: Calculate activity level from TDEE
function calculateActivityLevel(calorieTarget: number, healthData: UserHealthData): string {
  if (!healthData.weight) return 'moderate';
  
  // Rough BMR calculation (Mifflin-St Jeor)
  const bmr = healthData.weight * 22; // Simplified
  const ratio = calorieTarget / bmr;

  if (ratio < 1.2) return 'sedentary';
  if (ratio < 1.375) return 'light';
  if (ratio < 1.55) return 'moderate';
  if (ratio < 1.725) return 'active';
  return 'very_active';
}

// Fallback: Use local mock generation if AI fails
export function useFallbackWorkoutPlan(
  preferences: WorkoutPreferences,
  healthData: UserHealthData
) {
  console.log('Using fallback workout plan generation');
  // This would use the existing mock logic from PlanNative.tsx
  // Import and call the existing generateAIWorkoutPlan function
  return null;
}
