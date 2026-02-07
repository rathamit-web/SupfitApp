import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Platform } from 'react-native';
import { useUserRole } from '../context/UserRoleContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as SecureStore from 'expo-secure-store';

// Preload logo
const logoImage = require('../../assets/images/Supfitlogo.png');

const UserIcon = React.memo(() => <Feather name="user" size={23} color="#fff" />);
UserIcon.displayName = 'UserIcon';
const UsersIcon = React.memo(() => <Feather name="users" size={23} color="#fff" />);
UsersIcon.displayName = 'UsersIcon';

const ROLE_STORAGE_KEY = 'supfit_user_role';

async function persistRoleSelection(role: 'individual' | 'coach') {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      await SecureStore.setItemAsync(ROLE_STORAGE_KEY, role);
    }
  } catch (err) {
    console.warn('[Landing] Failed to persist role selection', err);
  }
}

function RoleCard({ iconComponent, title, subtitle, onPress }: any) {
  const [pressed, setPressed] = useState(false);
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: 'rgba(255, 87, 34, 0.12)' }}
      style={({ pressed: isPressed }) => [
        styles.roleCardWrapper,
        (pressed || isPressed) && styles.roleCardPressed
      ]}
    >
      <View style={styles.roleCardContainer}>
        <View style={styles.roleCardContent}>
          <View style={styles.roleIconWrap}>
            {iconComponent}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleTitle}>{title}</Text>
            <Text style={styles.roleSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.chevronWrap}>
            <Feather name="chevron-right" size={24} color="rgba(255, 60, 32, 0.8)" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}


export default function Landing({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { setRole } = useUserRole();

  // Preload assets for faster rendering
  useEffect(() => {
    async function preloadAssets() {
      try {
        await Asset.loadAsync(logoImage);
        setImageLoaded(true);
      } catch (error) {
        console.error('Failed to preload assets:', error);
        // Still set to true to allow fallback rendering
        setImageLoaded(true);
      }
    }
    preloadAssets();
  }, []);

  // Store role selection globally so auth hook can inject it into signup metadata
  const handleRoleSelect = async (role: 'individual' | 'coach') => {
    setLoading(true);
    try {
      console.log('[Landing] Role selected by user:', role);
      setRole(role === 'individual' ? 'user' : 'coach');
      await persistRoleSelection(role);
      
      // Store in window for auth hook to access
      if (typeof window !== 'undefined') {
        (window as any).__supfit_selected_role = role;
        console.log('[Landing] Stored role in global context:', role);
      }
      
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Auth', { userType: role });
        console.log('[Landing] Navigated to Auth with userType:', role);
      } else {
        console.error('Navigation prop is missing in Landing');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <LinearGradient
      colors={['#ffffff', '#fafafa', '#f5f5f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingSpinner} />
        </View>
      )}
      <View style={styles.centeredContent}>
        <View style={styles.logoContainer}>
          {!imageLoaded && (
            <View style={styles.logoPlaceholder}>
              <View style={styles.logoShimmer} />
            </View>
          )}
          <Image
            source={logoImage}
            style={[styles.logo, !imageLoaded && styles.logoHidden]}
            resizeMode="contain"
            fadeDuration={300}
            onLoadEnd={() => setImageLoaded(true)}
          />
        </View>
        
        <View style={styles.heroSection}>
               <Text style={styles.subtag}>Transform your health journey with the power of AI</Text>
        </View>
        
        <View style={styles.rolesContainer}>
          <Text style={styles.chooseRole}>Choose Your Role</Text>
          
          <RoleCard
            iconComponent={<UserIcon />}
            title="Individual User"
            subtitle="AI powered fitness tracking"
            onPress={() => handleRoleSelect('individual')}
          />
          
          <RoleCard
            iconComponent={<UsersIcon />}
            title="Coach & Dietician"
            subtitle="Grow your fitness business with Supfit"
            onPress={() => handleRoleSelect('coach')}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>© 2025 SupFit · Your journey to better health starts here</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#ff3c20',
    borderTopColor: 'transparent',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    width: 280,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 260,
    height: 100,
  },
  logoHidden: {
    opacity: 0,
  },
  logoPlaceholder: {
    position: 'absolute',
    width: 260,
    height: 100,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoShimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e8e8ed',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 28,
    color: '#ff3c20',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  subtag: {
    fontSize: 15,
    color: '#86868b',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.2,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  rolesContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  chooseRole: {
    fontSize: 13,
    color: '#86868b',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 20,
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  roleCardWrapper: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  roleCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  roleCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  roleIconWrap: {
    width: 56,
    height: 56,
    backgroundColor: '#ff3c20',
    borderRadius: 16,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff3c20',
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#86868b',
    fontWeight: '400',
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  chevronWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 60, 32, 0.06)',
    borderRadius: 10,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  footerDivider: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 60, 32, 0.2)',
    borderRadius: 2,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#86868b',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
});
