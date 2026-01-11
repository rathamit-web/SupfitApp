import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, AccessibilityInfo } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabaseClient';
import FooterNav from '../components/FooterNav';

// Removed unused months and years arrays

const MyTargetsNative = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [steps, setSteps] = useState(8000);
  const [running, setRunning] = useState(5);
  const [sports, setSports] = useState(60);
  const [workout, setWorkout] = useState(60);
  // For accessibility: announce value changes
  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility?.(msg);
  const [milestone, setMilestone] = useState('');
  const [milestoneMonth, setMilestoneMonth] = useState('');
  const [milestoneYear, setMilestoneYear] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally fetch existing targets from Supabase here
    (async () => {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) return;
      const { data } = await supabase
        .from('user_targets')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (data) {
        setSteps(data.steps || 8000);
        setRunning(data.running || 5);
        setSports(data.sports || 60);
        setWorkout(data.workout || 60);
        setMilestone(data.milestone || '');
        setMilestoneMonth(data.milestoneMonth || '');
        setMilestoneYear(data.milestoneYear || '');
      }
    })();
  }, []);

  const handleSaveDailyTargets = async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) throw new Error('User not logged in');
      await supabase.from('user_targets').upsert({
        user_id,
        steps,
        running,
        sports,
        workout,
        milestone,
        milestoneMonth,
        milestoneYear,
      });
      Alert.alert('Success', 'Targets saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save targets');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMilestone = async () => {
    if (!milestone || !milestoneMonth || !milestoneYear) {
      Alert.alert('Missing fields', 'Please fill in all milestone fields');
      return;
    }
    await handleSaveDailyTargets();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={28} color="#ff3c20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Targets</Text>
          <Text style={styles.headerSubtitle}>Set your daily fitness goals</Text>
        </View>

        {/* Daily Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Targets</Text>
          {/* Steps */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel} accessibilityLabel="Steps slider label">Steps</Text>
              {/* Removed color circle here */}
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible accessibilityLabel="Decrease steps"
                  style={styles.incBtn}
                  onPress={() => { setSteps(s => Math.max(1000, s - 500)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Steps ${steps - 500}`); }}
                >
                  <Text style={styles.incBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={steps.toString()}
                  onChangeText={v => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = 1000;
                    setSteps(Math.max(1000, Math.min(20000, val)));
                  }}
                  accessibilityLabel="Steps value input"
                  accessible
                />
                <TouchableOpacity
                  accessible accessibilityLabel="Increase steps"
                  style={styles.incBtn}
                  onPress={() => { setSteps(s => Math.min(20000, s + 500)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Steps ${steps + 500}`); }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sliderRow}>
              <Slider
                minimumValue={1000}
                maximumValue={20000}
                step={500}
                value={steps}
                onValueChange={v => { setSteps(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Steps ${v}`); }}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
                style={{ height: 0 }}
                accessibilityLabel="Steps slider"
                accessible
              />
            </View>
          </View>
          {/* Running */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel} accessibilityLabel="Running slider label">Running (km)</Text>
              {/* Removed color circle here */}
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible accessibilityLabel="Decrease running"
                  style={styles.incBtn}
                  onPress={() => { setRunning(r => Math.max(1, r - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Running ${running - 1}`); }}
                >
                  <Text style={styles.incBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={running.toString()}
                  onChangeText={v => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = 1;
                    setRunning(Math.max(1, Math.min(20, val)));
                  }}
                  accessibilityLabel="Running value input"
                  accessible
                />
                <TouchableOpacity
                  accessible accessibilityLabel="Increase running"
                  style={styles.incBtn}
                  onPress={() => { setRunning(r => Math.min(20, r + 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Running ${running + 1}`); }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sliderRow}>
              <Slider
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={running}
                onValueChange={v => { setRunning(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Running ${v}`); }}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
                style={{ height: 0 }}
                accessibilityLabel="Running slider"
                accessible
              />
            </View>
          </View>
          {/* Sports */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel} accessibilityLabel="Sports slider label">Sports (min)</Text>
              {/* Removed color circle here */}
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible accessibilityLabel="Decrease sports"
                  style={styles.incBtn}
                  onPress={() => { setSports(s => Math.max(15, s - 15)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Sports ${sports - 15}`); }}
                >
                  <Text style={styles.incBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={sports.toString()}
                  onChangeText={v => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = 15;
                    setSports(Math.max(15, Math.min(180, val)));
                  }}
                  accessibilityLabel="Sports value input"
                  accessible
                />
                <TouchableOpacity
                  accessible accessibilityLabel="Increase sports"
                  style={styles.incBtn}
                  onPress={() => { setSports(s => Math.min(180, s + 15)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Sports ${sports + 15}`); }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sliderRow}>
              <Slider
                minimumValue={15}
                maximumValue={180}
                step={15}
                value={sports}
                onValueChange={v => { setSports(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Sports ${v}`); }}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
                style={{ height: 0 }}
                accessibilityLabel="Sports slider"
                accessible
              />
            </View>
          </View>
          {/* Workout */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel} accessibilityLabel="Workout slider label">Workout (min)</Text>
              {/* Removed color circle here */}
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible accessibilityLabel="Decrease workout"
                  style={styles.incBtn}
                  onPress={() => { setWorkout(w => Math.max(15, w - 15)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Workout ${workout - 15}`); }}
                >
                  <Text style={styles.incBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={workout.toString()}
                  onChangeText={v => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = 15;
                    setWorkout(Math.max(15, Math.min(180, val)));
                  }}
                  accessibilityLabel="Workout value input"
                  accessible
                />
                <TouchableOpacity
                  accessible accessibilityLabel="Increase workout"
                  style={styles.incBtn}
                  onPress={() => { setWorkout(w => Math.min(180, w + 15)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Workout ${workout + 15}`); }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sliderRow}>
              <Slider
                minimumValue={15}
                maximumValue={180}
                step={15}
                value={workout}
                onValueChange={v => { setWorkout(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); announce(`Workout ${v}`); }}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
                style={{ height: 0 }}
                accessibilityLabel="Workout slider"
                accessible
              />
            </View>
          </View>
          <TouchableOpacity style={styles.saveBtnUnified} onPress={handleSaveDailyTargets} disabled={loading} accessibilityRole="button" accessibilityLabel="Save">
            <Text style={styles.saveBtnUnifiedText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Milestone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Milestone Target</Text>
          <TextInput
            style={styles.input}
            value={milestone}
            onChangeText={setMilestone}
            placeholder="e.g., Run a marathon, Complete triathlon"
            placeholderTextColor="#aaa"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Target Month</Text>
              <TextInput
                style={styles.input}
                value={milestoneMonth}
                onChangeText={setMilestoneMonth}
                placeholder="Month"
                placeholderTextColor="#aaa"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Target Year</Text>
              <TextInput
                style={styles.input}
                value={milestoneYear}
                onChangeText={setMilestoneYear}
                placeholder="Year"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.saveBtnUnified} onPress={handleSaveMilestone} disabled={loading} accessibilityRole="button" accessibilityLabel="Save">
            <Text style={styles.saveBtnUnifiedText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FooterNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 110, paddingTop: 0 },
  header: { padding: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderBottomWidth: 0.5, borderColor: '#e5e5ea' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ff3c20', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: '#6e6e73', marginTop: 2 },
  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  sliderBlock: { marginBottom: 32 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  minMaxLabel: { fontSize: 13, color: '#6e6e73', width: 40, textAlign: 'center' },
  // Removed color circle styles if any
  valueInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueInput: { width: 60, height: 36, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 16, color: '#1d1d1f', backgroundColor: '#fff', marginHorizontal: 4 },
  incBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  incBtnText: { fontSize: 22, color: '#ff3c20', fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1d1d1f', marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  targetLabel: { fontSize: 15, color: '#1d1d1f' },
  targetValue: { fontSize: 18, fontWeight: '700', color: '#ff3c20' },
  saveBtnUnified: {
    backgroundColor: '#ff3c20', // Supfit logo color
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 100,
  },
  saveBtnUnifiedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 12, color: '#1d1d1f' },
  label: { fontSize: 14, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
});

export default MyTargetsNative;
