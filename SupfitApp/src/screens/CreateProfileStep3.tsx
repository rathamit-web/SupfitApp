import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUserRole } from '../context/UserRoleContext';
import { supabase } from '../../shared/supabaseClient';

type CustomCheckboxProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

type ProfileFormData = {
  name?: string;
  age?: string;
  gender?: 'male' | 'female' | string;
  bio?: string;
  avatar?: string;
  height?: string;
  heightUnit?: 'cm' | 'ft' | string;
  weight?: string;
  weightUnit?: 'kg' | 'lbs' | string;
  is_minor?: boolean;
};

type CreateProfileStep3RouteParams = {
  userType?: string;
  formData?: ProfileFormData;
};

function CustomCheckbox({ value, onValueChange, disabled }: CustomCheckboxProps) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: value ? '#ff3c20' : '#ccc',
        backgroundColor: value ? '#ff3c20' : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        opacity: disabled ? 0.5 : 1,
      }}
      activeOpacity={disabled ? 1 : 0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
    >
      {value && (
        <View style={{ width: 12, height: 12, backgroundColor: '#fff', borderRadius: 3 }} />
      )}
    </TouchableOpacity>
  );
}


const consentPoints = [
  'My health, personal, and smartwatch data will be used only for tracking and analysis.',
  'My information will not be shared or sold, except as required by law.',
  'The app follows HIPAA and data protection standards to keep my information secure.',
  'I may withdraw consent or request deletion of my data at any time.',
];

export default function CreateProfileStep3() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { role } = useUserRole();
  const { width } = Dimensions.get('window');
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [guardianChecked, setGuardianChecked] = useState(false);

  const parseNumericInput = (value?: string | number | null) => {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/,/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const roundTo2 = (value: number) => Math.round(value * 100) / 100;

  const enforcePrecisionLimit = (value: number | null, label: string) => {
    if (value === null) return value;
    if (Math.abs(value) >= 1000) {
      Alert.alert('Invalid ' + label, `${label} must be less than 1000. Please correct it.`);
      return undefined;
    }
    return value;
  };

  const handleContinue = async () => {
    console.log('=== CONTINUE CLICKED ===');
    console.log('Consent checked:', consentChecked);
    console.log('Guardian checked:', guardianChecked);
    
    if (!consentChecked) {
      Alert.alert('Consent Required', 'Please check the consent box to continue.');
      return;
    }
    
    setLoading(true);
    const routeParams = (route.params || {}) as CreateProfileStep3RouteParams;
    const userType = routeParams.userType || role;
    const formData = routeParams.formData || {};
    
    console.log('Form data:', formData);
    console.log('User type:', userType);
    
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('=== AUTH CHECK ===');
      console.log('User ID:', user?.id);
      console.log('Auth error:', authError);
      
      if (authError || !user?.id) {
        console.error('AUTH FAILED:', authError);
        Alert.alert('Authentication Error', 'Please sign in again.');
        setLoading(false);
        return;
      }

      // Check minor status and guardian consent
      const isMinor = formData.is_minor === true || (formData.age && parseInt(formData.age) < 18);
      console.log('Is minor:', isMinor);
      
      if (isMinor && !guardianChecked) {
        Alert.alert('Guardian Consent Required', 'Please have your guardian provide consent.');
        setLoading(false);
        return;
      }

      console.log('=== SAVING CONSENT ===');
      // Log consent (skip if fails)
      try {
        const { error: consentError } = await supabase.from('user_consent').insert({
          user_id: user.id,
          consent_form_id: 1,
          consent_value: true,
          guardian_signed: isMinor,
        });
        
        if (consentError) {
          console.warn('Consent save failed (continuing anyway):', consentError);
        } else {
          console.log('Consent saved successfully');
        }
      } catch (e) {
        console.warn('Consent save exception (continuing anyway):', e);
      }

      console.log('=== SAVING PROFILE ===');
      // Upsert user profile
      const heightInput = parseNumericInput(formData.height);
      const weightInput = parseNumericInput(formData.weight);

      const heightCmRaw =
        formData.heightUnit === 'cm'
          ? heightInput
          : formData.heightUnit === 'ft'
            ? heightInput !== null
              ? heightInput * 30.48
              : null
            : null;
      const weightKgRaw =
        formData.weightUnit === 'kg'
          ? weightInput
          : formData.weightUnit === 'lbs'
            ? weightInput !== null
              ? weightInput * 0.453592
              : null
            : null;

      const heightCm = heightCmRaw !== null ? roundTo2(heightCmRaw) : null;
      const weightKg = weightKgRaw !== null ? roundTo2(weightKgRaw) : null;

      const heightChecked = enforcePrecisionLimit(heightCm, 'Height');
      if (heightChecked === undefined) {
        setLoading(false);
        return;
      }
      const weightChecked = enforcePrecisionLimit(weightKg, 'Weight');
      if (weightChecked === undefined) {
        setLoading(false);
        return;
      }

      const profilePayload = {
        id: user.id,
        full_name: formData.name || 'User',
        dob: formData.age ? new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1).toISOString().slice(0, 10) : null,
        gender: formData.gender === 'male' ? 'M' : formData.gender === 'female' ? 'F' : 'Other',
        bio: formData.bio || '',
        avatar_url: formData.avatar || '',
        height_cm: heightChecked,
        weight_kg: weightChecked,
        units: formData.heightUnit === 'cm' ? 'metric' : 'imperial',
      };
      
      console.log('Profile payload:', profilePayload);

      const { data: profileData, error: profileError } = await supabase.from('user_profiles').upsert(profilePayload);
      
      console.log('Profile response:', { data: profileData, error: profileError });
      
      if (profileError) {
        console.error('PROFILE SAVE FAILED:', profileError);
        Alert.alert('Error', `Could not save profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      console.log('=== PROFILE SAVED, NAVIGATING ===');
      console.log('Navigating to:', userType === 'coach' ? 'CoachHome' : 'IndividualHome');
      
      // Navigate to home
      setTimeout(() => {
        if (userType === 'coach') {
          navigation.navigate('CoachHome');
        } else {
          navigation.navigate('IndividualHome');
        }
      }, 100);
      
    } catch (e) {
      console.error('=== UNEXPECTED ERROR ===', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', `Unexpected error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#e0e7ff", "#f5d0fe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { width: width > 400 ? 370 : '95%' }]}> 
          <Text style={styles.title}>User Data Consent & Privacy Notice</Text>
          <Text style={styles.italicText}>“Your data, your control — always secure.”</Text>
          <View style={styles.consentBox}>
            <Text style={styles.consentIntro}>By continuing, I agree that:</Text>
            {consentPoints.map((point, idx) => (
              <Text key={idx} style={styles.consentPoint}>• {point}</Text>
            ))}
            <View style={styles.consentFinalRow}>
              <CustomCheckbox
                value={consentChecked}
                onValueChange={setConsentChecked}
                disabled={loading}
              />
              <Text style={styles.consentFinalText}>I have read and consent to the collection and use of my data as described.</Text>
            </View>
            {/* Guardian consent for minors */}
            {(route.params?.formData?.is_minor === true || (route.params?.formData?.age && parseInt(route.params.formData.age) < 18)) && (
              <View style={styles.consentFinalRow}>
                <CustomCheckbox
                  value={guardianChecked}
                  onValueChange={setGuardianChecked}
                  disabled={loading}
                />
                <Text style={styles.consentFinalText}>Guardian has read and consents to the collection and use of data for this minor.</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.glassButton,
                (loading || !consentChecked || ((route.params?.formData?.is_minor === true || (route.params?.formData?.age && parseInt(route.params.formData.age) < 18)) && !guardianChecked)) && styles.glassButtonDisabled
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (!loading && consentChecked && (!((route.params?.formData?.is_minor === true || (route.params?.formData?.age && parseInt(route.params.formData.age) < 18)) && !guardianChecked))) {
                  handleContinue();
                }
              }}
              disabled={loading || !consentChecked || ((route.params?.formData?.is_minor === true || (route.params?.formData?.age && parseInt(route.params.formData.age) < 18)) && !guardianChecked)}
            >
              <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="light" style={styles.blurContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.5)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.glassGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ff3c20" />
                  ) : (
                    <Text style={styles.glassButtonText}>Continue</Text>
                  )}
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#bbaaff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
    minHeight: 340,
    justifyContent: 'flex-start',
  },
  title: {
    color: '#ff3c20',
    fontWeight: '800',
    fontSize: 22,
    marginBottom: 12,
    marginTop: 0,
    textAlign: 'center',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#ff3c20',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  consentBox: {
    marginBottom: 16,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 14,
  },
  consentIntro: {
    color: '#444',
    fontSize: 15,
    marginBottom: 8,
  },
  consentPoint: {
    color: '#444',
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 8,
  },
  consentFinalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#ff3c20',
  },
  consentFinalText: {
    color: '#ff3c20',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    width: '100%',
  },
  glassButton: {
    width: '100%',
    maxWidth: 280,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  glassButtonDisabled: {
    opacity: 0.4,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  glassGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  glassButtonText: {
    color: '#ff3c20',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.4,
    textTransform: 'none',
  },
});
