import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabaseClient';
import FooterNav from '../components/FooterNav';

// Debounce utility for rate limiting
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Validation constants
const VALIDATION_RULES = {
  steps: { min: 1000, max: 20000, step: 500 },
  running: { min: 1, max: 20, step: 1 },
  sports: { min: 15, max: 180, step: 15 },
  workout: { min: 15, max: 180, step: 15 },
  milestone: { maxLength: 200 },
};

const CURRENT_YEAR = new Date().getFullYear();
const MILESTONE_YEAR_MAX = CURRENT_YEAR + 5;

interface SaveError {
  type: 'network' | 'auth' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
}

const MyTargetsNative = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // State: Targets
  const [steps, setSteps] = useState(8000);
  const [running, setRunning] = useState(5);
  const [sports, setSports] = useState(60);
  const [workout, setWorkout] = useState(60);
  const [milestone, setMilestone] = useState('');
  const [milestoneMonth, setMilestoneMonth] = useState('');
  const [milestoneYear, setMilestoneYear] = useState('');

  // State: Loading & Errors
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<SaveError | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Accessibility announcements
  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility?.(msg);

  // App state listener for offline sync
  const appStateRef = useRef(AppState.currentState);
  const lastSaveTimeRef = useRef<number>(0);

  // ============= INITIALIZATION & DATA FETCHING =============

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        setUserId(user.id);
        await fetchUserTargets(user.id);
      } catch (e: any) {
        console.error('[MyTargets] Init error:', e.message);
        Alert.alert('Error', 'Failed to load your targets. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Fetch existing targets from Supabase
  const fetchUserTargets = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_targets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (OK for new users)
        throw fetchError;
      }

      if (data) {
        setSteps(data.steps ?? 8000);
        setRunning(data.running ?? 5);
        setSports(data.sports ?? 60);
        setWorkout(data.workout ?? 60);
        setMilestone(data.milestone ?? '');
        setMilestoneMonth(data.milestone_month ?? '');
        setMilestoneYear(data.milestone_year ?? '');
      }

      setHasUnsavedChanges(false);
    } catch (e: any) {
      console.error('[MyTargets] Fetch error:', e.message);
      // Optionally load from AsyncStorage as fallback
      await loadFromLocalCache();
    }
  };

  // Load from local cache if DB fetch fails
  const loadFromLocalCache = async () => {
    try {
      const cached = await AsyncStorage.getItem('user_targets_cache');
      if (cached) {
        const data = JSON.parse(cached);
        setSteps(data.steps ?? 8000);
        setRunning(data.running ?? 5);
        setSports(data.sports ?? 60);
        setWorkout(data.workout ?? 60);
        setMilestone(data.milestone ?? '');
        setMilestoneMonth(data.milestone_month ?? '');
        setMilestoneYear(data.milestone_year ?? '');
        announce('Loaded cached targets. Online sync pending.');
      }
    } catch (e) {
      console.error('[MyTargets] Cache load error:', e);
    }
  };

  // Listen for app state changes (offline sync)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [userId]);

  const handleAppStateChange = async (nextAppState: any) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      if (userId && hasUnsavedChanges) {
        const pending = await AsyncStorage.getItem('pending_targets_save');
        if (pending) {
          announce('Syncing targets with server...');
          await handleSaveDailyTargets();
        }
      }
    }
    appStateRef.current = nextAppState;
  };

  // ============= VALIDATION =============

  const validateTargets = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (steps < VALIDATION_RULES.steps.min || steps > VALIDATION_RULES.steps.max) {
      errors.push(`Steps must be between ${VALIDATION_RULES.steps.min} and ${VALIDATION_RULES.steps.max}`);
    }

    if (running < VALIDATION_RULES.running.min || running > VALIDATION_RULES.running.max) {
      errors.push(`Running distance must be between ${VALIDATION_RULES.running.min} and ${VALIDATION_RULES.running.max} km`);
    }

    if (sports < VALIDATION_RULES.sports.min || sports > VALIDATION_RULES.sports.max) {
      errors.push(`Sports time must be between ${VALIDATION_RULES.sports.min} and ${VALIDATION_RULES.sports.max} minutes`);
    }

    if (workout < VALIDATION_RULES.workout.min || workout > VALIDATION_RULES.workout.max) {
      errors.push(`Workout time must be between ${VALIDATION_RULES.workout.min} and ${VALIDATION_RULES.workout.max} minutes`);
    }

    return { valid: errors.length === 0, errors };
  };

  const validateMilestone = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!milestone.trim()) {
      errors.push('Milestone description is required');
    } else if (milestone.length > VALIDATION_RULES.milestone.maxLength) {
      errors.push(`Milestone must be under ${VALIDATION_RULES.milestone.maxLength} characters`);
    }

    if (!milestoneMonth || isNaN(parseInt(milestoneMonth))) {
      errors.push('Please select a valid month (1-12)');
    } else {
      const month = parseInt(milestoneMonth);
      if (month < 1 || month > 12) {
        errors.push('Month must be between 1 and 12');
      }
    }

    if (!milestoneYear || isNaN(parseInt(milestoneYear))) {
      errors.push('Please enter a valid year');
    } else {
      const year = parseInt(milestoneYear);
      if (year < CURRENT_YEAR || year > MILESTONE_YEAR_MAX) {
        errors.push(`Year must be between ${CURRENT_YEAR} and ${MILESTONE_YEAR_MAX}`);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // ============= SAVE OPERATIONS =============

  const parseError = (e: any): SaveError => {
    const message = e?.message || String(e);

    // Network errors
    if (message.includes('network') || message.includes('ECONNREFUSED') || message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Connection error. Please check your internet and try again.',
        retryable: true,
      };
    }

    // Auth errors
    if (e?.status === 401 || message.includes('auth') || message.includes('unauthorized')) {
      return {
        type: 'auth',
        message: 'Your session expired. Please log in again.',
        retryable: false,
      };
    }

    // Validation errors
    if (e?.status === 400 || message.includes('CHECK constraint')) {
      return {
        type: 'validation',
        message: 'Invalid target values. Please check your input.',
        retryable: false,
      };
    }

    // Default
    return {
      type: 'unknown',
      message: 'Failed to save targets. Please try again.',
      retryable: true,
    };
  };

  const handleSaveDailyTargets = async () => {
    // Rate limiting
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) {
      return; // Ignore if called within 1 second
    }
    lastSaveTimeRef.current = now;

    // Validation
    const validation = validateTargets();
    if (!validation.valid) {
      Alert.alert('Invalid Input', validation.errors.join('\n'));
      announce(`Validation error: ${validation.errors.join('. ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!userId) throw new Error('User not authenticated');

      const targets = {
        user_id: userId,
        steps,
        running,
        sports,
        workout,
        milestone,
        milestone_month: milestoneMonth,
        milestone_year: milestoneYear,
      };

      // Save to Supabase
      const { error: saveError } = await supabase.from('user_targets').upsert(targets);

      if (saveError) throw saveError;

      // Cache locally on success
      await AsyncStorage.setItem('user_targets_cache', JSON.stringify(targets));
      await AsyncStorage.removeItem('pending_targets_save');

      setHasUnsavedChanges(false);
      announce('Targets saved successfully');
      Alert.alert('Success', 'Your targets have been saved!');
    } catch (e: any) {
      const parsedError = parseError(e);
      setError(parsedError);

      // Cache for offline retry
      const targets = { steps, running, sports, workout, milestone, milestoneMonth, milestoneYear };
      await AsyncStorage.setItem('pending_targets_save', JSON.stringify(targets));

      if (parsedError.type === 'auth') {
        Alert.alert('Session Expired', parsedError.message, [
          { text: 'Log In', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }) },
        ]);
      } else if (parsedError.retryable) {
        Alert.alert('Unable to Save', parsedError.message, [
          { text: 'Retry', onPress: handleSaveDailyTargets },
          { text: 'Save Locally', onPress: () => announce('Changes saved locally. Will sync when online.') },
        ]);
      } else {
        Alert.alert('Error', parsedError.message);
      }

      announce(`Error: ${parsedError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMilestone = async () => {
    const validation = validateMilestone();
    if (!validation.valid) {
      Alert.alert('Invalid Milestone', validation.errors.join('\n'));
      announce(`Validation error: ${validation.errors.join('. ')}`);
      return;
    }

    // Mark as having changes
    setHasUnsavedChanges(true);
    await handleSaveDailyTargets();
  };

  // ============= UI RENDERING =============

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff3c20" />
        <Text style={{ marginTop: 12, color: '#6e6e73', fontSize: 14 }}>Loading your targets...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={28} color="#ff3c20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Targets</Text>
          <Text style={styles.headerSubtitle}>Set your daily fitness goals</Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              error.type === 'network'
                ? { backgroundColor: '#fff7f5', borderColor: '#ff3c20' }
                : { backgroundColor: '#f5f5f7', borderColor: '#d1d1d6' },
            ]}
            accessible
            accessibilityLiveRegion="polite"
          >
            <MaterialIcons
              name={error.type === 'network' ? 'cloud-off' : 'error'}
              size={20}
              color={error.type === 'network' ? '#ff3c20' : '#6e6e73'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.errorBannerText}>{error.message}</Text>
            {error.retryable && (
              <TouchableOpacity
                onPress={handleSaveDailyTargets}
                style={styles.retryButton}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Retry saving"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Daily Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Targets</Text>

          {/* Steps */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text
                style={styles.targetLabel}
                accessible
                accessibilityLabel="Steps daily target label"
              >
                Steps
              </Text>
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Decrease steps by 500"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.max(VALIDATION_RULES.steps.min, steps - VALIDATION_RULES.steps.step);
                    setSteps(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Steps ${newVal}`);
                  }}
                >
                  <Text style={styles.incBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={steps.toString()}
                  onChangeText={(v) => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = VALIDATION_RULES.steps.min;
                    const bounded = Math.max(
                      VALIDATION_RULES.steps.min,
                      Math.min(VALIDATION_RULES.steps.max, val)
                    );
                    setSteps(bounded);
                    setHasUnsavedChanges(true);
                  }}
                  accessible
                  accessibilityRole="keyboardKey"
                  accessibilityLabel="Steps value input"
                  accessibilityHint="Enter a number between 1000 and 20000"
                />
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Increase steps by 500"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.min(VALIDATION_RULES.steps.max, steps + VALIDATION_RULES.steps.step);
                    setSteps(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Steps ${newVal}`);
                  }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Running */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text
                style={styles.targetLabel}
                accessible
                accessibilityLabel="Running daily target label (kilometers)"
              >
                Running (km)
              </Text>
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Decrease running by 1 kilometer"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.max(VALIDATION_RULES.running.min, running - VALIDATION_RULES.running.step);
                    setRunning(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Running ${newVal} kilometers`);
                  }}
                >
                  <Text style={styles.incBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={running.toString()}
                  onChangeText={(v) => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = VALIDATION_RULES.running.min;
                    const bounded = Math.max(
                      VALIDATION_RULES.running.min,
                      Math.min(VALIDATION_RULES.running.max, val)
                    );
                    setRunning(bounded);
                    setHasUnsavedChanges(true);
                  }}
                  accessible
                  accessibilityRole="keyboardKey"
                  accessibilityLabel="Running value input"
                  accessibilityHint="Enter a number between 1 and 20 kilometers"
                />
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Increase running by 1 kilometer"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.min(VALIDATION_RULES.running.max, running + VALIDATION_RULES.running.step);
                    setRunning(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Running ${newVal} kilometers`);
                  }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sports */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text
                style={styles.targetLabel}
                accessible
                accessibilityLabel="Sports daily target label (minutes)"
              >
                Sports (min)
              </Text>
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Decrease sports by 15 minutes"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.max(VALIDATION_RULES.sports.min, sports - VALIDATION_RULES.sports.step);
                    setSports(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Sports ${newVal} minutes`);
                  }}
                >
                  <Text style={styles.incBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={sports.toString()}
                  onChangeText={(v) => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = VALIDATION_RULES.sports.min;
                    const bounded = Math.max(
                      VALIDATION_RULES.sports.min,
                      Math.min(VALIDATION_RULES.sports.max, val)
                    );
                    setSports(bounded);
                    setHasUnsavedChanges(true);
                  }}
                  accessible
                  accessibilityRole="keyboardKey"
                  accessibilityLabel="Sports value input"
                  accessibilityHint="Enter a number between 15 and 180 minutes"
                />
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Increase sports by 15 minutes"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.min(VALIDATION_RULES.sports.max, sports + VALIDATION_RULES.sports.step);
                    setSports(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Sports ${newVal} minutes`);
                  }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Workout */}
          <View style={styles.sliderBlock}>
            <View style={styles.targetRow}>
              <Text
                style={styles.targetLabel}
                accessible
                accessibilityLabel="Workout daily target label (minutes)"
              >
                Workout (min)
              </Text>
              <View style={styles.valueInputRow}>
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Decrease workout by 15 minutes"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.max(VALIDATION_RULES.workout.min, workout - VALIDATION_RULES.workout.step);
                    setWorkout(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Workout ${newVal} minutes`);
                  }}
                >
                  <Text style={styles.incBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="numeric"
                  value={workout.toString()}
                  onChangeText={(v) => {
                    let val = parseInt(v.replace(/\D/g, ''), 10);
                    if (isNaN(val)) val = VALIDATION_RULES.workout.min;
                    const bounded = Math.max(
                      VALIDATION_RULES.workout.min,
                      Math.min(VALIDATION_RULES.workout.max, val)
                    );
                    setWorkout(bounded);
                    setHasUnsavedChanges(true);
                  }}
                  accessible
                  accessibilityRole="keyboardKey"
                  accessibilityLabel="Workout value input"
                  accessibilityHint="Enter a number between 15 and 180 minutes"
                />
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Increase workout by 15 minutes"
                  style={styles.incBtn}
                  onPress={() => {
                    const newVal = Math.min(VALIDATION_RULES.workout.max, workout + VALIDATION_RULES.workout.step);
                    setWorkout(newVal);
                    setHasUnsavedChanges(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    announce(`Workout ${newVal} minutes`);
                  }}
                >
                  <Text style={styles.incBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtnUnified, loading && styles.saveBtnDisabled]}
            onPress={handleSaveDailyTargets}
            disabled={loading}
            accessible
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Saving targets' : 'Save daily targets'}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveBtnUnifiedText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnUnifiedText}>Save Daily Targets</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Milestone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Milestone Target</Text>

          <TextInput
            style={styles.input}
            value={milestone}
            onChangeText={(text) => {
              setMilestone(text.slice(0, VALIDATION_RULES.milestone.maxLength));
              setHasUnsavedChanges(true);
            }}
            placeholder="e.g., Run a marathon, Complete triathlon"
            placeholderTextColor="#aaa"
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Milestone target description"
            accessibilityHint={`Enter your milestone goal. ${milestone.length}/${VALIDATION_RULES.milestone.maxLength} characters used.`}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={styles.label}
                accessible
                accessibilityLabel="Target milestone month label"
              >
                Target Month
              </Text>
              <TextInput
                style={styles.input}
                value={milestoneMonth}
                onChangeText={(v) => {
                  const cleaned = v.replace(/\D/g, '').slice(0, 2);
                  setMilestoneMonth(cleaned);
                  setHasUnsavedChanges(true);
                }}
                placeholder="1-12"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                maxLength={2}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Target milestone month input"
                accessibilityHint="Enter month as number 1-12"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.label}
                accessible
                accessibilityLabel="Target milestone year label"
              >
                Target Year
              </Text>
              <TextInput
                style={styles.input}
                value={milestoneYear}
                onChangeText={(v) => {
                  const cleaned = v.replace(/\D/g, '').slice(0, 4);
                  setMilestoneYear(cleaned);
                  setHasUnsavedChanges(true);
                }}
                placeholder={CURRENT_YEAR.toString()}
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                maxLength={4}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Target milestone year input"
                accessibilityHint={`Enter year between ${CURRENT_YEAR} and ${MILESTONE_YEAR_MAX}`}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtnUnified, loading && styles.saveBtnDisabled]}
            onPress={handleSaveMilestone}
            disabled={loading}
            accessible
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Saving milestone' : 'Save milestone target'}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveBtnUnifiedText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnUnifiedText}>Save Milestone</Text>
            )}
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
  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', marginHorizontal: 16 },
  sliderBlock: { marginBottom: 32 },
  valueInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueInput: { width: 60, height: 36, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 16, color: '#1d1d1f', backgroundColor: '#fff', marginHorizontal: 4 },
  incBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  incBtnText: { fontSize: 22, color: '#ff3c20', fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1d1d1f', marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  targetLabel: { fontSize: 15, color: '#1d1d1f' },
  saveBtnUnified: {
    backgroundColor: '#ff3c20',
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
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnUnifiedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 12, color: '#1d1d1f' },
  label: { fontSize: 14, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 60, 32, 0.1)',
    borderLeftWidth: 4,
    borderColor: '#ff3c20',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1d1d1f',
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ff3c20',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default MyTargetsNative;
