import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabaseClient';
import FooterNav from '../components/FooterNav';

// Validation constants
const VALIDATION_RULES = {
  steps: { min: 1000, max: 20000, step: 500 },
  running: { min: 1, max: 20, step: 1 },
  sports: { min: 15, max: 180, step: 15 },
  workout: { min: 15, max: 180, step: 15 },
  milestone: { maxLength: 200 },
};

const CURRENT_YEAR = new Date().getFullYear();
const FUTURE_YEAR_RANGE = 10;
const MILESTONE_YEAR_MAX = CURRENT_YEAR + FUTURE_YEAR_RANGE;

const MONTH_OPTIONS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const YEAR_OPTIONS = Array.from({ length: FUTURE_YEAR_RANGE + 1 }, (_, idx) => {
  const year = (CURRENT_YEAR + idx).toString();
  return { label: year, value: year };
});

const normalizeMonthValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';
  const numeric = Math.min(12, Math.max(1, parseInt(digitsOnly, 10)));
  return numeric.toString().padStart(2, '0');
};

const normalizeYearValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.slice(0, 4);
};

const getMonthLabelFromValue = (value: string): string | undefined => {
  if (!value) return undefined;
  const normalized = normalizeMonthValue(value);
  return MONTH_OPTIONS.find((opt) => opt.value === normalized)?.label;
};

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
  const [activePicker, setActivePicker] = useState<'month' | 'year' | null>(null);

  // State: Loading & Errors
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<SaveError | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Accessibility announcements
  const announce = (msg: string) => AccessibilityInfo.announceForAccessibility?.(msg);

  // App state listener for offline sync
  const appStateRef = useRef(AppState.currentState);
  const lastSaveTimeRef = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const successBannerRef = useRef<View>(null);
  const headerRef = useRef<View>(null);

  // ============= INITIALIZATION & DATA FETCHING =============

  // Load from local cache if DB fetch fails
  const loadFromLocalCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('user_targets_cache');
      if (cached) {
        const data = JSON.parse(cached);
        setSteps(data.steps ?? 8000);
        setRunning(data.running ?? 5);
        setSports(data.sports ?? 60);
        setWorkout(data.workout ?? 60);
        setMilestone(data.milestone ?? '');
        setMilestoneMonth(normalizeMonthValue(data.milestone_month));
        setMilestoneYear(normalizeYearValue(data.milestone_year));
        announce('Loaded cached targets. Online sync pending.');
      }
    } catch (e) {
      console.error('[MyTargets] Cache load error:', e);
    }
  }, []);

  // Fetch existing targets from Supabase
  const fetchUserTargets = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_targets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSteps(data.steps ?? 8000);
        setRunning(data.running ?? 5);
        setSports(data.sports ?? 60);
        setWorkout(data.workout ?? 60);
        setMilestone(data.milestone ?? '');
        setMilestoneMonth(normalizeMonthValue(data.milestone_month));
        setMilestoneYear(normalizeYearValue(data.milestone_year));
      }

      setHasUnsavedChanges(false);
    } catch (e: any) {
      console.error('[MyTargets] Fetch error:', e.message);
      // Optionally load from AsyncStorage as fallback
      await loadFromLocalCache();
    }
  }, [loadFromLocalCache]);

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
  }, [fetchUserTargets]);

  // Listen for app state changes (offline sync)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-scroll to top when success message appears
  useEffect(() => {
    if (successMessage) {
      console.log('✨ Success message state changed, queuing scroll');
      
      // Use multiple timing attempts to ensure scroll works across platforms
      const timers = [
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 1 (immediate)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 0),
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 2 (50ms)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 50),
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 3 (100ms)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 100),
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [successMessage]);

  // Auto-scroll to top when error message appears
  useEffect(() => {
    if (error) {
      console.log('⚠️ Error state changed, queuing scroll');
      
      // Use multiple timing attempts to ensure scroll works across platforms
      const timers = [
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 1 (immediate)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 0),
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 2 (50ms)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 50),
        setTimeout(() => {
          if (scrollViewRef.current) {
            console.log('🎯 Scroll attempt 3 (100ms)');
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        }, 100),
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [error]);

  const handleAppStateChange = async (nextAppState: any) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      if (userId && hasUnsavedChanges) {
        const pending = await AsyncStorage.getItem('pending_targets_save');
        if (pending) {
          announce('Syncing targets with server...');
          // Note: handleSaveDailyTargets will be available when called
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
    let monthNumber: number | null = null;
    let yearNumber: number | null = null;

    if (!milestone.trim()) {
      errors.push('Milestone description is required');
    } else if (milestone.length > VALIDATION_RULES.milestone.maxLength) {
      errors.push(`Milestone must be under ${VALIDATION_RULES.milestone.maxLength} characters`);
    }

    if (!milestoneMonth || isNaN(parseInt(milestoneMonth, 10))) {
      errors.push('Please select a valid month (1-12)');
    } else {
      monthNumber = parseInt(normalizeMonthValue(milestoneMonth), 10);
      if (monthNumber < 1 || monthNumber > 12) {
        errors.push('Month must be between 1 and 12');
      }
    }

    if (!milestoneYear || isNaN(parseInt(milestoneYear, 10))) {
      errors.push('Please enter a valid year');
    } else {
      yearNumber = parseInt(milestoneYear, 10);
      if (yearNumber < CURRENT_YEAR || yearNumber > MILESTONE_YEAR_MAX) {
        errors.push(`Year must be between ${CURRENT_YEAR} and ${MILESTONE_YEAR_MAX}`);
      }
    }

    if (monthNumber !== null && yearNumber !== null) {
      const now = new Date();
      const selectedDate = new Date(yearNumber, monthNumber - 1, 1);
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      if (selectedDate < currentMonthStart) {
        errors.push('Milestone date must be in the current or a future month.');
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

    // Conflict errors (409) - usually UNIQUE constraint violation
    if (e?.status === 409 || message.includes('duplicate') || message.includes('Conflict')) {
      return {
        type: 'validation',
        message: 'Targets already exist. Updating with new values...',
        retryable: true,
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
    console.log('🔴 handleSaveDailyTargets called');
    
    // Rate limiting
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) {
      console.log('⏱️ Rate limited - ignoring save call');
      return; // Ignore if called within 1 second
    }
    lastSaveTimeRef.current = now;

    // Validation
    const validation = validateTargets();
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      Alert.alert('Invalid Input', validation.errors.join('\n'));
      announce(`Validation error: ${validation.errors.join('. ')}`);
      return;
    }

    console.log('✅ Validation passed');
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

      // Save to Supabase with onConflict to handle existing records (fixes 409 Conflict error)
      console.log('📤 Saving targets:', { userId, targets });
      const { error: saveError, data } = await supabase
        .from('user_targets')
        .upsert(targets, { onConflict: 'user_id' });

      console.log('📥 Save response:', { saveError, data });
      
      if (saveError) {
        console.error('❌ Supabase error:', {
          message: saveError.message,
          status: (saveError as any).status,
          code: (saveError as any).code,
          details: (saveError as any).details,
          hint: (saveError as any).hint,
        });
        throw saveError;
      }

      console.log('✅ Save request successful (no error thrown)');

      // Cache locally on success
      await AsyncStorage.setItem('user_targets_cache', JSON.stringify(targets));
      console.log('✅ Cached targets to AsyncStorage');
      await AsyncStorage.removeItem('pending_targets_save');
      console.log('✅ Removed pending targets');

      // Show success message immediately (don't wait for refetch)
        const msg = 'Your targets are saved successfully and we wish you all the best in meeting your targets.';
        setHasUnsavedChanges(false);
        console.log('✅ Set hasUnsavedChanges to false');
        
        announce(msg);
        console.log('✅ Announced success message');
        
        setSuccessMessage(msg);
        console.log('✅ Set success message state');
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          console.log('✅ Auto-dismissed success message');
        }, 3000);
      // Refetch targets to confirm persistence (non-blocking)
      try {
        await fetchUserTargets(userId);
        console.log('✅ Refetched targets from server');
      } catch (refetchErr: any) {
        console.warn('⚠️ Failed to refetch targets after save, but save succeeded:', refetchErr.message);
      }
    } catch (e: any) {
      console.error('💥 Error caught in handleSaveDailyTargets:', {
        errorObject: e,
        status: e?.status,
        message: e?.message,
        details: e?.details,
        code: e?.code,
        hint: e?.hint,
        fullError: JSON.stringify(e),
      });

      const parsedError = parseError(e);
      setError(parsedError);

      // Cache for offline retry
      const targetsTmp = { steps, running, sports, workout, milestone, milestoneMonth, milestoneYear };
      await AsyncStorage.setItem('pending_targets_save', JSON.stringify(targetsTmp));
      console.error('❌ Failed to save. Cached for offline retry:', targetsTmp);

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

  const handlePickerSelection = (type: 'month' | 'year', value: string) => {
    if (type === 'month') {
      const normalized = normalizeMonthValue(value);
      setMilestoneMonth(normalized);
      announce(`Target month set to ${getMonthLabelFromValue(normalized) ?? normalized}`);
    } else {
      setMilestoneYear(value);
      announce(`Target year set to ${value}`);
    }
    setHasUnsavedChanges(true);
    Haptics.selectionAsync().catch(() => undefined);
    setActivePicker(null);
  };

  const renderPickerModal = (type: 'month' | 'year') => {
    const isVisible = activePicker === type;
    const options = type === 'month' ? MONTH_OPTIONS : YEAR_OPTIONS;
    const selectedValue = type === 'month' ? normalizeMonthValue(milestoneMonth) : milestoneYear;
    const title = type === 'month' ? 'Select Target Month' : 'Select Target Year';

    if (!isVisible) {
      return null;
    }

    return (
      <View style={styles.modalPortal} pointerEvents="box-none">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActivePicker(null)}
          accessibilityRole="button"
          accessibilityLabel="Close picker"
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation?.()}
            accessibilityViewIsModal
          >
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.modalList}
              contentContainerStyle={{ paddingVertical: 4 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => handlePickerSelection(type, item.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.label}`}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                      {item.label}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={18} color="#ff3c20" />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActivePicker(null)}
              accessibilityRole="button"
              accessibilityLabel="Close picker"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </View>
    );
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

  const monthDisplayLabel = getMonthLabelFromValue(milestoneMonth);
  const yearDisplayLabel = milestoneYear || '';

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header} ref={headerRef}>
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

        {/* Success Banner */}
        {successMessage && (
          <View
            ref={successBannerRef}
            style={styles.successBanner}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#34c759"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        )}

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
                  accessibilityRole="none"
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
                  accessibilityRole="none"
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
                  accessibilityRole="none"
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
                  accessibilityRole="none"
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
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setActivePicker('month')}
                accessibilityRole="button"
                accessibilityLabel="Choose target month"
                accessibilityHint="Opens month picker"
              >
                <Text
                  style={[styles.selectValue, !monthDisplayLabel && styles.selectPlaceholder]}
                  numberOfLines={1}
                >
                  {monthDisplayLabel ?? 'Select month'}
                </Text>
                <MaterialIcons name="expand-more" size={22} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.label}
                accessible
                accessibilityLabel="Target milestone year label"
              >
                Target Year
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setActivePicker('year')}
                accessibilityRole="button"
                accessibilityLabel="Choose target year"
                accessibilityHint={`Select a year between ${CURRENT_YEAR} and ${MILESTONE_YEAR_MAX}`}
              >
                <Text
                  style={[styles.selectValue, !yearDisplayLabel && styles.selectPlaceholder]}
                  numberOfLines={1}
                >
                  {yearDisplayLabel || 'Select year'}
                </Text>
                <MaterialIcons name="expand-more" size={22} color="#6e6e73" />
              </TouchableOpacity>
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
      {renderPickerModal('month')}
      {renderPickerModal('year')}
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
  selectInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    color: '#1d1d1f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontSize: 16, color: '#1d1d1f', fontWeight: '500', flex: 1, marginRight: 8 },
  selectPlaceholder: { color: '#9a9a9a', fontWeight: '400' },
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
  successBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderLeftWidth: 4,
    borderColor: '#34c759',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  successBannerText: {
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
  modalPortal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  modalList: { width: '100%', maxHeight: 280 },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f6f6f8',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionActive: {
    backgroundColor: 'rgba(255,60,32,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,60,32,0.35)',
  },
  modalOptionText: { fontSize: 16, color: '#1d1d1f', fontWeight: '500' },
  modalOptionTextActive: { color: '#ff3c20' },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#ff3c20',
  },
  modalCloseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default MyTargetsNative;
