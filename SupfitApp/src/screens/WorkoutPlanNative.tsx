import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface WorkoutDay {
  day: string;
  exercises: string[];
}

interface WorkoutPlanProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      clientId?: number;
    };
  };
}

const defaultWorkoutPlan: WorkoutDay[] = [
  {
    day: 'Monday: Chest + Triceps',
    exercises: [
      'Bench Press (Barbell) → 4×10 (Strength)',
      'Incline Dumbbell Press → 3×12 (Hypertrophy)',
      'Chest Fly (Machine) → 3×15 (Isolation)',
      'Tricep Dips → 3×12 (Bodyweight)',
      'Rope Pushdown → 3×15 (Isolation)',
      'Stability: Push-ups on Stability Ball → 3×12',
    ],
  },
  {
    day: 'Tuesday: Back + Biceps',
    exercises: [
      'Pull-Ups → 4×8 (Strength)',
      'Barbell Row → 4×10 (Compound)',
      'Lat Pulldown → 3×12 (Machine)',
      'Barbell Curl → 3×12 (Hypertrophy)',
      'Hammer Curl → 3×15 (Isolation)',
      'Stability: Single-Arm Dumbbell Row → 3×12',
    ],
  },
  {
    day: 'Wednesday: Legs + Core',
    exercises: [
      'Squats (Barbell) → 4×10 (Strength)',
      'Lunges (Dumbbell) → 3×12 each leg',
      'Leg Press → 3×15 (Machine)',
      'Plank Hold → 3×60s (Core stability)',
      'Russian Twists → 3×20 (Core rotation)',
      'Stability: Single-Leg Romanian Deadlift → 3×12',
    ],
  },
  {
    day: 'Thursday: Shoulders + Abs',
    exercises: [
      'Overhead Press → 4×10 (Strength)',
      'Lateral Raises → 3×15 (Isolation)',
      'Front Raises → 3×12 (Variant)',
      'Hanging Leg Raises → 3×12 (Core strength)',
      'Bicycle Crunches → 3×20 (Core endurance)',
      'Stability: Dumbbell Shoulder Press on Ball → 3×12',
    ],
  },
  {
    day: 'Friday: Chest + Back Mix',
    exercises: [
      'Incline Bench Press → 4×10 (Chest strength)',
      'Weighted Push-Ups → 3×15 (Chest endurance)',
      'Deadlift → 4×8 (Back strength)',
      'Seated Row (Cable) → 3×12 (Back hypertrophy)',
      'Stability: TRX Chest Press → 3×12',
    ],
  },
  {
    day: 'Saturday: Legs + Glutes',
    exercises: [
      'Romanian Deadlift → 4×10 (Hamstring/glute)',
      'Hip Thrusts → 3×12 (Glute hypertrophy)',
      'Leg Curl (Machine) → 3×15 (Isolation)',
      'Calf Raises → 3×20 (Endurance)',
      'Stability: Lateral Band Walks → 3×15',
    ],
  },
  {
    day: 'Sunday: Rest / Recovery',
    exercises: [
      'Active Recovery: Yoga, stretching, foam rolling',
      'Stability Focus: Balance drills',
      'Optional: 20-min walk or mobility flow',
    ],
  },
];

const WorkoutPlanNative = ({ navigation, route }: WorkoutPlanProps) => {
  const clientId = route?.params?.clientId || 1;
  const [plan, setPlan] = useState<WorkoutDay[]>(defaultWorkoutPlan);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editExercises, setEditExercises] = useState<string[]>([]);
  const [isRecommended, setIsRecommended] = useState(false);

  const loadWorkoutPlan = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(`workoutPlan_${clientId}`);
      const recommended = await AsyncStorage.getItem(`workoutPlan_recommended_${clientId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPlan(parsed);
      }
      if (recommended === 'true') {
        setIsRecommended(true);
      }
    } catch (error) {
      console.error('Error loading workout plan:', error);
    }
  }, [clientId]);

  useEffect(() => {
    loadWorkoutPlan();
  }, [loadWorkoutPlan]);

  const handleEdit = (dayIndex: number) => {
    setEditingDayIndex(dayIndex);
    setEditExercises([...plan[dayIndex].exercises]);
  };

  const handleSave = async (dayIndex: number) => {
    const updatedPlan = plan.map((day, i) =>
      i === dayIndex ? { ...day, exercises: editExercises } : day
    );
    setPlan(updatedPlan);
    setEditingDayIndex(null);
    
    try {
      await AsyncStorage.setItem(`workoutPlan_${clientId}`, JSON.stringify(updatedPlan));
    } catch (error) {
      console.error('Error saving workout plan:', error);
    }
  };

  const handleRecommend = async () => {
    try {
      await AsyncStorage.setItem(`workoutPlan_${clientId}`, JSON.stringify(plan));
      await AsyncStorage.setItem(`workoutPlan_recommended_${clientId}`, 'true');
      setIsRecommended(true);
      navigation.goBack();
    } catch (error) {
      console.error('Error recommending workout plan:', error);
    }
  };

  const updateExercise = (index: number, value: string) => {
    const updated = [...editExercises];
    updated[index] = value;
    setEditExercises(updated);
  };

  const getDayIcon = (day: string): string => {
    if (day.includes('Chest')) return '💪';
    if (day.includes('Back')) return '🏋️';
    if (day.includes('Legs')) return '🦵';
    if (day.includes('Shoulders')) return '💪';
    if (day.includes('Rest')) return '🧘';
    return '🏃';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fff7f5', '#f5f5f7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Workout Plan</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {plan.map((day, dayIndex) => {
            const isEditing = editingDayIndex === dayIndex;
            const exercises = isEditing ? editExercises : day.exercises;

            return (
              <View key={day.day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <LinearGradient
                    colors={['#ff3c20', '#ffb347']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dayHeaderGradient}
                  />
                </View>

                <View style={styles.dayContent}>
                  <View style={styles.dayTitleRow}>
                    <Text style={styles.dayIcon}>{getDayIcon(day.day)}</Text>
                    <Text style={styles.dayTitle}>{day.day}</Text>
                  </View>

                  <View style={styles.exercisesList}>
                    {exercises.map((exercise, exerciseIndex) => (
                      <View key={`exercise-${dayIndex}-${exerciseIndex}`} style={styles.exerciseItem}>
                        <Text style={styles.exerciseBullet}>•</Text>
                        {isEditing ? (
                          <TextInput
                            style={styles.exerciseInput}
                            value={exercise}
                            onChangeText={(text) => updateExercise(exerciseIndex, text)}
                            multiline
                          />
                        ) : (
                          <Text style={styles.exerciseText}>{exercise}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {isEditing ? (
                      <TouchableOpacity
                        onPress={() => handleSave(dayIndex)}
                        style={styles.saveButton}
                      >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={handleRecommend}
                          style={[styles.recommendButton, isRecommended && styles.recommendedButton]}
                        >
                          <LinearGradient
                            colors={isRecommended ? ['#e0f7e0', '#e0f7e0'] : ['#ff3c20', '#ffb347']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                          >
                            <Text
                              style={[
                                styles.recommendButtonText,
                                isRecommended && styles.recommendedButtonText,
                              ]}
                            >
                              {isRecommended ? 'Selected' : 'Recommend'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleEdit(dayIndex)}
                          style={styles.modifyButton}
                        >
                          <Text style={styles.modifyButtonText}>Modify</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#ff3c20',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    flex: 1,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayHeader: {
    height: 8,
  },
  dayHeaderGradient: {
    flex: 1,
  },
  dayContent: {
    padding: 20,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff3c20',
    flex: 1,
    letterSpacing: -0.3,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseBullet: {
    fontSize: 16,
    color: '#ff3c20',
    marginRight: 8,
    marginTop: 2,
  },
  exerciseText: {
    flex: 1,
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 22,
  },
  exerciseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    minHeight: 44,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  recommendButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  recommendedButton: {
    borderWidth: 2,
    borderColor: '#34c759',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  recommendedButtonText: {
    color: '#34c759',
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff3c20',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ff3c20',
    letterSpacing: -0.2,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ff3c20',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});

export default WorkoutPlanNative;
