import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, FlatList, LayoutAnimation, Platform, UIManager, Linking, Animated, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { auditEvent } from '../lib/audit';
import {
  ENABLE_PURPOSED_VITALS,
  DEFAULT_VITAL_PURPOSE,
  DEFAULT_CONSENT_VERSION,
  buildVitalPayload,
} from '../config/privacy';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import FooterNav from '../components/FooterNav';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// My Details section types
interface BodyComposition {
  bodyFatPercentage: string;
  muscleMass: string;
  muscleMassUnit: 'kg' | '%';
  weight: string;
  height: string;
}

interface MedicalHistory {
  chronicConditions: string[];
  allergies: string;
  injuries: string;
  medications: string;
}

interface MilestoneTargets {
  goalType: string;
  targetWeight: string;
  targetBodyFat: string;
  deadline: Date | null;
  progress: number;
}

interface WorkoutActivity {
  frequency: number;
  exerciseTypes: string[];
  preferredTime: string;
}

interface DietNutrition {
  dietaryPreferences: string[];
  currentPlan: string;
  supplements: string[];
}

interface AddressInfo {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
}

interface ConsentSettings {
  healthData: boolean;
  marketing: boolean;
  analytics: boolean;
}

interface RetentionSettings {
  legalHold: boolean;
  retentionMonths: number;
}

interface TwoFactorSettings {
  enabled: boolean;
  methods: {
    sms: boolean;
    authenticator: boolean;
    email: boolean;
  };
}

const DEFAULT_CONSENTS: ConsentSettings = {
  healthData: true,
  marketing: false,
  analytics: true,
};

const DEFAULT_RETENTION: RetentionSettings = {
  legalHold: false,
  retentionMonths: 24,
};

const DEFAULT_TWO_FACTOR: TwoFactorSettings = {
  enabled: false,
  methods: {
    sms: false,
    authenticator: false,
    email: true,
  },
};

const DEFAULT_ADDRESS: AddressInfo = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal: '',
  country: '',
};

// Chip options
const CHRONIC_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Arthritis', 'None'];
const GOAL_TYPES = ['Weight Loss', 'Muscle Gain', 'Maintain', 'Improve Endurance', 'Flexibility'];
const EXERCISE_TYPES = ['Cardio', 'Strength', 'HIIT', 'Yoga', 'Swimming', 'Cycling', 'Running', 'CrossFit'];
const DIETARY_PREFERENCES = ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'No Preference'];
const SUPPLEMENT_OPTIONS = ['Protein Powder', 'Creatine', 'BCAA', 'Multivitamin', 'Omega-3', 'Pre-workout', 'None'];

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, iconColor, iconBg, isExpanded, onToggle, children }) => {
  return (
    <View style={accordionStyles.container}>
      <TouchableOpacity style={accordionStyles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={accordionStyles.headerLeft}>
          <View style={[accordionStyles.iconWrap, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon} size={20} color={iconColor} />
          </View>
          <Text style={accordionStyles.title}>{title}</Text>
        </View>
        <MaterialIcons 
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
          size={24} 
          color="#6e6e73" 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={accordionStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

// Chip Component for multi-select
interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity 
    style={[chipStyles.chip, selected && chipStyles.chipSelected]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[chipStyles.chipText, selected && chipStyles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// Input Field Component
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  suffix?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, suffix }) => (
  <View style={inputStyles.container}>
    <Text style={inputStyles.label}>{label}</Text>
    <View style={inputStyles.inputRow}>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1a6"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {suffix && <Text style={inputStyles.suffix}>{suffix}</Text>}
    </View>
  </View>
);

// Progress Bar Component
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <View style={progressStyles.container}>
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
    </View>
    <Text style={progressStyles.text}>{progress}%</Text>
  </View>
);

const HEALTH_SOURCES = [
  {
    id: 'apple_health',
    title: 'Apple Health',
    description: 'Sync steps, calories, heart rate, and sleep from iPhone or Apple Watch.',
    platform: 'ios',
    badge: 'Recommended',
    permissionsLabel: 'Apple Health permissions',
    icon: 'favorite',
    iconColor: '#ff3c20',
    iconBg: 'rgba(255,60,32,0.15)',
  },
  {
    id: 'health_connect',
    title: 'Health Connect',
    description: 'Sync data from Wear OS and Android health apps in one place.',
    platform: 'android',
    badge: 'Recommended',
    permissionsLabel: 'Health Connect permissions',
    icon: 'health-and-safety',
    iconColor: '#34c759',
    iconBg: 'rgba(52,199,89,0.15)',
  },
];

const SOURCE_META_KEY = 'healthSourceMeta';

const COMPATIBLE_DEVICES = [
  { name: 'Apple Watch', platforms: ['ios'] },
  { name: 'Wear OS', platforms: ['android'] },
  { name: 'Fitbit', platforms: ['android', 'ios'] },
  { name: 'Garmin', platforms: ['android', 'ios'] },
  { name: 'Oura Ring', platforms: ['android', 'ios'] },
  { name: 'WHOOP', platforms: ['android', 'ios'] },
  { name: 'Samsung Health', platforms: ['android'] },
  { name: 'Polar', platforms: ['android', 'ios'] },
  { name: 'Suunto', platforms: ['android', 'ios'] },
  { name: 'Amazfit', platforms: ['android', 'ios'] },
];

const getPasswordStrength = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { label: 'Weak', color: '#ff3b30' };
  if (score === 2) return { label: 'Fair', color: '#ff9500' };
  if (score === 3) return { label: 'Good', color: '#34c759' };
  return { label: 'Strong', color: '#007aff' };
};

const SUPFIT_PRIMARY = '#ff3c20';

const LiquidToggle = ({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: true, friction: 9 }).start();
  }, [value, anim]);
  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  return (
    <Pressable
      onPress={() => {
        if (!disabled) onChange(!value);
      }}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        padding: 2,
        backgroundColor: value ? SUPFIT_PRIMARY : '#e5e7eb',
        borderWidth: value ? 0 : 1,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: value ? 0.18 : 0.08,
        shadowRadius: value ? 6 : 3,
        shadowOffset: { width: 0, height: value ? 2 : 1 },
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#fff',
          transform: [{ translateX: translate }, { scale }],
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
        }}
      />
    </Pressable>
  );
};

const UserSettingsNative = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);
  const [personalInfoY, setPersonalInfoY] = useState(0);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
    // const insets = useSafeAreaInsets();
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [sourceMeta, setSourceMeta] = useState<Record<string, string>>({});
  const [accountEmail, setAccountEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [address, setAddress] = useState<AddressInfo>(DEFAULT_ADDRESS);
  const [consents, setConsents] = useState<ConsentSettings>(DEFAULT_CONSENTS);
  const [retention, setRetention] = useState<RetentionSettings>(DEFAULT_RETENTION);
  const [twoFactor, setTwoFactor] = useState<TwoFactorSettings>(DEFAULT_TWO_FACTOR);
  const [lastSignInAt, setLastSignInAt] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPlacesModal, setShowPlacesModal] = useState(false);
  const [placesQuery, setPlacesQuery] = useState('');
  const [placesResults, setPlacesResults] = useState<Array<{ id: string; description: string; placeId: string }>>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [logoutAllDevices, setLogoutAllDevices] = useState(true);
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);

  useEffect(() => {
    // Auto-populate country to India on mount
    setAddress((prev) => (prev.country ? prev : { ...prev, country: 'India' }));
  }, []);

  useEffect(() => {
    (async () => {
      // Get user id
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) return;
      setAccountEmail(user?.data?.user?.email || '');
      setLastSignInAt(user?.data?.user?.last_sign_in_at || null);
      // Fetch settings from Supabase
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (data) {
        const devices = data.connected_devices || [];
        setConnectedDevices(devices);
        setIsProfilePublic(data.is_profile_public ?? true);
        setConsents({ ...DEFAULT_CONSENTS, ...(data.consents ? (data.consents as ConsentSettings) : {}) });
        setRetention({ ...DEFAULT_RETENTION, ...(data.retention ? (data.retention as RetentionSettings) : {}) });
        setTwoFactor({ ...DEFAULT_TWO_FACTOR, ...(data.two_factor ? (data.two_factor as TwoFactorSettings) : {}) });
        const addressData = { ...DEFAULT_ADDRESS, ...(data.address ? (data.address as AddressInfo) : {}) };
        // Ensure country defaults to India
        if (!addressData.country) {
          addressData.country = 'India';
        }
        setAddress(addressData);
        await AsyncStorage.setItem('connectedDevices', JSON.stringify(devices));
        await AsyncStorage.setItem('isProfilePublic', data.is_profile_public ? 'true' : 'false');
      } else {
        const cachedDevices = await AsyncStorage.getItem('connectedDevices');
        const cachedProfile = await AsyncStorage.getItem('isProfilePublic');
        const cachedMeta = await AsyncStorage.getItem(SOURCE_META_KEY);
        if (cachedDevices) setConnectedDevices(JSON.parse(cachedDevices));
        if (cachedProfile) setIsProfilePublic(cachedProfile === 'true');
        if (cachedMeta) setSourceMeta(JSON.parse(cachedMeta));
      }
    })();
  }, []);

  // Manual vital entry state
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [vitalType, setVitalType] = useState('');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalUnit, setVitalUnit] = useState('');
  const [vitalDate, setVitalDate] = useState('');

  // My Details - Accordion sections expanded state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    bodyComposition: false,
    medicalHistory: false,
    milestoneTargets: false,
    workoutActivity: false,
    dietNutrition: false,
  });

  // My Details - Form data
  const [bodyComposition, setBodyComposition] = useState<BodyComposition>({
    bodyFatPercentage: '',
    muscleMass: '',
    muscleMassUnit: 'kg',
    weight: '',
    height: '',
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    chronicConditions: [],
    allergies: '',
    injuries: '',
    medications: '',
  });

  const [milestoneTargets, setMilestoneTargets] = useState<MilestoneTargets>({
    goalType: '',
    targetWeight: '',
    targetBodyFat: '',
    deadline: null,
    progress: 0,
  });

  const [workoutActivity, setWorkoutActivity] = useState<WorkoutActivity>({
    frequency: 3,
    exerciseTypes: [],
    preferredTime: 'Morning',
  });

  const [dietNutrition, setDietNutrition] = useState<DietNutrition>({
    dietaryPreferences: [],
    currentPlan: '',
    supplements: [],
  });

  // Toggle accordion section
  const toggleSection = useCallback((section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Save My Details to Supabase
  const saveMyDetails = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) throw new Error('User not logged in');

      const { error } = await supabase.from('user_details').upsert({
        user_id,
        body_composition: bodyComposition,
        medical_history: medicalHistory,
        milestone_targets: milestoneTargets,
        workout_activity: workoutActivity,
        diet_nutrition: dietNutrition,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      alert('Details saved successfully!');
    } catch (e: any) {
      alert(`Save failed: ${e.message || 'Could not save details'}`);
    }
  }, [bodyComposition, medicalHistory, milestoneTargets, workoutActivity, dietNutrition]);

  // Load My Details from Supabase
  useEffect(() => {
    (async () => {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) return;

        const { data } = await supabase
          .from('user_details')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (data) {
          if (data.body_composition) setBodyComposition(data.body_composition);
          if (data.medical_history) setMedicalHistory(data.medical_history);
          if (data.milestone_targets) setMilestoneTargets(data.milestone_targets);
          if (data.workout_activity) setWorkoutActivity(data.workout_activity);
          if (data.diet_nutrition) setDietNutrition(data.diet_nutrition);
        }
      } catch {
        console.log('No existing user details found');
      }
    })();
  }, []);

  const openVitalModal = (type: string) => {
    setVitalType(type);
    setVitalValue('');
    let unit = '';
    if (type === 'Blood Sugar') unit = 'mg/dL';
    else if (type === 'Blood Pressure') unit = 'mmHg';
    setVitalUnit(unit);
    setVitalDate(new Date().toISOString().slice(0, 10));
    setShowVitalModal(true);
  };

  const handleSaveVital = async () => {
    if (!vitalValue || !vitalType) return;
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) throw new Error('User not logged in');
      const payload = buildVitalPayload({
        user_id,
        type: vitalType,
        value: vitalValue,
        unit: vitalUnit,
        date: vitalDate,
      });

      const { data, error } = await supabase.from('manual_vitals').insert(payload).select('id').single();
      if (error) throw error;

      await auditEvent({
        action: 'create',
        table: 'manual_vitals',
        recordId: data?.id,
        userId: user_id,
        purpose: ENABLE_PURPOSED_VITALS ? DEFAULT_VITAL_PURPOSE : undefined,
        metadata: ENABLE_PURPOSED_VITALS ? { consent_version: DEFAULT_CONSENT_VERSION } : undefined,
      });
      setShowVitalModal(false);
      setVitalValue('');
      setVitalType('');
      setVitalUnit('');
      setVitalDate('');
      alert('Vital saved!');
    } catch (e: any) {
      alert(`Save failed: ${e.message || 'Could not save vital'}`);
    }
  };

  const persistUserSettings = async (devices: string[], profilePublic = isProfilePublic) => {
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) return;
    await supabase.from('user_settings').upsert(
      {
        user_id,
        connected_devices: devices,
        is_profile_public: profilePublic,
      },
      { onConflict: 'user_id' },
    );
  };

  const persistAccountSettings = async (next?: {
    address?: AddressInfo;
    consents?: ConsentSettings;
    retention?: RetentionSettings;
    twoFactor?: TwoFactorSettings;
  }) => {
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) return;
    const payload = {
      user_id,
      address: next?.address ?? address,
      consents: next?.consents ?? consents,
      retention: next?.retention ?? retention,
      two_factor: next?.twoFactor ?? twoFactor,
    };
    await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      await auditEvent({
        action: 'update',
        table: 'user_settings',
        userId: (await supabase.auth.getUser()).data.user?.id,
        metadata: { field: 'email' },
      });
      alert('Verification link sent to your new email.');
      setNewEmail('');
    } catch (e: any) {
      alert(`Email update failed: ${e.message || 'Unable to update email'}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = accountEmail || (await supabase.auth.getUser()).data.user?.email;
    if (!email) {
      alert('No account email found. Please sign in again.');
      return;
    }
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: undefined });
    alert('Check your email for password reset instructions.');
  };

  const handleUpdatePassword = async () => {
    const email = accountEmail || (await supabase.auth.getUser()).data.user?.email;
    if (!email) {
      alert('No account email found. Please sign in again.');
      return;
    }
    if (!currentPassword.trim()) {
      alert('Enter your current password to continue.');
      return;
    }
    setPasswordLoading(true);
    try {
      // First validate current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (reauthError) {
        alert('Current password is incorrect. Try again or use Forgot password.');
        setPasswordLoading(false);
        return;
      }
      // Then validate new password
      if (!newPassword || newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        setPasswordLoading(false);
        return;
      }
      const hasMinLength = newPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
      const isStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;
      if (!isStrong) {
        const missing = [];
        if (!hasMinLength) missing.push('8+ characters');
        if (!hasUppercase) missing.push('uppercase letter');
        if (!hasLowercase) missing.push('lowercase letter');
        if (!hasNumber) missing.push('number');
        if (!hasSymbol) missing.push('symbol');
        alert(`New password must include: ${missing.join(', ')}.`);
        setPasswordLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'others' });
      await auditEvent({
        action: 'update',
        table: 'user_settings',
        userId: (await supabase.auth.getUser()).data.user?.id,
        metadata: { field: 'password' },
      });
      alert('Password updated successfully. We signed out other sessions for safety.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      alert(`Password update failed: ${e?.message || 'Unable to update password'}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLookupPostalCode = async (postalCode: string) => {
    if (!postalCode.trim() || !googleApiKey) {
      return;
    }
    setPostalLookupLoading(true);
    try {
      // Use Google Geocoding API to reverse-lookup postal code for India
      const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${encodeURIComponent(postalCode)}&region=in&key=${googleApiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.status === 'OK' && json.results?.length > 0) {
        const result = json.results[0];
        const components: any = {};
        
        // Parse address components from geocoding response
        result.address_components?.forEach((comp: any) => {
          const types = comp.types || [];
          if (types.includes('street_number') || types.includes('route')) {
            if (!components.line1) components.line1 = comp.long_name;
          }
          if (types.includes('locality')) {
            components.city = comp.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            components.state = comp.short_name;
          }
          if (types.includes('postal_code')) {
            components.postal = comp.long_name;
          }
        });
        
        // Update address with fetched data, preserving user edits
        setAddress((prev) => ({
          ...prev,
          line1: components.line1 || prev.line1,
          city: components.city || prev.city,
          state: components.state || prev.state,
          postal: components.postal || postalCode,
          country: 'India',
        }));
        alert('Address auto-filled from postal code. Please review and update as needed.');
      } else if (json.status === 'ZERO_RESULTS') {
        // Silently handle - user can continue with manual entry
      } else {
        console.warn('Geocoding status:', json.error_message);
      }
    } catch (e: any) {
      console.warn('Postal code lookup failed:', e?.message);
      // Silently fail - user can continue with manual entry
    } finally {
      setPostalLookupLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    await persistAccountSettings({ address });
    await auditEvent({
      action: 'update',
      table: 'user_settings',
      userId: (await supabase.auth.getUser()).data.user?.id,
      metadata: { field: 'address' },
    });
    alert('Address saved.');
  };

  const handleDetectLocation = async () => {
    try {
      const mod = await import('expo-location');
      const Location = mod;
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        alert('Location permission is required to autofill your address.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });
      const place = results[0];
      if (!place) {
        alert('Could not detect address. Please enter it manually.');
        return;
      }
      setAddress((prev) => ({
        ...prev,
        line1: place.name || place.street || prev.line1,
        city: place.city || prev.city,
        state: place.region || prev.state,
        postal: place.postalCode || prev.postal,
        country: place.country || prev.country,
      }));
      alert('Location detected. Please review and save.');
    } catch (e: any) {
      alert('Unable to detect location on this device. Please enter your address manually.');
    }
  };

  const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

  const handlePlacesSearch = async () => {
    if (!googleApiKey) {
      alert('Google Places API key is missing. Please configure EXPO_PUBLIC_GOOGLE_PLACES_API_KEY.');
      return;
    }
    if (!placesQuery.trim()) {
      setPlacesResults([]);
      return;
    }
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      // Use new Places API v1 for all platforms (no legacy AutocompleteService)
      const url = 'https://places.googleapis.com/v1/places:autocomplete';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
        },
        body: JSON.stringify({
          input: placesQuery.trim(),
          locationRestriction: {
            rectangle: {
              low: { latitude: -90, longitude: -180 },
              high: { latitude: 90, longitude: 180 },
            },
          },
        }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || 'Places API error');
      }
      if (!json.suggestions || json.suggestions.length === 0) {
        setPlacesResults([]);
        setPlacesError('No results found. Try a different search.');
        return;
      }
      const mapped = (json.suggestions || []).map((s: any) => ({
        id: s.placePrediction?.placeId || s.placeId,
        placeId: s.placePrediction?.placeId || s.placeId,
        description: s.mainText?.text || s.description || '',
      }));
      setPlacesResults(mapped);
    } catch (e: any) {
      setPlacesError(e?.message || 'Unable to fetch suggestions. Ensure Places API is enabled in Google Cloud.');
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleSelectPlace = async (placeId: string) => {
    if (!googleApiKey) {
      alert('Google Places API key is missing. Please configure EXPO_PUBLIC_GOOGLE_PLACES_API_KEY.');
      return;
    }
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      // Use new Places API v1 to fetch place details
      const url = `https://places.googleapis.com/v1/places/${placeId}?fields=addressComponent,formattedAddress`;
      const res = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': googleApiKey,
        },
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || 'Unable to fetch place details');
      }
      if (!json) {
        setPlacesError('No details found for this place. Try another search.');
        return;
      }
      // Parse address components from new API format
      const addressComponents = json.addressComponent || [];
      const mapped: any = {};
      addressComponents.forEach((comp: any) => {
        const types = comp.types || [];
        if (types.includes('street_number')) {
          mapped.line1 = (mapped.line1 || '') + comp.longText;
        }
        if (types.includes('route')) {
          mapped.line1 = (mapped.line1 || '') + ' ' + comp.longText;
        }
        if (types.includes('locality')) {
          mapped.city = comp.longText;
        }
        if (types.includes('administrative_area_level_1')) {
          mapped.state = comp.longText;
        }
        if (types.includes('postal_code')) {
          mapped.postal = comp.longText;
        }
        if (types.includes('country')) {
          mapped.country = comp.longText;
        }
      });
      setAddress((prev) => ({
        ...prev,
        line1: (mapped.line1 || '').trim() || prev.line1,
        city: mapped.city || prev.city,
        state: mapped.state || prev.state,
        postal: mapped.postal || prev.postal,
        country: mapped.country || prev.country,
      }));
      setShowPlacesModal(false);
      alert('Address filled. Please review and save.');
    } catch (e: any) {
      setPlacesError(e?.message || 'Unable to fetch place details. Ensure Places API is enabled.');
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    await persistAccountSettings({ consents, retention, twoFactor });
    await auditEvent({
      action: 'update',
      table: 'user_settings',
      userId: (await supabase.auth.getUser()).data.user?.id,
      metadata: { field: 'preferences' },
    });
    alert('Preferences saved.');
  };

  const handleSaveTwoFactor = async () => {
    await persistAccountSettings({ twoFactor });
    await auditEvent({
      action: 'update',
      table: 'user_settings',
      userId: (await supabase.auth.getUser()).data.user?.id,
      metadata: { field: 'two_factor' },
    });
    alert('2FA preferences saved.');
  };

  const handleSaveConsents = async () => {
    await persistAccountSettings({ consents });
    await auditEvent({
      action: 'update',
      table: 'user_settings',
      userId: (await supabase.auth.getUser()).data.user?.id,
      metadata: { field: 'consents' },
    });
    alert('Consent preferences saved.');
  };

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      alert('Signed out from all devices.');
    } catch (e: any) {
      alert(`Sign out failed: ${e.message || 'Unable to sign out'}`);
    }
  };

  const deviceSessions = (connectedDevices.length ? connectedDevices : ['Current device']).map((id, idx) => {
    const label = typeof id === 'string' ? id : `Device ${idx + 1}`;
    return {
      id: label,
      name: idx === 0 ? 'This device' : label,
      platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
      location: 'Approx. location unavailable',
      lastActive: lastSignInAt ? new Date(lastSignInAt).toLocaleString() : 'Just now',
    };
  });

  const requestAppleHealthPermissions = async () => {
    const mod = await import('react-native-health');
    const AppleHealthKit = mod.default;
    const HealthDataType = (mod as any).HealthDataType ?? {};
    const permissions = {
      permissions: {
        read: [
          HealthDataType.StepCount ?? 'StepCount',
          HealthDataType.ActiveEnergyBurned ?? 'ActiveEnergyBurned',
          HealthDataType.HeartRate ?? 'HeartRate',
          HealthDataType.SleepAnalysis ?? 'SleepAnalysis',
        ],
        write: [],
      },
    } as import('react-native-health').HealthKitPermissions;

    await new Promise<void>((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve();
      });
    });
  };

  const requestHealthConnectPermissions = async () => {
    const hc = await import('react-native-health-connect');
    const ok = await hc.initialize();
    if (!ok) throw new Error('Health Connect is not available');
    await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ] as any);
  };

  const connectSource = async (sourceId: string) => {
    setConnectingSource(sourceId);
    try {
      if (sourceId === 'apple_health') {
        await requestAppleHealthPermissions();
      }
      if (sourceId === 'health_connect') {
        await requestHealthConnectPermissions();
      }
      const updated = Array.from(new Set([...connectedDevices, sourceId]));
      const nextMeta = { ...sourceMeta, [sourceId]: new Date().toISOString() };
      setConnectedDevices(updated);
      setSourceMeta(nextMeta);
      await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
      await AsyncStorage.setItem(SOURCE_META_KEY, JSON.stringify(nextMeta));
      await persistUserSettings(updated);
      alert('Connected successfully.');
    } catch (e: any) {
      alert(`Connection failed: ${e.message || 'Unable to connect'}`);
    } finally {
      setConnectingSource(null);
    }
  };

  const disconnectSource = async (sourceId: string) => {
    const updated = connectedDevices.filter((item) => item !== sourceId);
    const { [sourceId]: _removed, ...nextMeta } = sourceMeta;
    setConnectedDevices(updated);
    setSourceMeta(nextMeta);
    await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
    await AsyncStorage.setItem(SOURCE_META_KEY, JSON.stringify(nextMeta));
    await persistUserSettings(updated);
  };

  const openSystemSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      alert('Unable to open system settings.');
    }
  };

  const handleProfileVisibility = async (val: boolean) => {
    setIsProfilePublic(val);
    await AsyncStorage.setItem('isProfilePublic', val ? 'true' : 'false');
    await persistUserSettings(connectedDevices, val);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <Text style={[styles.headerTitle, { marginHorizontal: 16, marginBottom: 8 }]}>Account Settings</Text>

        <View style={styles.settingsListCard}>
          {[
            {
              title: 'Password and security',
              icon: 'security' as const,
              onPress: () => {
                setShowPasswordModal(true);
              },
            },
            {
              title: 'Personal details',
              icon: 'person-outline' as const,
              onPress: () => {
                setShowPersonalModal(true);
              },
            },
            {
              title: 'Your information and permissions',
              icon: 'badge' as const,
              onPress: () => setShowInfoModal(true),
            },
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.settingsListItem, idx < arr.length - 1 && styles.settingsListDivider]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={styles.settingsListLeft}>
                <View style={styles.settingsListIconWrap}>
                  <MaterialIcons name={item.icon} size={20} color="#1d1d1f" />
                </View>
                <Text style={styles.settingsListText}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#6e6e73" />
            </TouchableOpacity>
          ))}
        </View>



        <Text style={[styles.headerTitle, { marginHorizontal: 16, marginBottom: 8, marginTop: 4 }]}>User Settings</Text>

        {/* Profile Privacy */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isProfilePublic ? 'rgba(255,60,32,0.15)' : 'rgba(255,149,0,0.15)' }] }>
                <MaterialIcons name={isProfilePublic ? 'public' : 'lock'} size={24} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Profile Visibility</Text>
                <Text style={styles.cardDesc}>{isProfilePublic ? 'Your profile is public' : 'Your profile is private'}</Text>
              </View>
            </View>
            <Switch
              value={isProfilePublic}
              onValueChange={handleProfileVisibility}
              trackColor={{ false: '#e5e5e7', true: '#ff3c20' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* My Targets */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MyTargetsNative')}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
                <MaterialIcons name="track-changes" size={24} color="#007aff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>My Targets</Text>
                <Text style={styles.cardDesc}>Set your fitness goals and milestones</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#6e6e73" />
          </View>
        </TouchableOpacity>

        {/* Connected Devices */}
        <View style={styles.card}>
          <View style={[styles.rowLeft, { marginBottom: 12 }] }>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
              <MaterialIcons name="watch" size={24} color="#ff3c20" />
            </View>
            <Text style={styles.cardTitle}>Connected Devices</Text>
          </View>
          <Text style={[styles.cardDesc, { marginBottom: 12 }]}>Connect a trusted health source to sync your vitals securely.</Text>
          <Text style={[styles.cardDesc, { marginBottom: 16 }]}>We only request read access. You can manage permissions anytime from your device settings.</Text>
          <View style={styles.infoPanel}>
            <View style={styles.infoRow}>
              <MaterialIcons name="verified" size={18} color="#34c759" />
              <Text style={styles.infoText}>Use Apple Health on iOS or Health Connect on Android for the most reliable sync.</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="lock" size={18} color="#007aff" />
              <Text style={styles.infoText}>We never store credentials. Permissions stay in your device settings.</Text>
            </View>
          </View>
          {HEALTH_SOURCES.filter((source) => source.platform === Platform.OS).length === 0 ? (
            <Text style={styles.cardDesc}>Not available on this device.</Text>
          ) : (
            HEALTH_SOURCES.filter((source) => source.platform === Platform.OS).map((source) => {
              const isConnected = connectedDevices.includes(source.id);
              const updatedAt = sourceMeta[source.id];
              return (
                <View key={source.id} style={styles.sourceRow}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: source.iconBg }] }>
                      <MaterialIcons name={source.icon as any} size={22} color={source.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.cardTitle}>{source.title}</Text>
                        {source.badge && (
                          <View style={styles.sourceBadge}>
                            <Text style={styles.sourceBadgeText}>{source.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardDesc}>{source.description}</Text>
                      {updatedAt && (
                        <Text style={styles.metaText}>Last updated: {new Date(updatedAt).toLocaleDateString()}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.sourceActions}>
                    <View style={[styles.statusBadge, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
                      <Text style={isConnected ? styles.statusConnectedText : styles.statusDisconnectedText}>
                        {isConnected ? 'Connected' : 'Not connected'}
                      </Text>
                    </View>
                    {isConnected ? (
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={openSystemSettings}
                        >
                          <Text style={styles.secondaryBtnText}>Manage Permissions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.tertiaryBtn}
                          onPress={() => disconnectSource(source.id)}
                        >
                          <Text style={styles.tertiaryBtnText}>Disconnect</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.connectBtn, connectingSource === source.id && { opacity: 0.6 }]}
                        onPress={() => connectSource(source.id)}
                        disabled={connectingSource === source.id}
                      >
                        <Text style={styles.connectBtnText}>
                          {connectingSource === source.id ? 'Connecting...' : 'Connect'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
          <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Compatible devices</Text>
          <Text style={[styles.cardDesc, { marginBottom: 10 }]}>Sync your device with Apple Health or Health Connect to appear here.</Text>
          <View style={styles.deviceList}>
            {COMPATIBLE_DEVICES.filter((device) => device.platforms.includes(Platform.OS)).map((device) => (
              <View key={device.name} style={styles.deviceChip}>
                <Text style={styles.deviceChipText}>{device.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* My Details - Collapsible Sections */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Details</Text>
          <Text style={[styles.cardDesc, { marginBottom: 16 }]}>Tap each section to expand and enter your health information</Text>
          
          {/* Body Composition */}
          <AccordionSection
            title="Body Composition"
            icon="accessibility"
            iconColor="#007aff"
            iconBg="rgba(0,122,255,0.15)"
            isExpanded={expandedSections.bodyComposition}
            onToggle={() => toggleSection('bodyComposition')}
          >
            <InputField
              label="Body Fat Percentage"
              value={bodyComposition.bodyFatPercentage}
              onChangeText={(text) => setBodyComposition(prev => ({ ...prev, bodyFatPercentage: text }))}
              placeholder="e.g., 18"
              keyboardType="numeric"
              suffix="%"
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Muscle Mass</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  style={[inputStyles.input, { flex: 1 }]}
                  value={bodyComposition.muscleMass}
                  onChangeText={(text) => setBodyComposition(prev => ({ ...prev, muscleMass: text }))}
                  placeholder="e.g., 35"
                  keyboardType="numeric"
                  placeholderTextColor="#a1a1a6"
                />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    style={[unitToggleStyles.btn, bodyComposition.muscleMassUnit === 'kg' && unitToggleStyles.btnActive]}
                    onPress={() => setBodyComposition(prev => ({ ...prev, muscleMassUnit: 'kg' }))}
                  >
                    <Text style={[unitToggleStyles.text, bodyComposition.muscleMassUnit === 'kg' && unitToggleStyles.textActive]}>kg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[unitToggleStyles.btn, bodyComposition.muscleMassUnit === '%' && unitToggleStyles.btnActive]}
                    onPress={() => setBodyComposition(prev => ({ ...prev, muscleMassUnit: '%' }))}
                  >
                    <Text style={[unitToggleStyles.text, bodyComposition.muscleMassUnit === '%' && unitToggleStyles.textActive]}>%</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <InputField
              label="Weight"
              value={bodyComposition.weight}
              onChangeText={(text) => setBodyComposition(prev => ({ ...prev, weight: text }))}
              placeholder="e.g., 70"
              keyboardType="numeric"
              suffix="kg"
            />
            <InputField
              label="Height"
              value={bodyComposition.height}
              onChangeText={(text) => setBodyComposition(prev => ({ ...prev, height: text }))}
              placeholder="e.g., 175"
              keyboardType="numeric"
              suffix="cm"
            />
          </AccordionSection>

          {/* Medical History */}
          <AccordionSection
            title="Medical History"
            icon="medical-services"
            iconColor="#ff3c20"
            iconBg="rgba(255,60,32,0.15)"
            isExpanded={expandedSections.medicalHistory}
            onToggle={() => toggleSection('medicalHistory')}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Chronic Conditions</Text>
              <View style={chipStyles.container}>
                {CHRONIC_CONDITIONS.map((condition) => (
                  <Chip
                    key={condition}
                    label={condition}
                    selected={medicalHistory.chronicConditions.includes(condition)}
                    onPress={() => {
                      setMedicalHistory(prev => ({
                        ...prev,
                        chronicConditions: prev.chronicConditions.includes(condition)
                          ? prev.chronicConditions.filter(c => c !== condition)
                          : [...prev.chronicConditions, condition]
                      }));
                    }}
                  />
                ))}
              </View>
            </View>
            <InputField
              label="Allergies"
              value={medicalHistory.allergies}
              onChangeText={(text) => setMedicalHistory(prev => ({ ...prev, allergies: text }))}
              placeholder="List any food or medication allergies"
              multiline
            />
            <InputField
              label="Past Injuries"
              value={medicalHistory.injuries}
              onChangeText={(text) => setMedicalHistory(prev => ({ ...prev, injuries: text }))}
              placeholder="Describe any past injuries or surgeries"
              multiline
            />
            <InputField
              label="Current Medications"
              value={medicalHistory.medications}
              onChangeText={(text) => setMedicalHistory(prev => ({ ...prev, medications: text }))}
              placeholder="List current medications"
              multiline
            />
          </AccordionSection>

          {/* Milestone Targets */}
          <AccordionSection
            title="Milestone Targets"
            icon="flag"
            iconColor="#34c759"
            iconBg="rgba(52,199,89,0.15)"
            isExpanded={expandedSections.milestoneTargets}
            onToggle={() => toggleSection('milestoneTargets')}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Goal Type</Text>
              <View style={chipStyles.container}>
                {GOAL_TYPES.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    selected={milestoneTargets.goalType === goal}
                    onPress={() => setMilestoneTargets(prev => ({ ...prev, goalType: goal }))}
                  />
                ))}
              </View>
            </View>
            <InputField
              label="Target Weight"
              value={milestoneTargets.targetWeight}
              onChangeText={(text) => setMilestoneTargets(prev => ({ ...prev, targetWeight: text }))}
              placeholder="e.g., 65"
              keyboardType="numeric"
              suffix="kg"
            />
            <InputField
              label="Target Body Fat"
              value={milestoneTargets.targetBodyFat}
              onChangeText={(text) => setMilestoneTargets(prev => ({ ...prev, targetBodyFat: text }))}
              placeholder="e.g., 15"
              keyboardType="numeric"
              suffix="%"
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Progress</Text>
              <ProgressBar progress={milestoneTargets.progress} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                {[0, 25, 50, 75, 100].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[progressStyles.quickBtn, milestoneTargets.progress === val && progressStyles.quickBtnActive]}
                    onPress={() => setMilestoneTargets(prev => ({ ...prev, progress: val }))}
                  >
                    <Text style={[progressStyles.quickBtnText, milestoneTargets.progress === val && progressStyles.quickBtnTextActive]}>{val}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AccordionSection>

          {/* Workout & Activity */}
          <AccordionSection
            title="Workout & Activity"
            icon="fitness-center"
            iconColor="#ff9500"
            iconBg="rgba(255,149,0,0.15)"
            isExpanded={expandedSections.workoutActivity}
            onToggle={() => toggleSection('workoutActivity')}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Weekly Workout Frequency</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity
                  style={sliderStyles.btn}
                  onPress={() => setWorkoutActivity(prev => ({ ...prev, frequency: Math.max(0, prev.frequency - 1) }))}
                >
                  <MaterialIcons name="remove" size={20} color="#ff3c20" />
                </TouchableOpacity>
                <Text style={sliderStyles.value}>{workoutActivity.frequency} days/week</Text>
                <TouchableOpacity
                  style={sliderStyles.btn}
                  onPress={() => setWorkoutActivity(prev => ({ ...prev, frequency: Math.min(7, prev.frequency + 1) }))}
                >
                  <MaterialIcons name="add" size={20} color="#ff3c20" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Exercise Types</Text>
              <View style={chipStyles.container}>
                {EXERCISE_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    selected={workoutActivity.exerciseTypes.includes(type)}
                    onPress={() => {
                      setWorkoutActivity(prev => ({
                        ...prev,
                        exerciseTypes: prev.exerciseTypes.includes(type)
                          ? prev.exerciseTypes.filter(t => t !== type)
                          : [...prev.exerciseTypes, type]
                      }));
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Preferred Workout Time</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Morning', 'Afternoon', 'Evening'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[timeStyles.btn, workoutActivity.preferredTime === time && timeStyles.btnActive]}
                    onPress={() => setWorkoutActivity(prev => ({ ...prev, preferredTime: time }))}
                  >
                    <Text style={[timeStyles.text, workoutActivity.preferredTime === time && timeStyles.textActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AccordionSection>

          {/* Diet & Nutrition */}
          <AccordionSection
            title="Diet & Nutrition"
            icon="restaurant"
            iconColor="#5856d6"
            iconBg="rgba(88,86,214,0.15)"
            isExpanded={expandedSections.dietNutrition}
            onToggle={() => toggleSection('dietNutrition')}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Dietary Preferences</Text>
              <View style={chipStyles.container}>
                {DIETARY_PREFERENCES.map((pref) => (
                  <Chip
                    key={pref}
                    label={pref}
                    selected={dietNutrition.dietaryPreferences.includes(pref)}
                    onPress={() => {
                      setDietNutrition(prev => ({
                        ...prev,
                        dietaryPreferences: prev.dietaryPreferences.includes(pref)
                          ? prev.dietaryPreferences.filter(p => p !== pref)
                          : [...prev.dietaryPreferences, pref]
                      }));
                    }}
                  />
                ))}
              </View>
            </View>
            <InputField
              label="Current Diet Plan"
              value={dietNutrition.currentPlan}
              onChangeText={(text) => setDietNutrition(prev => ({ ...prev, currentPlan: text }))}
              placeholder="Describe your current eating habits or diet plan"
              multiline
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={inputStyles.label}>Supplements</Text>
              <View style={chipStyles.container}>
                {SUPPLEMENT_OPTIONS.map((supp) => (
                  <Chip
                    key={supp}
                    label={supp}
                    selected={dietNutrition.supplements.includes(supp)}
                    onPress={() => {
                      setDietNutrition(prev => ({
                        ...prev,
                        supplements: prev.supplements.includes(supp)
                          ? prev.supplements.filter(s => s !== supp)
                          : [...prev.supplements, supp]
                      }));
                    }}
                  />
                ))}
              </View>
            </View>
          </AccordionSection>

          {/* Save Button */}
          <TouchableOpacity style={saveStyles.btn} onPress={saveMyDetails}>
            <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={saveStyles.text}>Save All Details</Text>
          </TouchableOpacity>
        </View>

        {/* Vitals & Documents Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Manual Vital Updates</Text>
          <TouchableOpacity style={styles.docUpload} onPress={() => openVitalModal('Blood Sugar')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
                <MaterialIcons name="monitor-heart" size={20} color="#007aff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Blood Sugar</Text>
                <Text style={styles.cardDesc}>Manual entry for blood sugar</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={20} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.docUpload} onPress={() => openVitalModal('Blood Pressure')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
                <MaterialIcons name="favorite" size={20} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Blood Pressure</Text>
                <Text style={styles.cardDesc}>Manual entry for blood pressure</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={20} color="#ff3c20" />
          </TouchableOpacity>
        </View>

        {/* Vital Manual Entry Modal */}
        <Modal visible={showVitalModal} transparent animationType="fade" onRequestClose={() => setShowVitalModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { minWidth: 320, alignItems: 'flex-start' }]}>
              <Text style={styles.modalTitle}>Enter {vitalType}</Text>
              <Text style={styles.modalDesc}>Add your {vitalType} value for trend analysis</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 12 }}
                placeholder={`Enter ${vitalType} value`}
                keyboardType="numeric"
                value={vitalValue}
                onChangeText={setVitalValue}
              />
              <Text style={{ fontSize: 15, color: '#6e6e73', marginBottom: 8 }}>{vitalUnit}</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 12 }}
                placeholder="YYYY-MM-DD"
                value={vitalDate}
                onChangeText={setVitalDate}
              />
              <TouchableOpacity style={[styles.connectBtn, { width: '100%' }]} onPress={handleSaveVital}>
                <Text style={styles.connectBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVitalModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalCard}>
            <View style={[styles.fullScreenHeaderRow, { justifyContent: 'flex-start' }]}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} accessibilityLabel="Close password and security">
                <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fullScreenTitle}>Password and security</Text>
            <Text style={styles.fullScreenSubtitle}>Manage your passwords, login preferences and recovery methods.</Text>

            <View style={styles.fullScreenList}>
              {[{
                title: 'Change password',
                onPress: () => {
                  setShowPasswordModal(false);
                  setShowChangePasswordModal(true);
                },
              }, {
                title: 'Two-factor authentication',
                onPress: () => {
                  setShowPasswordModal(false);
                  setShowTwoFactorModal(true);
                },
              }, {
                title: "Where you're logged in",
                onPress: () => {
                  setShowPasswordModal(false);
                  setShowSessionsModal(true);
                },
              }].map((row, idx, arr) => (
                <TouchableOpacity
                  key={row.title}
                  style={[styles.fullScreenListItem, idx < arr.length - 1 && styles.fullScreenListDivider]}
                  activeOpacity={0.7}
                  onPress={row.onPress}
                >
                  <Text style={styles.fullScreenListText}>{row.title}</Text>
                  <MaterialIcons name="chevron-right" size={22} color="#475569" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.changePasswordScroll}>
            <View style={styles.changePasswordCard}>
              <View style={styles.fullScreenHeaderRow}>
                <TouchableOpacity onPress={() => setShowChangePasswordModal(false)} accessibilityLabel="Close change password">
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.changePasswordTitle}>Change password</Text>
              <Text style={styles.changePasswordSubtitle}>
                Your password must be at least 6 characters and should include a combination of numbers, letters and special characters. Do not share your password with anyone.
              </Text>

              <TextInput
                style={styles.changePasswordInput}
                placeholder="Current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.changePasswordInput}
                placeholder="New password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.changePasswordInput}
                placeholder="Retype new password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity onPress={handleForgotPassword} accessibilityLabel="Forgot password" style={{ marginVertical: 6 }}>
                <Text style={styles.forgotText}>Forgotten your password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setLogoutAllDevices((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, logoutAllDevices && styles.checkboxBoxChecked]}>
                  {logoutAllDevices && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Log out from all devices.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.changePasswordBtn} activeOpacity={0.8} onPress={handleUpdatePassword} disabled={passwordLoading}>
                <Text style={styles.changePasswordBtnText}>{passwordLoading ? 'Updating…' : 'Change Password'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showTwoFactorModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTwoFactorModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.twoFactorScroll}>
            <View style={styles.twoFactorCard}>
              <View style={styles.fullScreenHeaderRow}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowTwoFactorModal(false);
                    setShowPasswordModal(true);
                  }}
                  accessibilityLabel="Close two-factor authentication"
                >
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <Text style={styles.twoFactorTitle}>Two-factor authentication</Text>
              <Text style={styles.twoFactorSubtitle}>Add an extra layer of security with verification codes.</Text>

              <View style={styles.twoFactorToggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>Turn on two-factor</Text>
                  <Text style={styles.toggleDesc}>Require a code when logging in on new devices.</Text>
                </View>
                <LiquidToggle
                  value={twoFactor.enabled}
                  onChange={(val) => setTwoFactor((prev) => ({ ...prev, enabled: val }))}
                />
              </View>

              <View style={styles.twoFactorCardSection}>
                <Text style={styles.sectionLabel}>Methods</Text>

                {[{
                  title: 'Authenticator app',
                  desc: 'Use an app like Authy or Google Authenticator to scan a QR code.',
                  key: 'authenticator' as const,
                }, {
                  title: 'Text message (SMS)',
                  desc: 'Get a 6-digit code via SMS to your phone.',
                  key: 'sms' as const,
                }, {
                  title: 'Email code',
                  desc: 'Receive a verification code in your email inbox.',
                  key: 'email' as const,
                }].map((method, idx, arr) => (
                  <View
                    key={method.key}
                    style={[styles.methodRow, idx < arr.length - 1 && styles.methodDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      <Text style={styles.methodDesc}>{method.desc}</Text>
                    </View>
                    <LiquidToggle
                      value={twoFactor.methods[method.key]}
                      onChange={(val) => setTwoFactor((prev) => ({ ...prev, methods: { ...prev.methods, [method.key]: val } }))}
                      disabled={!twoFactor.enabled}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.twoFactorCardSection}>
                <Text style={styles.sectionLabel}>Backup & recovery</Text>
                <Text style={styles.sectionHint}>If you lose access to your device, we’ll help you recover using your email.</Text>
              </View>

              <TouchableOpacity
                style={[styles.changePasswordBtn, { marginTop: 12, backgroundColor: SUPFIT_PRIMARY }]}
                activeOpacity={0.8}
                onPress={async () => {
                  await handleSaveTwoFactor();
                  setShowTwoFactorModal(false);
                }}
              >
                <Text style={styles.changePasswordBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showSessionsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.sessionsScroll}>
            <View style={styles.sessionsCard}>
              <View style={styles.fullScreenHeaderRow}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowSessionsModal(false);
                    setShowPasswordModal(true);
                  }}
                  accessibilityLabel="Close active sessions"
                >
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.sessionsTitle}>Where you're logged in</Text>
              <Text style={styles.sessionsSubtitle}>Review devices that have access to your account. Sign out devices you don't recognize.</Text>

              <View style={styles.sessionsList}>
                {deviceSessions.map((session, idx) => (
                  <View key={`${session.id}-${idx}`} style={[styles.sessionRow, idx < deviceSessions.length - 1 && styles.sessionDivider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionDevice}>{session.name}</Text>
                      <Text style={styles.sessionMeta}>{session.platform} • {session.location}</Text>
                      <Text style={styles.sessionMeta}>Last active: {session.lastActive}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.sessionAction}
                      onPress={handleSignOutAll}
                      accessibilityLabel={`Sign out ${session.name}`}
                    >
                      <Text style={styles.sessionActionText}>Sign out</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.changePasswordBtn, { marginTop: 16, backgroundColor: SUPFIT_PRIMARY }]}
                activeOpacity={0.8}
                onPress={async () => {
                  await handleSignOutAll();
                  setShowSessionsModal(false);
                }}
              >
                <Text style={styles.changePasswordBtnText}>Sign out of all sessions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showPersonalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPersonalModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.personalScroll}>
            <View style={styles.personalCard}>
              <View style={styles.fullScreenHeaderRow}
              >
                <TouchableOpacity
                  onPress={() => setShowPersonalModal(false)}
                  accessibilityLabel="Close personal details"
                >
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.personalTitle}>Personal details</Text>
              <Text style={styles.personalSubtitle}>Review your saved personal info.</Text>

              <TouchableOpacity
                style={[styles.detectLocationBtn, { alignSelf: 'flex-start', marginBottom: 16 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!googleApiKey) {
                    alert('Maps lookup is unavailable: add a Google Maps API key.');
                    return;
                  }
                  setPlacesError(null);
                  setPlacesResults([]);
                  setPlacesQuery('');
                  setShowPlacesModal(true);
                }}
              >
                <MaterialIcons name="place" size={18} color="#0f172a" />
                <Text style={styles.detectLocationText}>Select from map</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 12, marginBottom: 8 }}>Address Line 1 *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#111827', backgroundColor: '#ffffff', marginBottom: 2 }}
                placeholder="Street address"
                placeholderTextColor="#a1a1a6"
                value={address.line1}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, line1: text }))}
              />
              
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 16, marginBottom: 8 }}>Address Line 2</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#111827', backgroundColor: '#ffffff', marginBottom: 2 }}
                placeholder="Apt, suite, or floor (optional)"
                placeholderTextColor="#a1a1a6"
                value={address.line2}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, line2: text }))}
              />
              
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 16, marginBottom: 8 }}>City *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#111827', backgroundColor: '#ffffff', marginBottom: 2 }}
                placeholder="City"
                placeholderTextColor="#a1a1a6"
                value={address.city}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, city: text }))}
              />
              
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 16, marginBottom: 8 }}>State / Province *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#111827', backgroundColor: '#ffffff', marginBottom: 2 }}
                placeholder="State / Province"
                placeholderTextColor="#a1a1a6"
                value={address.state}
                onChangeText={(text) => setAddress((prev) => ({ ...prev, state: text }))}
              />
              
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 16, marginBottom: 8 }}>Postal Code * (Auto-fill from Postal Code)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#111827', backgroundColor: '#ffffff', marginBottom: 2 }}
                placeholder="e.g., 110001"
                placeholderTextColor="#a1a1a6"
                keyboardType="numeric"
                value={address.postal}
                onChangeText={(text) => {
                  setAddress((prev) => ({ ...prev, postal: text }));
                  // Auto-lookup on 6 digits entered
                  if (text.length === 6) {
                    handleLookupPostalCode(text);
                  }
                }}
                onBlur={() => {
                  if (address.postal.length >= 5) {
                    handleLookupPostalCode(address.postal);
                  }
                }}
              />
              {postalLookupLoading && (
                <Text style={{ fontSize: 12, color: '#ff3c20', fontWeight: '600', marginTop: 6, marginBottom: 2 }}>Looking up address...</Text>
              )}
              
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6e6e73', marginTop: 16, marginBottom: 8 }}>Country *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 17, color: '#9ca3af', backgroundColor: '#f9fafb', marginBottom: 2 }}
                placeholder="Country"
                placeholderTextColor="#a1a1a6"
                value={address.country}
                editable={false}
              />

              <TouchableOpacity
                style={[styles.changePasswordBtn, { marginTop: 12, backgroundColor: SUPFIT_PRIMARY }]}
                activeOpacity={0.8}
                onPress={async () => {
                  await handleSaveAddress();
                  setShowPersonalModal(false);
                }}
              >
                <Text style={styles.changePasswordBtnText}>Save address</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showPlacesModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowPlacesModal(false);
          setPlacesLoading(false);
        }}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.personalScroll}>
            <View style={styles.personalCard}>
              <View style={styles.fullScreenHeaderRow}
              >
                <TouchableOpacity
                  onPress={() => setShowPlacesModal(false)}
                  accessibilityLabel="Close Google address search"
                >
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.personalTitle}>Select address</Text>
              <Text style={styles.personalSubtitle}>Search for your address and we will fill the form.</Text>

              <View style={styles.placesSearchRow}>
                <TextInput
                  style={styles.placesSearchInput}
                  placeholder="Search by street, city, or ZIP"
                  placeholderTextColor="#9ca3af"
                  value={placesQuery}
                  onChangeText={setPlacesQuery}
                  onSubmitEditing={handlePlacesSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 0, paddingVertical: 12, paddingHorizontal: 16 }]}
                  onPress={handlePlacesSearch}
                  disabled={placesLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>{placesLoading ? 'Searching…' : 'Search'}</Text>
                </TouchableOpacity>
              </View>

              {placesError ? <Text style={styles.errorText}>{placesError}</Text> : null}
              {placesLoading ? <Text style={[styles.metaText, { marginTop: 8 }]}>Fetching suggestions…</Text> : null}

              <FlatList
                data={placesResults}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 12 }}
                ItemSeparatorComponent={() => <View style={styles.placesResultDivider} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.placesResultRow}
                    onPress={() => handleSelectPlace(item.placeId)}
                    accessibilityLabel={`Select ${item.description}`}
                  >
                    <MaterialIcons name="place" size={18} color="#ff3c20" style={{ marginRight: 8 }} />
                    <Text style={styles.placesResultTitle}>{item.description}</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#475569" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !placesLoading ? <Text style={[styles.metaText, { marginTop: 12 }]}>No results yet. Try searching.</Text> : null
                }
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <ScrollView contentContainerStyle={styles.infoScroll}>
            <View style={styles.infoCard}>
              <View style={styles.fullScreenHeaderRow}
              >
                <TouchableOpacity
                  onPress={() => setShowInfoModal(false)}
                  accessibilityLabel="Close information and permissions"
                >
                  <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.personalTitle}>Your information & permissions</Text>
              <Text style={styles.personalSubtitle}>Control how your data is used and stored.</Text>

              <View style={styles.infoCardSection}>
                <Text style={styles.sectionLabel}>Consent</Text>
                {[{
                  label: 'Health data usage',
                  key: 'healthData' as const,
                }, {
                  label: 'Marketing communications',
                  key: 'marketing' as const,
                }, {
                  label: 'Analytics & product improvement',
                  key: 'analytics' as const,
                }].map((item) => (
                  <View key={item.label} style={styles.infoRowLine}>
                    <Text style={styles.methodTitle}>{item.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: consents[item.key] ? '#0f766e' : '#b91c1c' }}>
                        {consents[item.key] ? 'Allowed' : 'Blocked'}
                      </Text>
                      <LiquidToggle
                        value={consents[item.key]}
                        onChange={(val) => setConsents((prev) => ({ ...prev, [item.key]: val }))}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.infoCardSection}>
                <Text style={styles.sectionLabel}>Retention</Text>
                <Text style={styles.methodTitle}>Legal hold</Text>
                <Text style={styles.methodDesc}>{retention.legalHold ? 'Enabled' : 'Disabled'}</Text>
                <Text style={[styles.methodTitle, { marginTop: 10 }]}>Retention period</Text>
                <Text style={styles.methodDesc}>{retention.retentionMonths} months</Text>
              </View>

              <TouchableOpacity
                style={[styles.changePasswordBtn, { marginTop: 12, backgroundColor: SUPFIT_PRIMARY }]}
                activeOpacity={0.8}
                onPress={async () => {
                  await handleSaveConsents();
                  setShowInfoModal(false);
                }}
              >
                <Text style={styles.changePasswordBtnText}>Save & Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      <FooterNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 100, paddingTop: 0 },
  header: { padding: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderBottomWidth: 0.5, borderColor: '#e5e5ea' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ff3c20', letterSpacing: -0.5 },
  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', marginHorizontal: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1d1d1f' },
  cardDesc: { fontSize: 14, color: '#6e6e73', marginTop: 2 },
  subsectionTitle: { fontSize: 16, fontWeight: '700', color: '#1d1d1f', marginTop: 6, marginBottom: 10 },
  subsectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12 },
  subsectionLabel: { fontSize: 15, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 16, color: '#1d1d1f', backgroundColor: '#fafafa', marginBottom: 12 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  primaryBtn: { backgroundColor: '#ff3c20', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  strengthPill: { borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  strengthText: { fontSize: 12, fontWeight: '700' },
  sectionDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12 },
  retentionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  retentionChip: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff' },
  retentionChipActive: { borderColor: '#007aff', backgroundColor: 'rgba(0,122,255,0.1)' },
  retentionChipText: { fontSize: 12, fontWeight: '600', color: '#1d1d1f' },
  retentionChipTextActive: { color: '#007aff' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingsListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  settingsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  settingsListDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  settingsListLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsListIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsListText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  sourceRow: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.7)' },
  sourceActions: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  statusConnected: { backgroundColor: 'rgba(52,199,89,0.12)' },
  statusDisconnected: { backgroundColor: 'rgba(255,149,0,0.12)' },
  statusConnectedText: { fontSize: 12, fontWeight: '600', color: '#34c759' },
  statusDisconnectedText: { fontSize: 12, fontWeight: '600', color: '#ff9500' },
  secondaryBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#fff' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#1d1d1f' },
  infoPanel: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#6e6e73', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { minWidth: 320, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  fullScreenModalOverlay: { flex: 1, backgroundColor: '#ffffff' },
  fullScreenModalCard: { flex: 1, padding: 20, paddingTop: 32 },
  fullScreenHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  fullScreenTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  fullScreenSubtitle: { fontSize: 14, color: '#334155', marginTop: 6, marginBottom: 18 },
  fullScreenList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  fullScreenListItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullScreenListDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  fullScreenListText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  changePasswordScroll: { flexGrow: 1 },
  changePasswordCard: { flex: 1, padding: 20, paddingTop: 32, backgroundColor: '#ffffff' },
  changePasswordTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  changePasswordSubtitle: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 16 },
  changePasswordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  forgotText: { fontSize: 14, color: '#0f172a', fontWeight: '700', marginVertical: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxChecked: { backgroundColor: SUPFIT_PRIMARY, borderColor: SUPFIT_PRIMARY },
  checkboxLabel: { fontSize: 14, color: '#0f172a', flex: 1 },
  changePasswordBtn: {
    marginTop: 12,
    backgroundColor: SUPFIT_PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  changePasswordBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  twoFactorScroll: { flexGrow: 1 },
  twoFactorCard: { flex: 1, padding: 20, paddingTop: 32, backgroundColor: '#ffffff' },
  twoFactorTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  twoFactorSubtitle: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 18 },
  twoFactorToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  toggleDesc: { fontSize: 14, color: '#475569', marginTop: 4 },
  twoFactorCardSection: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  sectionHint: { fontSize: 13, color: '#475569', lineHeight: 18 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  methodDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  methodTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  methodDesc: { fontSize: 13, color: '#475569', marginTop: 4, maxWidth: '85%' },
  sessionsScroll: { flexGrow: 1 },
  sessionsCard: { flex: 1, padding: 20, paddingTop: 32, backgroundColor: '#ffffff' },
  sessionsTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  sessionsSubtitle: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 16 },
  sessionsList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
  },
  sessionDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sessionDevice: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sessionMeta: { fontSize: 13, color: '#475569', marginTop: 2 },
  sessionAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,60,32,0.35)',
    backgroundColor: 'rgba(255,60,32,0.08)',
  },
  sessionActionText: { fontSize: 13, fontWeight: '700', color: SUPFIT_PRIMARY },
  addressHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  detectLocationText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  placesSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  placesSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '700', marginTop: 8 },
  placesResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  placesResultTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  placesResultDivider: { height: 1, backgroundColor: '#e5e7eb' },
  personalScroll: { flexGrow: 1 },
  personalCard: { flex: 1, padding: 20, paddingTop: 32, backgroundColor: '#ffffff' },
  personalTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  personalSubtitle: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 16 },
  personalRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  personalLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  personalValue: { fontSize: 15, color: '#111827' },
  infoScroll: { flexGrow: 1 },
  infoCard: { flex: 1, padding: 20, paddingTop: 32, backgroundColor: '#ffffff' },
  infoCardSection: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  infoRowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: '#6e6e73', marginBottom: 16, textAlign: 'center' },
  pickerWrap: { width: '100%', maxHeight: 180, marginBottom: 16 },
  pickerItem: { padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#f5f5f7' },
  sourceBadge: {
    backgroundColor: 'rgba(0,122,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceBadgeText: { fontSize: 11, color: '#007aff', fontWeight: '600' },
  metaText: { fontSize: 12, color: '#8e8e93', marginTop: 4 },
  tertiaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  tertiaryBtnText: { color: '#ff3b30', fontWeight: '600', fontSize: 13 },
  pickerItemSelected: { backgroundColor: 'rgba(255,60,32,0.12)' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff3c20', borderRadius: 12, padding: 14, width: '100%', marginTop: 8 },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { marginTop: 10, padding: 10 },
  cancelBtnText: { color: '#6e6e73', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  docUpload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  deviceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deviceChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8 },
  deviceChipText: { fontSize: 12, color: '#1d1d1f', fontWeight: '600' },
});

// Accordion Section Styles
const accordionStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});

// Chip Styles
const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(255,60,32,0.12)',
    borderColor: '#ff3c20',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6e6e73',
  },
  chipTextSelected: {
    color: '#ff3c20',
    fontWeight: '600',
  },
});

// Input Field Styles
const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1d1d1f',
    backgroundColor: '#fafafa',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suffix: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6e6e73',
  },
});

// Progress Bar Styles
const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e5ea',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#34c759',
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34c759',
    minWidth: 45,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
  },
  quickBtnActive: {
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
  },
  quickBtnTextActive: {
    color: '#34c759',
  },
});

// Unit Toggle Styles
const unitToggleStyles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
  },
  btnActive: {
    backgroundColor: 'rgba(255,60,32,0.12)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
  },
  textActive: {
    color: '#ff3c20',
  },
});

// Slider Styles (for frequency)
const sliderStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,60,32,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    minWidth: 120,
    textAlign: 'center',
  },
});

// Time Selection Styles
const timeStyles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: 'rgba(255,149,0,0.15)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
  },
  textActive: {
    color: '#ff9500',
  },
});

// Save Button Styles
const saveStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3c20',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  text: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default UserSettingsNative;
