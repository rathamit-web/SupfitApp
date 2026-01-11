import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, FlatList, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { auditEvent } from '../lib/audit';
import {
  ENABLE_PURPOSED_VITALS,
  DEFAULT_VITAL_PURPOSE,
  DEFAULT_CONSENT_VERSION,
  buildVitalPayload,
} from '../config/privacy';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import FooterNav from '../components/FooterNav';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Image validation constants (native)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png']);

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

const DEVICE_BRANDS = [
  'Apple Watch',
  'Google Pixel Watch',
  'Garmin',
  'Whoop',
  'Samsung Galaxy Watch',
  'Fitbit',
  'Other',
];

const UserSettingsNative = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
    // const insets = useSafeAreaInsets();
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    (async () => {
      // Get user id
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) return;
      // Fetch settings from Supabase
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (data) {
        setConnectedDevices(data.connectedDevices || []);
        setIsProfilePublic(data.isProfilePublic ?? true);
        await AsyncStorage.setItem('connectedDevices', JSON.stringify(data.connectedDevices || []));
        await AsyncStorage.setItem('isProfilePublic', data.isProfilePublic ? 'true' : 'false');
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
      } catch (e) {
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

  const handleFileUpload = async (type: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) throw new Error('User not logged in');
        const uri = result.assets[0].uri;
        const mimeType = result.assets[0].mimeType || '';
        // Enforce image type restrictions and size limit per platform standards
        if (mimeType.startsWith('image/') && !ALLOWED_IMAGE_MIME.has(mimeType)) {
          alert('Only JPEG or PNG images are allowed.');
          return;
        }
        try {
          const info = await FileSystem.getInfoAsync(uri);
          const size = (info as any).size ?? 0;
          if (size > MAX_FILE_SIZE) {
            alert('File too large. Maximum size is 10 MB.');
            return;
          }
        } catch {}
        const fileExt = uri.split('.').pop();
        const fileName = `healthdocs/${user_id}_${Date.now()}.${fileExt}`;
        // FileSystem.EncodingType is deprecated and not available; use 'base64' string directly
        const fileData = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const { error: uploadError } = await supabase.storage
          .from('healthdocs')
          .upload(fileName, Buffer.from(fileData, 'base64'), { contentType: result.assets[0].mimeType || 'application/octet-stream', upsert: true });
        if (uploadError) throw uploadError;
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('healthdocs').getPublicUrl(fileName);
        const publicUrl = publicUrlData?.publicUrl;
        // Save metadata in Supabase
        await supabase.from('health_documents').insert({ user_id, type, name: result.assets[0].name, url: publicUrl });
        alert(`Uploaded ${type}: ${result.assets[0].name}`);
      } catch (e: any) {
        alert(`Upload failed: ${e.message || 'Could not upload file'}`);
      }
    }
  };

  const handleAddDevice = () => setShowDeviceModal(true);

  const handleConnectDevice = async () => {
    if (!selectedBrand) return;
    setIsConnecting(true);
    setTimeout(async () => {
      const updated = [...connectedDevices, selectedBrand];
      setConnectedDevices(updated);
      await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
      setIsConnecting(false);
      setShowDeviceModal(false);
      setSelectedBrand('');
    }, 1500);
  };

  const handleProfileVisibility = async (val: boolean) => {
    setIsProfilePublic(val);
    await AsyncStorage.setItem('isProfilePublic', val ? 'true' : 'false');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Settings</Text>
        </View>

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
          {connectedDevices.length > 0 ? (
            <FlatList
              data={connectedDevices}
              keyExtractor={(item, idx) => item + idx}
              renderItem={({ item }) => (
                <View style={styles.deviceRow}>
                  <MaterialIcons name="bluetooth" size={18} color="#007aff" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: '#007aff' }}>{item}</Text>
                </View>
              )}
              style={{ marginBottom: 8 }}
            />
          ) : (
            <Text style={styles.cardDesc}>No device connected</Text>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Device</Text>
          </TouchableOpacity>
        </View>

        {/* Device Modal */}
        <Modal visible={showDeviceModal} transparent animationType="fade" onRequestClose={() => setShowDeviceModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Connect Smartwatch</Text>
              <Text style={styles.modalDesc}>Select your smartwatch brand to connect via Bluetooth</Text>
              <View style={styles.pickerWrap}>
                <FlatList
                  data={DEVICE_BRANDS}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, selectedBrand === item && styles.pickerItemSelected]}
                      onPress={() => setSelectedBrand(item)}
                      disabled={isConnecting}
                    >
                      <Text style={{ color: selectedBrand === item ? '#ff3c20' : '#1d1d1f', fontWeight: selectedBrand === item ? '700' : '500' }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <TouchableOpacity
                style={[styles.connectBtn, (!selectedBrand || isConnecting) && { opacity: 0.6 }]}
                onPress={handleConnectDevice}
                disabled={!selectedBrand || isConnecting}
              >
                <MaterialIcons name="bluetooth" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.connectBtnText}>{isConnecting ? 'Connecting...' : 'Connect'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeviceModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
          <Text style={styles.sectionTitle}>Health Records</Text>
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
          <TouchableOpacity style={styles.docUpload} onPress={() => handleFileUpload('vital')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
                <MaterialIcons name="monitor-heart" size={20} color="#007aff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Vital Reports</Text>
                <Text style={styles.cardDesc}>Blood tests, vitals, and health metrics</Text>
              </View>
            </View>
            <MaterialIcons name="upload-file" size={20} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.docUpload} onPress={() => handleFileUpload('prescription')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(52,199,89,0.15)' }] }>
                <MaterialIcons name="medication" size={20} color="#34c759" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Prescriptions</Text>
                <Text style={styles.cardDesc}>Medical prescriptions and medications</Text>
              </View>
            </View>
            <MaterialIcons name="upload-file" size={20} color="#34c759" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.docUpload} onPress={() => handleFileUpload('medical')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
                <MaterialIcons name="favorite" size={20} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Medical History Docs</Text>
                <Text style={styles.cardDesc}>Past medical records and history</Text>
              </View>
            </View>
            <MaterialIcons name="upload-file" size={20} color="#ff3c20" />
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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff3c20', borderRadius: 12, padding: 12, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { minWidth: 320, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: '#6e6e73', marginBottom: 16, textAlign: 'center' },
  pickerWrap: { width: '100%', maxHeight: 180, marginBottom: 16 },
  pickerItem: { padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#f5f5f7' },
  pickerItemSelected: { backgroundColor: 'rgba(255,60,32,0.12)' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff3c20', borderRadius: 12, padding: 14, width: '100%', marginTop: 8 },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { marginTop: 10, padding: 10 },
  cancelBtnText: { color: '#6e6e73', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  docUpload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
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
