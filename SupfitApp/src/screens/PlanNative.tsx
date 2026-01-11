import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Pressable, Dimensions, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import FooterNav from '../components/FooterNav';
import { supabase } from '../lib/supabaseClient';
import { generateAIWorkoutPlan as callRealAI } from '../lib/aiPlanGenerator';

// Type Definitions
interface WorkoutPreferences {
  daysPerWeek: number;
  workoutStyle: string;
  sessionDuration: number;
  fitnessGoal: string;
  experienceLevel: string;
  equipment: string[];
  medications: string;
  medicalConditions: string;
}

interface UserHealthData {
  bmi: number | null;
  weight: number | null;
  height: number | null;
  bodyFatPercentage: string;
  chronicConditions: string[];
  medications: string;
  allergies: string;
  injuries: string;
}

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  duration: string;
  caloriesBurn: number;
  restPeriod: string;
  tips: string;
}

interface DailyWorkout {
  day: string;
  muscleGroup: string;
  exercises: Exercise[];
  totalDuration: number;
  totalCalories: number;
  warmup: string;
  cooldown: string;
}

interface GeneratedWorkoutPlan {
  planName: string;
  weeklyPlan: DailyWorkout[];
  totalWeeklyCalories: number;
  recommendations: string[];
  createdAt: Date;
  preferences: WorkoutPreferences;
}

// Constants for preferences
const WORKOUT_STYLES = ['Strength Training', 'Cardio', 'HIIT', 'Yoga', 'CrossFit', 'Powerlifting', 'Calisthenics', 'Mixed'];
const SESSION_DURATIONS = [30, 45, 60, 90];
const FITNESS_GOALS = ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness', 'Athletic Performance'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT_OPTIONS = ['Dumbbells', 'Barbell', 'Machines', 'Bodyweight', 'Resistance Bands', 'Kettlebells', 'Pull-up Bar', 'Full Gym'];

interface ExerciseDB {
  [key: string]: Exercise[];
}

const coachWorkouts = [
  {
    id: 1,
    name: 'Barbell Bench Press',
    sets: '4 sets of 8-10 reps',
    duration: '15 mins',
    calories: 180,
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  {
    id: 2,
    name: 'Incline Dumbbell Press',
    sets: '3 sets of 10-12 reps',
    duration: '12 mins',
    calories: 140,
    videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  },
  {
    id: 3,
    name: 'Cable Fly',
    sets: '3 sets of 12-15 reps',
    duration: '10 mins',
    calories: 100,
    videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
  },
  {
    id: 4,
    name: 'Tricep Pushdown',
    sets: '3 sets of 12 reps',
    duration: '8 mins',
    calories: 85,
    videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
  },
  {
    id: 5,
    name: 'Overhead Tricep Extension',
    sets: '3 sets of 10-12 reps',
    duration: '10 mins',
    calories: 95,
    videoUrl: 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
  },
];

const supplementPlan = [
  {
    title: 'Chest Day Stack',
    pre: [
      { label: 'Creatine', note: '30 min before' },
      { label: 'Beta-Alanine', note: '30 min before' },
    ],
    post: [
      { label: 'Whey Protein', note: 'Immediately after' },
      { label: 'BCAAs', note: 'After workout' },
    ],
  },
];

const PlanNative = ({ navigation }: any) => {
  // Simulate coach subscription (replace with real logic as needed)
  const [hasCoachSubscription] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'coach' | 'ai'>(hasCoachSubscription ? 'coach' : 'ai');
  const totalCalories = coachWorkouts.reduce((sum, ex) => sum + ex.calories, 0);
  const isMobile = Dimensions.get('window').width < 600;

  // AI Plan Generation States
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showGeneratedPlanModal, setShowGeneratedPlanModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [useRealAI, setUseRealAI] = useState(true); // Toggle: true = Google Gemini AI, false = Mock AI
  
  const [userHealthData, setUserHealthData] = useState<UserHealthData>({
    bmi: null,
    weight: null,
    height: null,
    bodyFatPercentage: '',
    chronicConditions: [],
    medications: '',
    allergies: '',
    injuries: ''
  });

  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    daysPerWeek: 4,
    workoutStyle: 'Strength Training',
    sessionDuration: 60,
    fitnessGoal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    equipment: ['Dumbbells', 'Barbell'],
    medications: '',
    medicalConditions: ''
  });

  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null);

  useEffect(() => {
    setSelectedPlan(hasCoachSubscription ? 'coach' : 'ai');
  }, [hasCoachSubscription]);

  useEffect(() => {
    fetchUserHealthData();
  }, []);

  // Fetch user health data from Supabase
  const fetchUserHealthData = async () => {
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) return;

      const { data, error } = await supabase
        .from('user_details')
        .select('body_composition, medical_history')
        .eq('user_id', user_id)
        .single();

      if (error) throw error;

      if (data) {
        const bodyComp = data.body_composition || {};
        const medicalHist = data.medical_history || {};

        let bmi = null;
        if (bodyComp.weight && bodyComp.height) {
          const weightKg = parseFloat(bodyComp.weight);
          const heightM = parseFloat(bodyComp.height) / 100;
          bmi = weightKg / (heightM * heightM);
        }

        setUserHealthData({
          bmi,
          weight: bodyComp.weight || null,
          height: bodyComp.height || null,
          bodyFatPercentage: bodyComp.bodyFatPercentage || '',
          chronicConditions: medicalHist.chronicConditions || [],
          medications: medicalHist.medications || '',
          allergies: medicalHist.allergies || '',
          injuries: medicalHist.injuries || ''
        });

        setPreferences(prev => ({
          ...prev,
          medications: medicalHist.medications || '',
          medicalConditions: medicalHist.chronicConditions?.join(', ') || ''
        }));
      }
    } catch (error: any) {
      console.error('Error fetching user health data:', error);
    }
  };

  // Generate exercises for a specific day
  const generateExercisesForDay = (
    muscleGroup: string,
    style: string,
    equipment: string[],
    level: string
  ): Exercise[] => {
    const exerciseDatabase: ExerciseDB = {
      'Chest & Triceps': [
        { name: 'Barbell Bench Press', sets: '4', reps: '8-10', duration: '15 mins', caloriesBurn: 180, restPeriod: '90s', tips: 'Keep core tight, lower to chest' },
        { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', duration: '12 mins', caloriesBurn: 140, restPeriod: '60s', tips: 'Focus on upper chest contraction' },
        { name: 'Cable Flyes', sets: '3', reps: '12-15', duration: '10 mins', caloriesBurn: 100, restPeriod: '45s', tips: 'Squeeze at the center' },
        { name: 'Tricep Dips', sets: '3', reps: '10-12', duration: '8 mins', caloriesBurn: 95, restPeriod: '60s', tips: 'Lean forward for chest emphasis' },
        { name: 'Tricep Pushdowns', sets: '3', reps: '12-15', duration: '8 mins', caloriesBurn: 85, restPeriod: '45s', tips: 'Keep elbows stationary' }
      ],
      'Back & Biceps': [
        { name: 'Pull-Ups', sets: '4', reps: '8-10', duration: '12 mins', caloriesBurn: 150, restPeriod: '90s', tips: 'Full range of motion' },
        { name: 'Barbell Rows', sets: '4', reps: '8-10', duration: '15 mins', caloriesBurn: 170, restPeriod: '90s', tips: 'Pull to lower chest' },
        { name: 'Lat Pulldowns', sets: '3', reps: '10-12', duration: '10 mins', caloriesBurn: 120, restPeriod: '60s', tips: 'Retract shoulder blades' },
        { name: 'Barbell Curls', sets: '3', reps: '10-12', duration: '10 mins', caloriesBurn: 100, restPeriod: '60s', tips: 'No swinging' },
        { name: 'Hammer Curls', sets: '3', reps: '12-15', duration: '8 mins', caloriesBurn: 90, restPeriod: '45s', tips: 'Squeeze at the top' }
      ],
      'Legs & Core': [
        { name: 'Barbell Squats', sets: '4', reps: '8-10', duration: '15 mins', caloriesBurn: 200, restPeriod: '120s', tips: 'Depth to parallel or below' },
        { name: 'Romanian Deadlifts', sets: '3', reps: '10-12', duration: '12 mins', caloriesBurn: 160, restPeriod: '90s', tips: 'Feel hamstring stretch' },
        { name: 'Leg Press', sets: '3', reps: '12-15', duration: '12 mins', caloriesBurn: 150, restPeriod: '60s', tips: 'Full range of motion' },
        { name: 'Plank Holds', sets: '3', reps: '60s', duration: '5 mins', caloriesBurn: 50, restPeriod: '60s', tips: 'Keep body straight' },
        { name: 'Russian Twists', sets: '3', reps: '20', duration: '8 mins', caloriesBurn: 80, restPeriod: '45s', tips: 'Control the rotation' }
      ],
      'Shoulders & Arms': [
        { name: 'Overhead Press', sets: '4', reps: '8-10', duration: '15 mins', caloriesBurn: 160, restPeriod: '90s', tips: 'Press straight up' },
        { name: 'Lateral Raises', sets: '3', reps: '12-15', duration: '10 mins', caloriesBurn: 110, restPeriod: '60s', tips: 'Control the descent' },
        { name: 'Front Raises', sets: '3', reps: '12-15', duration: '10 mins', caloriesBurn: 100, restPeriod: '60s', tips: 'Keep arms straight' },
        { name: 'Bicep Curls', sets: '3', reps: '10-12', duration: '10 mins', caloriesBurn: 95, restPeriod: '60s', tips: 'Full contraction' },
        { name: 'Skull Crushers', sets: '3', reps: '10-12', duration: '10 mins', caloriesBurn: 90, restPeriod: '60s', tips: 'Protect elbows' }
      ],
      'Cardio Endurance': [
        { name: 'Treadmill Running', sets: '1', reps: 'N/A', duration: '30 mins', caloriesBurn: 350, restPeriod: 'N/A', tips: 'Maintain steady pace' },
        { name: 'Cycling', sets: '1', reps: 'N/A', duration: '20 mins', caloriesBurn: 250, restPeriod: 'N/A', tips: 'Keep RPM consistent' },
        { name: 'Jump Rope', sets: '5', reps: '2 min', duration: '15 mins', caloriesBurn: 200, restPeriod: '60s', tips: 'Light on feet' },
        { name: 'Rowing Machine', sets: '1', reps: 'N/A', duration: '20 mins', caloriesBurn: 240, restPeriod: 'N/A', tips: 'Drive with legs' }
      ]
    };

    const availableExercises = exerciseDatabase[muscleGroup] || exerciseDatabase['Chest & Triceps'];
    let selectedExercises = [...availableExercises];
    
    if (level === 'Beginner') {
      selectedExercises = selectedExercises.slice(0, 4);
    } else if (level === 'Intermediate') {
      selectedExercises = selectedExercises.slice(0, 5);
    }

    return selectedExercises;
  };

  // Generate recommendations
  const generateRecommendations = (prefs: WorkoutPreferences, health: UserHealthData): string[] => {
    const recommendations: string[] = [];

    if (health.bmi && health.bmi > 30) {
      recommendations.push('Focus on low-impact cardio initially to protect joints');
    }

    if (health.chronicConditions.includes('Hypertension')) {
      recommendations.push('Monitor heart rate and avoid excessive strain');
      recommendations.push('Include breathing exercises and cool-down periods');
    }

    if (health.chronicConditions.includes('Diabetes')) {
      recommendations.push('Monitor blood sugar before and after workouts');
      recommendations.push('Keep fast-acting carbs available during exercise');
    }

    if (prefs.experienceLevel === 'Beginner') {
      recommendations.push('Start with lighter weights and focus on form');
      recommendations.push('Gradually increase intensity over 4-6 weeks');
    }

    if (prefs.fitnessGoal === 'Weight Loss') {
      recommendations.push('Maintain a caloric deficit of 300-500 calories daily');
      recommendations.push('Combine strength training with cardio for best results');
    }

    if (prefs.fitnessGoal === 'Muscle Gain') {
      recommendations.push('Consume 1.6-2.2g protein per kg body weight daily');
      recommendations.push('Focus on progressive overload and compound movements');
    }

    recommendations.push('Stay hydrated - drink 3-4 liters of water daily');
    recommendations.push('Get 7-9 hours of quality sleep for recovery');

    return recommendations;
  };

  // Generate AI workout plan
  const generateAIWorkoutPlan = async () => {
    setIsGenerating(true);
    try {
      // Try real AI first if enabled
      if (useRealAI) {
        try {
          console.log('🤖 Attempting to generate AI workout plan...');
          
          const user = await supabase.auth.getUser();
          if (!user.data.user) {
            throw new Error('User not authenticated');
          }

          console.log('✅ User authenticated:', user.data.user.id);
          console.log('📊 Health data:', userHealthData);
          console.log('⚙️ Preferences:', preferences);

          // Call real AI service
          const result = await callRealAI(
            user.data.user.id,
            userHealthData,
            preferences
          );

          console.log('📥 AI Response:', result);

          if (result.error || result.fallback) {
            // AI failed, fall back to mock
            console.warn('⚠️ AI service failed, using mock generation:', result.error);
            Alert.alert(
              'Note',
              `AI service error: ${result.error || 'Unknown error'}. Using local algorithm instead.`,
              [{ text: 'OK' }]
            );
            // Fall through to mock generation below
          } else if (result.plan) {
            // AI succeeded! Display the plan
            console.log('✅ AI plan generated successfully!');
            setGeneratedPlan(result.plan);
            setShowPreferencesModal(false);
            setShowGeneratedPlanModal(true);
            setIsGenerating(false);
            return; // Exit early - AI worked!
          }
        } catch (aiError: any) {
          console.error('❌ Real AI error:', aiError);
          Alert.alert(
            'Note',
            `AI service error: ${aiError.message}. Using local algorithm instead.`,
            [{ text: 'OK' }]
          );
          // Fall through to mock generation
        }
      }

      // Mock AI Generation (original logic)
      console.log('🔄 Using local algorithm...');
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
      Alert.alert('Error', 'Failed to generate workout plan. Please try again.');
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save plan to Supabase
  const savePlanToSupabase = async () => {
    if (!generatedPlan) return;

    setIsSaving(true);
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) {
        Alert.alert('Error', 'Please log in to save your plan');
        return;
      }

      const { error } = await supabase
        .from('workout_programs')
        .insert({
          user_id,
          program_name: generatedPlan.planName,
          plan_type: 'ai_generated',
          plan_data: generatedPlan,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      Alert.alert('Success', 'Your AI workout plan has been saved!', [
        {
          text: 'OK',
          onPress: () => {
            setShowGeneratedPlanModal(false);
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', `Failed to save plan: ${error.message}`);
      console.error('Error saving plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateWithChanges = () => {
    setShowGeneratedPlanModal(false);
    setShowPreferencesModal(true);
  };

  // Footer styles (copied from IndividualUserHome)
  const footerStyles = StyleSheet.create({
    footerContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 64,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.92)',
      borderTopWidth: 0.5,
      borderColor: '#e5e5ea',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      marginBottom: 16,
    },
    iconBtn: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 2,
    },
    iconBtnActive: {
      backgroundColor: 'rgba(255,60,32,0.08)',
    },
    iconShadow: {
      shadowColor: '#ff3c20',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
  });

  // Render Preferences Modal
  const renderPreferencesModal = () => (
    <Modal
      visible={showPreferencesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreferencesModal(false)}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modalStyles.modalTitle}>AI Workout Plan Generator</Text>
            <Text style={modalStyles.modalSubtitle}>
              We'll create a personalized plan based on your health and preferences
            </Text>

            {/* Health Information Display */}
            {userHealthData.bmi && (
              <View style={modalStyles.healthCard}>
                <Text style={modalStyles.sectionTitle}>Your Health Profile</Text>
                <View style={modalStyles.healthRow}>
                  <Text style={modalStyles.healthLabel}>BMI:</Text>
                  <Text style={modalStyles.healthValue}>{userHealthData.bmi.toFixed(1)}</Text>
                </View>
                {userHealthData.weight && (
                  <View style={modalStyles.healthRow}>
                    <Text style={modalStyles.healthLabel}>Weight:</Text>
                    <Text style={modalStyles.healthValue}>{userHealthData.weight} kg</Text>
                  </View>
                )}
                {userHealthData.height && (
                  <View style={modalStyles.healthRow}>
                    <Text style={modalStyles.healthLabel}>Height:</Text>
                    <Text style={modalStyles.healthValue}>{userHealthData.height} cm</Text>
                  </View>
                )}
              </View>
            )}

            {/* Medical Information */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Current Medications (if any)</Text>
              <TextInput
                style={modalStyles.textArea}
                value={preferences.medications}
                onChangeText={(text) => setPreferences({...preferences, medications: text})}
                placeholder="e.g., Blood pressure medication, Insulin"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Medical Conditions (if any)</Text>
              <TextInput
                style={modalStyles.textArea}
                value={preferences.medicalConditions}
                onChangeText={(text) => setPreferences({...preferences, medicalConditions: text})}
                placeholder="e.g., Diabetes, Hypertension, Asthma"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Workout Preferences */}
            <Text style={modalStyles.sectionTitle}>Workout Preferences</Text>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Days per Week</Text>
              <View style={modalStyles.chipContainer}>
                {[3, 4, 5, 6].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      modalStyles.chip,
                      preferences.daysPerWeek === days && modalStyles.chipActive
                    ]}
                    onPress={() => setPreferences({...preferences, daysPerWeek: days})}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.daysPerWeek === days && modalStyles.chipTextActive
                    ]}>
                      {days} days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Workout Style</Text>
              <View style={modalStyles.chipContainer}>
                {WORKOUT_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      modalStyles.chip,
                      preferences.workoutStyle === style && modalStyles.chipActive
                    ]}
                    onPress={() => setPreferences({...preferences, workoutStyle: style})}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.workoutStyle === style && modalStyles.chipTextActive
                    ]}>
                      {style}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Session Duration</Text>
              <View style={modalStyles.chipContainer}>
                {SESSION_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      modalStyles.chip,
                      preferences.sessionDuration === duration && modalStyles.chipActive
                    ]}
                    onPress={() => setPreferences({...preferences, sessionDuration: duration})}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.sessionDuration === duration && modalStyles.chipTextActive
                    ]}>
                      {duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Fitness Goal</Text>
              <View style={modalStyles.chipContainer}>
                {FITNESS_GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      modalStyles.chip,
                      preferences.fitnessGoal === goal && modalStyles.chipActive
                    ]}
                    onPress={() => setPreferences({...preferences, fitnessGoal: goal})}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.fitnessGoal === goal && modalStyles.chipTextActive
                    ]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Experience Level</Text>
              <View style={modalStyles.chipContainer}>
                {EXPERIENCE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      modalStyles.chip,
                      preferences.experienceLevel === level && modalStyles.chipActive
                    ]}
                    onPress={() => setPreferences({...preferences, experienceLevel: level})}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.experienceLevel === level && modalStyles.chipTextActive
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Available Equipment</Text>
              <View style={modalStyles.chipContainer}>
                {EQUIPMENT_OPTIONS.map((equip) => (
                  <TouchableOpacity
                    key={equip}
                    style={[
                      modalStyles.chip,
                      preferences.equipment.includes(equip) && modalStyles.chipActive
                    ]}
                    onPress={() => {
                      const newEquipment = preferences.equipment.includes(equip)
                        ? preferences.equipment.filter(e => e !== equip)
                        : [...preferences.equipment, equip];
                      setPreferences({...preferences, equipment: newEquipment});
                    }}
                  >
                    <Text style={[
                      modalStyles.chipText,
                      preferences.equipment.includes(equip) && modalStyles.chipTextActive
                    ]}>
                      {equip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonSecondary]}
                onPress={() => setShowPreferencesModal(false)}
              >
                <Text style={modalStyles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonPrimary]}
                onPress={generateAIWorkoutPlan}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={modalStyles.buttonPrimaryText}>Generate Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Generated Plan Modal
  const renderGeneratedPlanModal = () => {
    if (!generatedPlan) return null;

    return (
      <Modal
        visible={showGeneratedPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGeneratedPlanModal(false)}
      >
        <View style={planModalStyles.modalOverlay}>
          <View style={planModalStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={planModalStyles.modalTitle}>{generatedPlan.planName}</Text>
              <Text style={planModalStyles.modalSubtitle}>
                Your personalized AI-generated workout plan
              </Text>

              {/* Weekly Summary Card */}
              <View style={planModalStyles.summaryCard}>
                <View style={planModalStyles.summaryRow}>
                  <Text style={planModalStyles.summaryLabel}>Total Weekly Calories</Text>
                  <Text style={planModalStyles.summaryValue}>
                    {generatedPlan.totalWeeklyCalories} kcal
                  </Text>
                </View>
                <View style={planModalStyles.summaryRow}>
                  <Text style={planModalStyles.summaryLabel}>Training Days</Text>
                  <Text style={planModalStyles.summaryValue}>
                    {generatedPlan.weeklyPlan.length} days/week
                  </Text>
                </View>
                <View style={planModalStyles.summaryRow}>
                  <Text style={planModalStyles.summaryLabel}>Session Duration</Text>
                  <Text style={planModalStyles.summaryValue}>
                    {generatedPlan.preferences.sessionDuration} min
                  </Text>
                </View>
              </View>

              {/* Daily Workouts */}
              <Text style={planModalStyles.sectionTitle}>Weekly Plan</Text>
              {generatedPlan.weeklyPlan.map((dayWorkout, dayIndex) => (
                <View key={dayIndex} style={planModalStyles.dayCard}>
                  <View style={planModalStyles.dayHeader}>
                    <Text style={planModalStyles.dayTitle}>{dayWorkout.day}</Text>
                    <Text style={planModalStyles.muscleGroup}>{dayWorkout.muscleGroup}</Text>
                  </View>

                  <View style={planModalStyles.dayStats}>
                    <View style={planModalStyles.statItem}>
                      <Text style={planModalStyles.statLabel}>Duration</Text>
                      <Text style={planModalStyles.statValue}>{dayWorkout.totalDuration} min</Text>
                    </View>
                    <View style={planModalStyles.statItem}>
                      <Text style={planModalStyles.statLabel}>Calories</Text>
                      <Text style={planModalStyles.statValue}>{dayWorkout.totalCalories} kcal</Text>
                    </View>
                  </View>

                  {/* Warmup */}
                  <View style={planModalStyles.phaseSection}>
                    <Text style={planModalStyles.phaseTitle}>🔥 Warmup</Text>
                    <Text style={planModalStyles.phaseText}>{dayWorkout.warmup}</Text>
                  </View>

                  {/* Exercises */}
                  {dayWorkout.exercises.map((exercise, exIndex) => (
                    <View key={exIndex} style={planModalStyles.exerciseCard}>
                      <Text style={planModalStyles.exerciseName}>{exercise.name}</Text>
                      <View style={planModalStyles.exerciseDetails}>
                        <Text style={planModalStyles.exerciseDetail}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                        <Text style={planModalStyles.exerciseDetail}>
                          Rest: {exercise.restPeriod}
                        </Text>
                      </View>
                      <Text style={planModalStyles.exerciseTips}>💡 {exercise.tips}</Text>
                      <Text style={planModalStyles.exerciseCalories}>
                        ~{exercise.caloriesBurn} kcal
                      </Text>
                    </View>
                  ))}

                  {/* Cooldown */}
                  <View style={planModalStyles.phaseSection}>
                    <Text style={planModalStyles.phaseTitle}>🧊 Cooldown</Text>
                    <Text style={planModalStyles.phaseText}>{dayWorkout.cooldown}</Text>
                  </View>
                </View>
              ))}

              {/* Recommendations */}
              <Text style={planModalStyles.sectionTitle}>Personalized Recommendations</Text>
              <View style={planModalStyles.recommendationsCard}>
                {generatedPlan.recommendations.map((rec, index) => (
                  <View key={index} style={planModalStyles.recommendationItem}>
                    <Text style={planModalStyles.bullet}>•</Text>
                    <Text style={planModalStyles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={planModalStyles.buttonRow}>
                <TouchableOpacity
                  style={[planModalStyles.button, planModalStyles.buttonSecondary]}
                  onPress={handleRegenerateWithChanges}
                >
                  <Text style={planModalStyles.buttonSecondaryText}>Regenerate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[planModalStyles.button, planModalStyles.buttonPrimary]}
                  onPress={savePlanToSupabase}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={planModalStyles.buttonPrimaryText}>Accept & Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={planModalStyles.closeButton}
                onPress={() => setShowGeneratedPlanModal(false)}
              >
                <Text style={planModalStyles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={["#fafafa", "#f5f5f7"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan Selection - vertical stack on mobile */}
        <View style={[styles.planSelectionStack, isMobile && { flexDirection: 'column', gap: 16 }]}> 
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'coach' && styles.planCardActive, !hasCoachSubscription && styles.planCardDisabled]}
            onPress={() => hasCoachSubscription && setSelectedPlan('coach')}
            activeOpacity={0.85}
            disabled={!hasCoachSubscription}
          >
            <View style={styles.planCardHeader}>
              <View style={styles.planCardIconWrap}>
                <MaterialIcons name="person" size={24} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planCardTitle}>Coach Suggested</Text>
                <Text style={styles.planCardSubtitle}>Personalized plan from Coach William</Text>
              </View>
              {selectedPlan === 'coach' && (
                <View style={styles.checkCircle}><Feather name="check-circle" size={18} color="#fff" /></View>
              )}
            </View>
            <View style={styles.planCardTagsRow}>
              <Text style={styles.planCardTag}>All Plan</Text>
              <Text style={styles.planCardTag}>Strength Focus</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'ai' && styles.planCardActive]}
            onPress={() => setSelectedPlan('ai')}
            activeOpacity={0.85}
          >
            <View style={styles.planCardHeader}>
              <View style={styles.planCardIconWrap}>
                <MaterialIcons name="auto-awesome" size={24} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planCardTitle}>AI Recommended</Text>
                <Text style={styles.planCardSubtitle}>Based on your health data and AI analysis</Text>
              </View>
              {selectedPlan === 'ai' && (
                <View style={styles.checkCircle}><Feather name="check-circle" size={18} color="#fff" /></View>
              )}
            </View>
            <View style={styles.planCardTagsRow}>
              <TouchableOpacity style={styles.aiGenBtn} onPress={() => {}}>
                <Feather name="cpu" size={14} color="#fff" />
                <Text style={styles.aiGenBtnText}>Generate AI Plan</Text>
              </TouchableOpacity>
              <Text style={styles.planCardTag}>Cardio + Core</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coach Plan */}
        {selectedPlan === 'coach' && hasCoachSubscription && (
          <>
            <View style={styles.calorieGoalCard}>
              <View>
                <Text style={styles.calorieGoalLabel}>Today&apos;s Burn Goal</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                  <Text style={styles.calorieGoalValue}>{totalCalories}</Text>
                  <Text style={styles.calorieGoalUnit}>kcal</Text>
                </View>
              </View>
              <View style={styles.calorieGoalIconWrap}>
                <MaterialIcons name="whatshot" size={32} color="#ff3c20" />
              </View>
            </View>
            <View style={styles.workoutDayCard}>
              <View style={styles.workoutDayIconWrap}>
                <MaterialIcons name="fitness-center" size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.workoutDayTitle}>Monday: Chest & Triceps</Text>
                <Text style={styles.workoutDaySubtitle}>Assigned by Coach Sarah</Text>
              </View>
            </View>
            {coachWorkouts.map((workout, index) => {
              let bgColor = '#e7f0ff';
              if (index % 3 === 0) bgColor = '#ffede7';
              else if (index % 3 === 1) bgColor = '#e7ffe7';
              return (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutCardHeader}>
                    <View style={[styles.workoutCardNum, { backgroundColor: bgColor }] }>
                      <Text style={styles.workoutCardNumText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workoutCardTitle}>{workout.name}</Text>
                      <View style={styles.workoutCardTagsRow}>
                        <View style={styles.workoutCardTag}><MaterialIcons name="bolt" size={12} color="#ff3c20" /><Text style={styles.workoutCardTagText}>{workout.sets}</Text></View>
                        <View style={styles.workoutCardTag}><MaterialIcons name="schedule" size={12} color="#007aff" /><Text style={styles.workoutCardTagText}>{workout.duration}</Text></View>
                        <View style={styles.workoutCardTag}><MaterialIcons name="whatshot" size={12} color="#ff9500" /><Text style={styles.workoutCardTagText}>{workout.calories} kcal</Text></View>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.tutorialBtn} onPress={() => Linking.openURL(workout.videoUrl)}>
                    <MaterialIcons name="play-arrow" size={16} color="#fff" />
                    <Text style={styles.tutorialBtnText}>Watch Tutorial</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={styles.instructionsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Feather name="message-circle" size={20} color="#ff3c20" />
                <Text style={styles.instructionsTitle}>Coach Instructions</Text>
              </View>
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsText}>
                  Focus on controlled movements today. Keep your core engaged throughout each exercise. Rest 60-90 seconds between sets. If you feel any sharp pain, stop immediately and contact me.
                </Text>
              </View>
            </View>
            <View style={styles.supplementCard}>
              <Text style={styles.supplementTitle}>💊 Supplement Plan</Text>
              {supplementPlan && supplementPlan.length > 0 ? (
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supplementSectionTitle}>Pre-Workout</Text>
                    {supplementPlan[0].pre.map((item) => (
                      <Text key={item.label} style={styles.supplementItem}>{item.label} <Text style={styles.supplementNote}>({item.note})</Text></Text>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supplementSectionTitle}>Post-Workout</Text>
                    {supplementPlan[0].post.map((item) => (
                      <Text key={item.label} style={styles.supplementItem}>{item.label} <Text style={styles.supplementNote}>({item.note})</Text></Text>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.supplementEmpty}>No supplement plan recommended yet.</Text>
              )}
            </View>
            <View style={styles.hydrationCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.hydrationTitle}>💧 Hydration Goal</Text>
                  <Text style={styles.hydrationSubtitle}>During workout</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                    <Text style={styles.hydrationValue}>500</Text>
                    <Text style={styles.hydrationUnit}>ml</Text>
                  </View>
                </View>
                <View style={styles.hydrationIconWrap}>
                  <MaterialIcons name="opacity" size={28} color="#007aff" />
                </View>
              </View>
              <View style={styles.hydrationTipBox}>
                <Text style={styles.hydrationTip}>💡 Add electrolytes if workout exceeds 60 minutes</Text>
              </View>
            </View>
          </>
        )}
        {/* AI Plan */}
        {selectedPlan === 'ai' && (
          <View style={styles.aiPlanCard}>
            <View style={styles.aiPlanIconWrap}>
              <Feather name="cpu" size={32} color="#8b5cf6" />
            </View>
            <Text style={styles.aiPlanTitle}>Generate Your Workout Plan</Text>
            
            {/* Powered by Google Gemini */}
            <View style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>⚡ Powered by </Text>
              <Text style={styles.poweredByBrand}>Google Gemini AI</Text>
            </View>
            
            {/* Educational Disclaimer */}
            <View style={styles.disclaimerCard}>
              <View style={styles.disclaimerHeader}>
                <Feather name="info" size={16} color="#8b5cf6" />
                <Text style={styles.disclaimerTitle}>Educational Purpose Only</Text>
              </View>
              <Text style={styles.disclaimerText}>
                This AI-generated workout plan is for educational and informational purposes only. For personalized guidance and expected results, please consult a qualified Health Coach or fitness professional.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.aiGenBtnLarge} 
              onPress={() => setShowPreferencesModal(true)}
            >
              <Feather name="zap" size={20} color="#fff" />
              <Text style={styles.aiGenBtnLargeText}>Generate AI Plan</Text>
            </TouchableOpacity>
            
            {!hasCoachSubscription && (
              <View style={styles.aiPlanCoachBox}>
                <Text style={styles.aiPlanCoachText}>💡 Want expert guidance? Subscribe to a coach for personalized plans and real-time support!</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Render Modals */}
      {renderPreferencesModal()}
      {renderGeneratedPlanModal()}

      <FooterNav />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 110 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  planSelectionRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  planSelectionStack: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 0,
  },
  planCardActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#8b5cf6',
    borderWidth: 2,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  planCardIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  planCardTitle: { fontSize: 16, fontWeight: '700', color: '#1d1d1f', marginBottom: 2 },
  planCardSubtitle: { fontSize: 13, color: '#6e6e73' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
  planCardTagsRow: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  planCardTag: { backgroundColor: 'rgba(139,92,246,0.1)', color: '#1d1d1f', fontSize: 12, fontWeight: '500', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  aiGenBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'linear-gradient(135deg, #ff3c20, #ff5722)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  aiGenBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  calorieGoalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,60,32,0.08)', borderRadius: 20, padding: 18, marginBottom: 18 },
  calorieGoalLabel: { fontSize: 13, color: '#6e6e73', fontWeight: '500', marginBottom: 4 },
  calorieGoalValue: { fontSize: 36, fontWeight: '700', color: '#ff3c20' },
  calorieGoalUnit: { fontSize: 16, color: '#6e6e73', fontWeight: '600', marginBottom: 2 },
  calorieGoalIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  workoutDayCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 16, padding: 14, marginBottom: 16 },
  workoutDayIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'linear-gradient(135deg, #ff3c20, #ff5722)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  workoutDayTitle: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  workoutDaySubtitle: { fontSize: 12, color: '#6e6e73' },
  workoutCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 16, marginBottom: 14 },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  workoutCardNum: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  workoutCardNumText: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  workoutCardTitle: { fontSize: 15, fontWeight: '600', color: '#1d1d1f', marginBottom: 2 },
  workoutCardTagsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  workoutCardTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  workoutCardTagText: { fontSize: 12, color: '#6e6e73', marginLeft: 2 },
  tutorialBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff3c20', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 8, gap: 6 },
  tutorialBtnText: { color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 4 },
  instructionsCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 16, marginBottom: 16 },
  instructionsTitle: { fontSize: 15, fontWeight: '700', color: '#1d1d1f', marginLeft: 8 },
  instructionsBox: { backgroundColor: 'rgba(255,60,32,0.05)', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#ff3c20' },
  instructionsText: { fontSize: 13, color: '#1d1d1f', lineHeight: 20 },
  supplementCard: { backgroundColor: 'rgba(52,199,89,0.08)', borderRadius: 20, padding: 16, marginBottom: 16 },
  supplementTitle: { fontSize: 15, fontWeight: '700', color: '#34c759', marginBottom: 8 },
  supplementSectionTitle: { fontSize: 13, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
  supplementItem: { fontSize: 12, color: '#6e6e73', marginBottom: 2 },
  supplementNote: { color: '#34c759' },
  supplementEmpty: { color: '#6e6e73', fontSize: 12 },
  hydrationCard: { backgroundColor: 'rgba(0,122,255,0.08)', borderRadius: 20, padding: 16, marginBottom: 16 },
  hydrationTitle: { fontSize: 15, fontWeight: '700', color: '#007aff' },
  hydrationSubtitle: { fontSize: 12, color: '#6e6e73', marginBottom: 4 },
  hydrationValue: { fontSize: 28, fontWeight: '700', color: '#007aff' },
  hydrationUnit: { fontSize: 14, color: '#6e6e73', fontWeight: '600', marginBottom: 2 },
  hydrationIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  hydrationTipBox: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: 8 },
  hydrationTip: { fontSize: 12, color: '#6e6e73' },
  aiPlanCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  aiPlanIconWrap: { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  aiPlanTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  aiPlanDesc: { fontSize: 14, color: '#6e6e73', marginBottom: 18, textAlign: 'center' },
  aiGenBtnLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff3c20', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, gap: 8, marginBottom: 12 },
  aiGenBtnLargeText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 6 },
  aiPlanCoachBox: { marginTop: 18, backgroundColor: 'rgba(255,149,0,0.1)', borderRadius: 12, padding: 12 },
  aiPlanCoachText: { fontSize: 13, color: '#6e6e73', textAlign: 'center' },
});

// Modal styles for preferences
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6e6e73',
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
  },
  healthValue: {
    fontSize: 14,
    color: '#1d1d1f',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1d1d1f',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    minHeight: 80,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  chipActive: {
    backgroundColor: '#ff3c20',
    borderColor: '#ff3c20',
  },
  chipText: {
    fontSize: 13,
    color: '#1d1d1f',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#ff3c20',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondaryText: {
    color: '#1d1d1f',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Modal styles for generated plan
const planModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6e6e73',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1d1d1f',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginTop: 16,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  dayHeader: {
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  dayStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  phaseSection: {
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 6,
  },
  phaseText: {
    fontSize: 13,
    color: '#6e6e73',
    lineHeight: 18,
  },
  exerciseCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '500',
  },
  exerciseTips: {
    fontSize: 12,
    color: '#8b5cf6',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exerciseCalories: {
    fontSize: 12,
    color: '#ff3c20',
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    color: '#007aff',
    marginRight: 8,
    fontWeight: '700',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#ff3c20',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondaryText: {
    color: '#1d1d1f',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#6e6e73',
    fontSize: 15,
    fontWeight: '600',
  },
  // Powered by Google Gemini
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  poweredByText: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
  },
  poweredByBrand: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '700',
  },
  // Educational Disclaimer Card
  disclaimerCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#6e6e73',
    lineHeight: 18,
    fontWeight: '500',
  },
  // AI Mode Toggle Styles (keeping for potential future use)
  aiModeToggleContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.12)',
  },
  aiModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiModeToggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  aiModeToggleSubtext: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '500',
  },
  aiModeToggleButton: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  aiModeToggleButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  aiModeToggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  aiModeToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  aiModeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.12)',
  },
  aiModeNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default PlanNative;
