// Example: Integrating Real AI into PlanNative.tsx
// Copy this code to replace the mock generateAIWorkoutPlan function

import { generateAIWorkoutPlan as generateAIWorkoutPlanAPI } from '@/lib/aiPlanGenerator';

// Modified generateAIWorkoutPlan function in PlanNative.tsx
const generateAIWorkoutPlan = async () => {
  setIsGenerating(true);
  try {
    // Option 1: Use Real AI (recommended for production)
    const USE_REAL_AI = true; // Set to false to use mock

    if (USE_REAL_AI) {
      // Call Supabase Edge Function → OpenAI
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const result = await generateAIWorkoutPlanAPI(
        userId,
        {
          bmi: userHealthData.bmi,
          weight: userHealthData.weight,
          height: userHealthData.height,
          age: null, // Calculate from birthdate if available
          chronicConditions: userHealthData.chronicConditions,
          medications: userHealthData.medications,
          allergies: userHealthData.allergies,
        },
        preferences
      );

      if (result.fallback) {
        // AI service unavailable, use mock
        Alert.alert(
          'AI Unavailable',
          'Using offline plan generator. Your plan will still be personalized.',
          [{ text: 'OK' }]
        );
        // Fall through to mock generation below
      } else if (result.plan) {
        // Success! AI plan generated
        setGeneratedPlan(result.plan);
        setShowPreferencesModal(false);
        setShowGeneratedPlanModal(true);
        return; // Exit early
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    }

    // Option 2: Mock Generation (fallback or testing)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const selectedDays = daysOfWeek.slice(0, preferences.daysPerWeek);

    const muscleGroups = preferences.workoutStyle === 'Strength Training' 
      ? ['Chest & Triceps', 'Back & Biceps', 'Legs & Core', 'Shoulders & Arms', 'Chest & Triceps', 'Back & Biceps', 'Legs & Core']
      : preferences.workoutStyle === 'Cardio'
      ? ['Cardio Endurance', 'Cardio Endurance', 'Cardio Endurance', 'Cardio Endurance', 'Cardio Endurance']
      : ['Chest & Triceps', 'Back & Biceps', 'Legs & Core', 'Shoulders & Arms'];

    const weeklyPlan: DailyWorkout[] = selectedDays.map((day, index) => {
      const muscleGroup = muscleGroups[index % muscleGroups.length];
      
      const exercises: Exercise[] = generateExercisesForDay(
        muscleGroup, 
        preferences.workoutStyle,
        preferences.equipment,
        preferences.experienceLevel
      );

      const totalCalories = exercises.reduce((sum, ex) => sum + ex.caloriesBurn, 0);

      return {
        day,
        muscleGroup,
        exercises,
        totalDuration: preferences.sessionDuration,
        totalCalories,
        warmup: '5-10 min dynamic stretching and light cardio',
        cooldown: '5-10 min static stretching and foam rolling'
      };
    });

    const plan: GeneratedWorkoutPlan = {
      planName: `${preferences.fitnessGoal} - ${preferences.workoutStyle} Plan`,
      weeklyPlan,
      totalWeeklyCalories: weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0),
      recommendations: generateRecommendations(preferences, userHealthData),
      createdAt: new Date(),
      preferences
    };

    setGeneratedPlan(plan);
    setShowPreferencesModal(false);
    setShowGeneratedPlanModal(true);

  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to generate workout plan. Please try again.');
    console.error('Error generating plan:', error);
  } finally {
    setIsGenerating(false);
  }
};

// Example: Add toggle in UI for testing
// Add this in the preferences modal before "Generate Plan" button:

{/* Development Toggle */}
{__DEV__ && (
  <View style={modalStyles.inputGroup}>
    <Text style={modalStyles.label}>AI Mode (Dev Only)</Text>
    <View style={modalStyles.chipContainer}>
      <TouchableOpacity
        style={[
          modalStyles.chip,
          USE_REAL_AI && modalStyles.chipActive
        ]}
        onPress={() => setUseRealAI(true)}
      >
        <Text style={[
          modalStyles.chipText,
          USE_REAL_AI && modalStyles.chipTextActive
        ]}>
          Real AI (OpenAI)
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          modalStyles.chip,
          !USE_REAL_AI && modalStyles.chipActive
        ]}
        onPress={() => setUseRealAI(false)}
      >
        <Text style={[
          modalStyles.chipText,
          !USE_REAL_AI && modalStyles.chipTextActive
        ]}>
          Mock (Offline)
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}

// Add state at top of component:
const [useRealAI, setUseRealAI] = useState(false); // Default to mock for testing
