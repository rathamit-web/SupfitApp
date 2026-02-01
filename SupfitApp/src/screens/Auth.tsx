import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { useUserRole } from '../context/UserRoleContext';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
// Removed duplicate BlurView import
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../shared/supabaseClient';

// Fetch user profile from Supabase
async function fetchUserProfileFromSupabase(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data, error };
}

// Log auth errors to analytics_events
async function logAuthError(eventType, email, errorMsg) {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'login',
      event_subtype: eventType,
      event_data: { email, error: errorMsg },
      occurred_at: new Date().toISOString(),
    });
  } catch {
    // Silent fail for logging
  }
}

WebBrowser.maybeCompleteAuthSession();

type AuthProps = {
  route: RouteProp<Record<string, object | undefined>, string>;
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
};

export default function Auth({ route, navigation }: AuthProps) {
  const userType = route?.params?.userType || 'individual';
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const { role, setRole } = useUserRole();
  const { signInOrSignUp, resendConfirmationEmail, loading: authLoading, error: authError } = useSupabaseAuth();

  // prompt variable removed (was unused)

  // Google OAuth handler
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'supfit://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'supfit://auth/callback');
        if (result.type === 'success' && result.url) {
          // Handle the callback URL and extract tokens
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (!sessionError) {
              setRole(userType === 'coach' ? 'coach' : 'user');
              navigation.navigate('CreateProfileStep1', { userType: role || userType });
            }
          }
        }
      }
    } catch {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    }
  };

  // Apple OAuth handler
  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
      return;
    }
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        
        if (error) {
          Alert.alert('Error', error.message);
          return;
        }
        
        if (data?.user) {
          setRole(userType === 'coach' ? 'coach' : 'user');
          navigation.navigate('CreateProfileStep1', { userType: role || userType });
        }
      }
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        Alert.alert('Error', 'Apple sign-in failed. Please try again.');
      }
    }
  };

  // Mobile OTP handler
  const handleMobileLogin = () => {
    Alert.alert('Coming Soon', 'Mobile OTP login will be available soon.');
  };

  const handleSubmit = async () => {
    if (!navigation || typeof navigation.navigate !== 'function') {
      console.error('Navigation prop is missing in Auth');
      return;
    }
    // Set role in context if not already set (for deep links, etc)
    if (!role) setRole(userType === 'coach' ? 'coach' : 'user');
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please enter email and password');
      await logAuthError('missing_info', formData.email, 'Missing email or password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      await logAuthError('invalid_email', formData.email, 'Invalid email format');
      return;
    }

    // Password validation for signup
    if (!isLogin && formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      await logAuthError('weak_password', formData.email, 'Password too short');
      return;
    }

    const result = await signInOrSignUp(formData.email.trim().toLowerCase(), formData.password, isLogin);

    if (result.error) {
      await logAuthError('auth_error', formData.email, result.error.message || 'Authentication failed');
      // Error is already set in the hook, but we can show specific alerts
      if (result.error.message?.includes('Invalid login credentials')) {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please check your credentials.\n\nIf you just signed up, make sure to confirm your email first.',
          [
            { text: 'Try Again', style: 'cancel' },
            { 
              text: 'Sign Up Instead', 
              onPress: () => setIsLogin(false) 
            }
          ]
        );
      } else if (result.error.message?.includes('Email not confirmed')) {
        Alert.alert(
          'Email Not Confirmed',
          'Please check your inbox and click the confirmation link before logging in.',
          [
            { text: 'OK', style: 'cancel' },
            { 
              text: 'Resend Email', 
              onPress: async () => {
                const resendResult = await resendConfirmationEmail(formData.email.trim().toLowerCase());
                if (resendResult.success) {
                  Alert.alert('Email Sent', 'Confirmation email has been resent. Please check your inbox.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error.message || 'Authentication failed');
      }
      return;
    }

    // Check if email confirmation is required (signup without session)
    if (!isLogin && result.data?.user && !result.data.session) {
      setShowConfirmationMessage(true);
      Alert.alert(
        'Check Your Email',
        `We've sent a confirmation link to ${formData.email}. Please click the link to verify your account, then come back and log in.`,
        [
          { 
            text: 'OK, I\'ll Check', 
            onPress: () => {
              setIsLogin(true); // Switch to login mode
              setShowConfirmationMessage(false);
            }
          }
        ]
      );
      return;
    }

    // After login, fetch user profile and enforce onboarding if incomplete
    if (isLogin && result.data?.session?.user?.id) {
      const userId = result.data.session.user.id;
      const { profile, error: profileError } = await fetchUserProfileFromSupabase(userId);
      if (profileError) {
        await logAuthError('profile_fetch', formData.email, profileError.message);
        Alert.alert('Error', 'Could not fetch your profile. Please try again.');
        return;
      }
      // Check for required fields (adjust as needed)
      if (!profile?.full_name || !profile?.dob) {
        navigation.navigate('CreateProfileStep1', { userType: role || userType });
      } else {
        navigation.navigate((role || userType) === 'coach' ? 'CoachHome' : 'IndividualHome', { userType: role || userType });
      }
    } else if (!isLogin) {
      // Pass role to profile creation after signup
      navigation.navigate('CreateProfileStep1', { userType: role || userType });
    }
  };

  return (
    <LinearGradient colors={['#fff5f3', '#fafafa', '#f5f5f7']} style={styles.gradientBg}>
      <View style={styles.outerContainer}>
        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <Image
            source={require('../../assets/images/Supfitlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Login / Signup Toggle */}
          <View style={styles.tabRowGlass}>
            <View style={styles.tabGlassBg}>
              <TouchableOpacity
                style={[styles.tabBtnGlass, isLogin ? styles.tabBtnGlassActive : styles.tabBtnGlassInactive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.85}
              >
                {isLogin ? (
                  <LinearGradient
                    colors={['#ff3c20', '#ff6a4d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabBtnGlassGradient}
                  >
                    <Text style={[styles.tabBtnGlassText, styles.tabBtnGlassTextActive]}>Login</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabBtnGlassInactiveBg}>
                    <Text style={styles.tabBtnGlassText}>Login</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtnGlass, !isLogin ? styles.tabBtnGlassActive : styles.tabBtnGlassInactive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.85}
              >
                {!isLogin ? (
                  <LinearGradient
                    colors={['#ff3c20', '#ff6a4d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabBtnGlassGradient}
                  >
                    <Text style={[styles.tabBtnGlassText, styles.tabBtnGlassTextActive]}>Sign Up</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabBtnGlassInactiveBg}>
                    <Text style={styles.tabBtnGlassText}>Sign Up</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#aaa"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                />
              </View>
            )}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="#aaa"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#aaa"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />
            </View>

            {/* Email Confirmation Message */}
            {showConfirmationMessage && (
              <View style={styles.confirmationBanner}>
                <MaterialIcons name="mail-outline" size={20} color="#007aff" />
                <Text style={styles.confirmationText}>
                  Check your email for a confirmation link, then log in.
                </Text>
              </View>
            )}

            {/* Auth Error Message */}
            {authError && authError !== 'CONFIRM_EMAIL' && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color="#ff3c20" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={authLoading}>
              <LinearGradient
                colors={['#ff3c20', '#ff6a4d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitBtnGradient}
              >
                <Text style={styles.submitBtnText}>
                  {authLoading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Helpful hint for login */}
            {isLogin && (
              <Text style={styles.hintText}>
                Just signed up? Check your email for a confirmation link first.
              </Text>
            )}
          </View>

          {/* Social Login */}
          <Text style={styles.orText}>or</Text>
          <Text style={styles.continueWith}>Continue with</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIconBtn} onPress={handleGoogleLogin}>
              <AntDesign name="google" size={22} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIconBtn} onPress={handleAppleLogin}>
              <Ionicons name="logo-apple" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIconBtn} onPress={handleMobileLogin}>
              <MaterialIcons name="phone-iphone" size={22} color="#34C759" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </LinearGradient>
  );
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 12px 32px rgba(187,170,255,0.3)' }
      : { elevation: 12 }),
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 16px rgba(255,60,32,0.22)' }
      : { elevation: 4 }),
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }
      : { elevation: 1 }),
    // Remove any black/opaque background
  },
  tabBtnGlassGradient: {
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 14px rgba(255,60,32,0.18)' }
      : { elevation: 2 }),
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
    textShadow: '0px 1px 2px rgba(255,255,255,0.8)',
  },
  tabBtnGlassTextActive: {
    color: '#fff',
    textShadow: '0px 2px 8px rgba(255,60,32,0.36)',
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }
      : { elevation: 1 }),
  },
  submitBtn: {
    width: '100%',
    borderRadius: 9999,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 20px rgba(255,60,32,0.22)' }
      : { elevation: 4 }),
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
    textShadow: '0px 1px 2px rgba(255,60,32,0.5)',
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.08)' }
      : { elevation: 2 }),
  },
  confirmationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#007aff',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,60,32,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3c20',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 13,
    color: '#6e6e73',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
