import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useUserRole } from '../context/UserRoleContext';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
// Removed duplicate BlurView import
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';

type AuthProps = {
  route: RouteProp<Record<string, object | undefined>, string>;
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
};

export default function Auth({ route, navigation }: AuthProps) {
  // BYPASS AUTH FOR TESTING: auto-redirect to correct home screen
  useEffect(() => {
    if (navigation && typeof navigation.replace === 'function') {
      const userType = route?.params?.userType || 'individual';
      if (userType === 'coach') {
        navigation.replace('CoachHome', { userType: 'coach' });
      } else {
        navigation.replace('IndividualHome', { userType: 'individual' });
      }
    }
  }, [navigation, route]);
  const userType = route?.params?.userType || 'individual';
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { role, setRole } = useUserRole();
  const { signInOrSignUp, loading: authLoading, error: authError } = useSupabaseAuth();

  // prompt variable removed (was unused)

  // Social login handlers (mocked)
  const handleGoogleLogin = () => {
    // TODO: Integrate Google login
    alert('Google login (mock)');
  };
  const handleAppleLogin = () => {
    // TODO: Integrate Apple login
    alert('Apple login (mock)');
  };
  const handleMobileLogin = () => {
    // TODO: Integrate Mobile OTP login
    alert('Mobile login (mock)');
  };

  const handleSubmit = async () => {
    if (!navigation || typeof navigation.navigate !== 'function') {
      console.error('Navigation prop is missing in Auth');
      return;
    }
    // Set role in context if not already set (for deep links, etc)
    if (!role) setRole(userType === 'coach' ? 'coach' : 'user');
    if (!formData.email || !formData.password) {
      alert('Please enter email and password');
      return;
    }
    const result = await signInOrSignUp(formData.email, formData.password, isLogin);
    if (result.error) {
      alert(result.error.message || 'Authentication failed');
      return;
    }
    if (isLogin) {
      if ((role || userType) === 'coach') {
        navigation.navigate('CoachHome', { userType: 'coach' });
      } else {
        navigation.navigate('IndividualHome', { userType: 'individual' });
      }
    } else {
      // Pass role to profile creation
      navigation.navigate('CreateProfileStep1', { userType: role || userType });
    }
  };

  // Bypass: render nothing
  return null;
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    minHeight: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: height < 700 ? 16 : 32,
    paddingHorizontal: width < 350 ? 10 : 24,
    maxWidth: 380,
    width: width > 400 ? 360 : '100%',
    alignItems: 'center',
    shadowColor: '#bbaaff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
    minHeight: height < 700 ? 380 : 520, // Responsive minHeight for small screens
    justifyContent: 'flex-start',
  },
  logo: {
    width: 170,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 22,
    marginTop: 0,
    alignSelf: 'center',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  tabRowGlass: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  tabGlassBg: {
    height: 40, // Match the toggle button height
    minHeight: 40,
    maxHeight: 40,
    flexDirection: 'row',
    borderRadius: 9999,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    // No border/shadow to prevent unwanted background
  },
    inputHidden: {
      opacity: 0,
      pointerEvents: 'none',
    },

    submitBtnGlassBg: {
      borderRadius: 9999,
      overflow: 'hidden',
      marginTop: 8,
      marginBottom: 8,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
  tabBtnGlass: {
    flex: 1,
    borderRadius: 9999,
    marginHorizontal: 0,
    overflow: 'hidden',
    zIndex: 2,
    height: 40, // reduced from 56
    marginVertical: 1,
    marginBottom: 1,
    backgroundColor: 'transparent',
    transitionProperty: 'all',
    transitionDuration: '200ms',
  },
  tabBtnGlassActive: {
    // No extra style, handled by gradient
  },
  tabBtnGlassInactive: {
    // For inactive tab, add a true glassmorphism effect
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.32)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
    // Remove any black/opaque background
  },
  tabBtnGlassGradient: {
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 }, // reduced shadow
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtnGlassInactiveBg: {
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)', // subtle glassy white
    // Remove any black/opaque background
  },
  tabBtnGlassText: {
    fontSize: 15, // reduced from 20
    fontWeight: '700',
    color: '#ff3c20cc',
    letterSpacing: 0.1,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabBtnGlassTextActive: {
    color: '#fff',
    textShadowColor: '#ff3c20',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 10,
    minHeight: height < 700 ? 120 : 210, // Responsive form minHeight
    justifyContent: 'flex-start',
  },
  inputWrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#f7f7fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#222',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  submitBtn: {
    width: '100%',
    borderRadius: 9999,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnGradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
    textShadowColor: '#ff3c20',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  orText: {
    color: '#bdbdbd',
    fontSize: 15,
    marginVertical: 2,
    fontWeight: '500',
  },
  continueWith: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginTop: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 18,
    marginTop: 2,
  },
  socialIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ececec',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});
