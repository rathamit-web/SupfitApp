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

interface MealItem {
  icon: string;
  text: string;
}

interface DietPlan {
  title: string;
  target: string;
  micronutrients: string;
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
  };
}

interface DietPlanProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      clientId?: number;
    };
  };
}

const dietPlans: DietPlan[] = [
  {
    title: 'Strength & Muscle Gain',
    target: '~130g protein, ~120g carbs/day',
    micronutrients: 'Iron, B12, Calcium, Magnesium',
    meals: {
      breakfast: [
        { icon: '', text: '3 Egg Whites + 1 Whole Egg → 20g P, 2g C' },
        { icon: '', text: 'Multigrain Toast → 6g P, 30g C' },
        { icon: '', text: '(Veg) Paneer Bhurji + Chapati → 24g P, 40g C' },
      ],
      lunch: [
        { icon: '', text: 'Fish Curry + Brown Rice → 35g P, 40g C' },
        { icon: '', text: '(Veg) Dal + Quinoa → 20g P, 40g C' },
      ],
      dinner: [
        { icon: '', text: 'Grilled Chicken + Sweet Potato → 38g P, 35g C' },
        { icon: '', text: '(Veg) Tofu Stir Fry + Brown Rice → 25g P, 40g C' },
      ],
    },
  },
  {
    title: 'Endurance & Stamina',
    target: '~110g protein, ~150g carbs/day',
    micronutrients: 'Iron, Omega-3, B12, Zinc',
    meals: {
      breakfast: [
        { icon: '', text: 'Oats + Boiled Eggs → 18g P, 40g C' },
        { icon: '', text: '(Veg) Idli + Sambar → 20g P, 35g C' },
      ],
      lunch: [
        { icon: '', text: 'Chicken Curry + Chapati → 36g P, 40g C' },
        { icon: '', text: '(Veg) Rajma + Rice → 20g P, 35g C' },
      ],
      dinner: [
        { icon: '', text: 'Grilled Fish + Vegetables → 35g P, 15g C' },
        { icon: '', text: '(Veg) Vegetable Khichdi → 12g P, 35g C' },
      ],
    },
  },
  {
    title: 'Lean & Fat Loss',
    target: '~120g protein, ~90g carbs/day',
    micronutrients: 'Vitamin D, Calcium, Fiber',
    meals: {
      breakfast: [
        { icon: '', text: 'Egg White Omelet + Salad → 18g P, 5g C' },
        { icon: '', text: '(Veg) Vegetable Dalia → 12g P, 30g C' },
      ],
      lunch: [
        { icon: '', text: 'Fish Curry + Salad → 33g P, 10g C' },
        { icon: '', text: '(Veg) Paneer Curry + Veggies → 23g P, 15g C' },
      ],
      dinner: [
        { icon: '', text: 'Chicken Breast + Greens → 35g P, 10g C' },
        { icon: '', text: '(Veg) Tofu + Broccoli → 25g P, 15g C' },
      ],
    },
  },
  {
    title: 'Recovery & Wellness',
    target: '~115g protein, ~110g carbs/day',
    micronutrients: 'Vitamin C, Magnesium, Iron, B12',
    meals: {
      breakfast: [
        { icon: '', text: 'Oats + Egg Whites → 18g P, 40g C' },
        { icon: '', text: '(Veg) Vegetable Upma → 15g P, 30g C' },
      ],
      lunch: [
        { icon: '', text: 'Chicken Curry + Quinoa → 38g P, 40g C' },
        { icon: '', text: '(Veg) Paneer Curry + Chapati → 24g P, 40g C' },
      ],
      dinner: [
        { icon: '', text: 'Fish Curry + Salad → 33g P, 10g C' },
        { icon: '', text: '(Veg) Vegetable Khichdi → 12g P, 35g C' },
      ],
    },
  },
];

const DietPlanNative = ({ navigation, route }: DietPlanProps) => {
  const clientId = route?.params?.clientId || 1;
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [editedPlans, setEditedPlans] = useState<DietPlan[]>(
    structuredClone(dietPlans)
  );

  const loadRecommendation = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(`dietPlan_${clientId}`);
      if (stored) {
        const plan = JSON.parse(stored);
        if (plan?.title) {
          setRecommendedPlan(plan.title);
          if (plan.meals) {
            setEditedPlans(prev =>
              prev.map(p => (p.title === plan.title ? { ...p, meals: plan.meals } : p))
            );
          }
        }
      }
    } catch (error) {
      console.error('Error loading diet plan:', error);
    }
  }, [clientId]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  const handleRecommend = async (planIndex: number) => {
    const plan = editedPlans[planIndex];
    setRecommendedPlan(plan.title);
    try {
      await AsyncStorage.setItem(
        `dietPlan_${clientId}`,
        JSON.stringify({ title: plan.title, meals: plan.meals, date: new Date().toISOString() })
      );
    } catch (error) {
      console.error('Error saving diet plan:', error);
    }
  };

  const toggleEdit = (index: number) => {
    if (editingPlanIndex === index) {
      setEditingPlanIndex(null);
    } else {
      setEditingPlanIndex(index);
    }
  };

  const updateMealItem = (
    planIndex: number,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    itemIndex: number,
    newValue: string
  ) => {
    setEditedPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = {
        ...updated[planIndex],
        meals: {
          ...updated[planIndex].meals,
          [mealType]: updated[planIndex].meals[mealType].map((item, idx) =>
            idx === itemIndex ? { ...item, text: newValue } : item
          ),
        },
      };
      return updated;
    });
  };

  const getGradientColors = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#ff3c20', '#ffb347'],
      ['#60a5fa', '#22d3ee'],
      ['#a78bfa', '#c084fc'],
      ['#34d399', '#10b981'],
    ];
    return gradients[index % gradients.length];
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
          <Text style={styles.headerTitle}>Unified Diet Plan</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {editedPlans.map((plan, planIndex) => {
            const isEditing = editingPlanIndex === planIndex;
            const isRecommended = recommendedPlan === plan.title;
            const gradientColors = getGradientColors(planIndex);

            return (
              <View key={plan.title} style={styles.planCard}>
                <View style={[styles.planHeader, isRecommended && styles.planHeaderRecommended]}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planHeaderGradient}
                  />
                </View>

                <View style={styles.planContent}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#34c759" />
                        <Text style={styles.recommendedText}>Selected</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.targetSection}>
                    <Text style={styles.targetLabel}>Target:</Text>
                    <Text style={styles.targetText}>{plan.target}</Text>
                  </View>

                  <View style={styles.targetSection}>
                    <Text style={styles.targetLabel}>Micronutrients:</Text>
                    <Text style={styles.targetText}>{plan.micronutrients}</Text>
                  </View>

                  {/* Breakfast */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTitle}>🌅 Breakfast</Text>
                    {plan.meals.breakfast.map((item, itemIndex) => (
                      <View key={`breakfast-${planIndex}-${itemIndex}`} style={styles.mealItem}>
                        {isEditing ? (
                          <TextInput
                            style={styles.mealInput}
                            value={item.text}
                            onChangeText={(text) =>
                              updateMealItem(planIndex, 'breakfast', itemIndex, text)
                            }
                            multiline
                          />
                        ) : (
                          <Text style={styles.mealText}>{item.text}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Lunch */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTitle}>🌞 Lunch</Text>
                    {plan.meals.lunch.map((item, itemIndex) => (
                      <View key={`lunch-${planIndex}-${itemIndex}`} style={styles.mealItem}>
                        {isEditing ? (
                          <TextInput
                            style={styles.mealInput}
                            value={item.text}
                            onChangeText={(text) =>
                              updateMealItem(planIndex, 'lunch', itemIndex, text)
                            }
                            multiline
                          />
                        ) : (
                          <Text style={styles.mealText}>{item.text}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Dinner */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTitle}>🌙 Dinner</Text>
                    {plan.meals.dinner.map((item, itemIndex) => (
                      <View key={`dinner-${planIndex}-${itemIndex}`} style={styles.mealItem}>
                        {isEditing ? (
                          <TextInput
                            style={styles.mealInput}
                            value={item.text}
                            onChangeText={(text) =>
                              updateMealItem(planIndex, 'dinner', itemIndex, text)
                            }
                            multiline
                          />
                        ) : (
                          <Text style={styles.mealText}>{item.text}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleRecommend(planIndex)}
                      style={[styles.recommendButton, isRecommended && styles.recommendedButton]}
                    >
                      <LinearGradient
                        colors={isRecommended ? ['#e0f7e0', '#e0f7e0'] : gradientColors}
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
                      onPress={() => toggleEdit(planIndex)}
                      style={styles.modifyButton}
                    >
                      <Text style={styles.modifyButtonText}>
                        {isEditing ? 'Save' : 'Modify'}
                      </Text>
                    </TouchableOpacity>
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
  planCard: {
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
  planHeader: {
    height: 8,
  },
  planHeaderRecommended: {
    height: 10,
  },
  planHeaderGradient: {
    flex: 1,
  },
  planContent: {
    padding: 20,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    flex: 1,
    letterSpacing: -0.3,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34c759',
  },
  targetSection: {
    marginBottom: 10,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 4,
  },
  targetText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 22,
  },
  mealSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  mealItem: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  mealText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 22,
    fontWeight: '400',
  },
  mealInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    minHeight: 44,
    lineHeight: 22,
    fontWeight: '400',
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
});

export default DietPlanNative;
