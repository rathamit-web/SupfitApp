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

interface SupplementItem {
  icon: string;
  value: string;
}

interface SupplementPlan {
  title: string;
  emoji: string;
  preIcon: string;
  postIcon: string;
  pre: SupplementItem[];
  post: SupplementItem[];
}

interface SupplementRecommendationProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      clientId?: number;
    };
  };
}

const plans: SupplementPlan[] = [
  {
    title: 'Strength & Muscle Gain',
    emoji: '⚡',
    preIcon: 'local-cafe',
    postIcon: 'local-drink',
    pre: [
      { icon: '', value: 'Caffeine (200mg) – 30 min before' },
      { icon: '', value: 'Beta‑Alanine (3g) – 20 min before' },
    ],
    post: [
      { icon: '', value: 'Whey Protein (30g) + Creatine (5g) – within 30 min' },
      { icon: '', value: 'Glutamine (5g) – recovery' },
    ],
  },
  {
    title: 'Endurance & Stamina',
    emoji: '🏃',
    preIcon: 'opacity',
    postIcon: 'eco',
    pre: [
      { icon: '', value: 'Electrolyte Mix – 20 min before' },
      { icon: '', value: 'BCAA (5g) – reduce fatigue' },
    ],
    post: [
      { icon: '', value: 'Plant Protein (25g) – within 30 min' },
      { icon: '', value: 'Omega‑3 (1g) – inflammation control' },
    ],
  },
  {
    title: 'Lean & Fat Loss',
    emoji: '💪',
    preIcon: 'local-florist',
    postIcon: 'local-drink',
    pre: [
      { icon: '', value: 'Green Tea Extract (250mg) – 30 min before' },
      { icon: '', value: 'L‑Carnitine (1g) – fat metabolism' },
    ],
    post: [
      { icon: '', value: 'Whey Isolate (25g) – within 30 min' },
      { icon: '', value: 'CLA (1g) – lean muscle retention' },
    ],
  },
  {
    title: 'Recovery & Wellness',
    emoji: '🧘',
    preIcon: 'self-improvement',
    postIcon: 'spa',
    pre: [
      { icon: '', value: 'Hydration Mix – 20 min before' },
      { icon: '', value: 'Magnesium (200mg) – muscle relaxation' },
    ],
    post: [
      { icon: '', value: 'Casein Protein (25g) – slow release recovery' },
      { icon: '', value: 'Vitamin C (500mg) – immune support' },
    ],
  },
];

const SupplementRecommendationNative = ({ navigation, route }: SupplementRecommendationProps) => {
  const clientId = route?.params?.clientId || 1;
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [editedPlans, setEditedPlans] = useState<SupplementPlan[]>(plans);

  const loadRecommendation = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(`supplementPlan_${clientId}`);
      if (stored) {
        const plan = JSON.parse(stored);
        if (plan?.title) {
          setRecommendedPlan(plan.title);
        }
      }
    } catch (error) {
      console.error('Error loading supplement recommendation:', error);
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
        `supplementPlan_${clientId}`,
        JSON.stringify({ title: plan.title, pre: plan.pre, post: plan.post })
      );
    } catch (error) {
      console.error('Error saving supplement recommendation:', error);
    }
  };

  const toggleEdit = (index: number) => {
    if (editingPlanIndex === index) {
      setEditingPlanIndex(null);
    } else {
      setEditingPlanIndex(index);
    }
  };

  const updateSupplementValue = (planIndex: number, type: 'pre' | 'post', itemIndex: number, newValue: string) => {
    setEditedPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = {
        ...updated[planIndex],
        [type]: updated[planIndex][type].map((item, idx) =>
          idx === itemIndex ? { ...item, value: newValue } : item
        ),
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
          <Text style={styles.headerTitle}>Supplement Recommendations</Text>
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
                    <Text style={styles.planEmoji}>{plan.emoji}</Text>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#34c759" />
                        <Text style={styles.recommendedText}>Selected</Text>
                      </View>
                    )}
                  </View>

                  {/* Pre-Workout */}
                  <View style={styles.supplementSection}>
                    <Text style={styles.sectionTitle}>Pre‑Workout</Text>
                    {plan.pre.map((item, itemIndex) => (
                      <View key={`pre-${planIndex}-${itemIndex}`} style={styles.supplementItem}>
                        {isEditing ? (
                          <TextInput
                            style={styles.supplementInput}
                            value={item.value}
                            onChangeText={(text) => updateSupplementValue(planIndex, 'pre', itemIndex, text)}
                            multiline
                          />
                        ) : (
                          <Text style={styles.supplementText}>{item.value}</Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Post-Workout */}
                  <View style={styles.supplementSection}>
                    <Text style={styles.sectionTitle}>Post‑Workout</Text>
                    {plan.post.map((item, itemIndex) => (
                      <View key={`post-${planIndex}-${itemIndex}`} style={styles.supplementItem}>
                        {isEditing ? (
                          <TextInput
                            style={styles.supplementInput}
                            value={item.value}
                            onChangeText={(text) => updateSupplementValue(planIndex, 'post', itemIndex, text)}
                            multiline
                          />
                        ) : (
                          <Text style={styles.supplementText}>{item.value}</Text>
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
                        <Text style={[styles.recommendButtonText, isRecommended && styles.recommendedButtonText]}>
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
    marginBottom: 16,
  },
  planEmoji: {
    fontSize: 28,
    marginRight: 8,
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
  supplementSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  supplementItem: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  supplementText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 22,
    fontWeight: '400',
  },
  supplementInput: {
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
    marginTop: 8,
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

export default SupplementRecommendationNative;
