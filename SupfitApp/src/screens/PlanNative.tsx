import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';

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
  useEffect(() => {
    setSelectedPlan(hasCoachSubscription ? 'coach' : 'ai');
  }, [hasCoachSubscription]);
  const totalCalories = coachWorkouts.reduce((sum, ex) => sum + ex.calories, 0);
  const isMobile = Dimensions.get('window').width < 600;

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
            <Text style={styles.aiPlanDesc}>
              Get a personalized AI-powered workout plan based on your fitness goals, experience level, and available equipment.
            </Text>
            <TouchableOpacity style={styles.aiGenBtnLarge} onPress={() => {}}>
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
      <View style={footerStyles.footerContainer}>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('IndividualHome')}
        >
          <MaterialIcons name="home-filled" size={28} color="#ff3c20" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('PlanNative')}
        >
          <MaterialIcons name="event" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('HealthDashboard')}
        >
          <MaterialIcons name="dashboard" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('UserSettingsNative')}
        >
          <MaterialIcons name="person" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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

export default PlanNative;
