import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useUserRole } from '../context/UserRoleContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
// const logoAsset = require('../../assets/images/Supfitlogo.png');
function RoleCard({ iconComponent, title, subtitle, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255, 87, 34, 0.12)' }}
      style={{ borderRadius: 18, marginVertical: 8, alignSelf: 'center' }}
    >
      <LinearGradient
        colors={["#ff512f", "#ff3c20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.roleCard}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.roleIconWrap}>
            {iconComponent}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleTitle}>{title}</Text>
            <Text style={styles.roleSubtitle}>{subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={28} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}


export default function Landing({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const { setRole } = useUserRole();

  // Restore: go to Auth page, let Auth handle bypass
  const handleRoleSelect = async (role: 'individual' | 'coach') => {
    setLoading(true);
    try {
      setRole(role === 'individual' ? 'user' : 'coach');
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Auth', { userType: role });
      } else {
        console.error('Navigation prop is missing in Landing');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          {/* Keep loading overlay only for navigation, not for asset loading */}
        </View>
      )}
      <View style={styles.centeredContent}>
        <View style={{ width: 320, height: 140, backgroundColor: '#fcfcfd', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 0, marginTop: 0, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/images/Supfitlogo.png')}
            style={styles.logo}
            fadeDuration={200}
            // defaultSource is iOS only, but helps with perceived perf
            defaultSource={require('../../assets/images/Supfitlogo.png')}
          />
        </View>
        <Text style={styles.tagline}>Fuel your fitness, powered by AI</Text>
        <Text style={styles.chooseRole}>CHOOSE YOUR ROLE</Text>
        <RoleCard
          iconComponent={<Feather name="user" size={36} color="#fff" />}
          title="Individual User"
          subtitle="Ar powered fitness tracking"
          onPress={() => handleRoleSelect('individual')}
        />
        <RoleCard
          iconComponent={<Feather name="users" size={36} color="#fff" />}
          title="Coach & Dietician"
          subtitle="Grow your finess business with Supfit"
          onPress={() => handleRoleSelect('coach')}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 SupFit: Your journey to better health starts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcfd',
    justifyContent: 'flex-start',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  logo: {
    width: 320,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 0,
  },
  tagline: {
    fontSize: 19,
    color: '#ff3c20',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.1,
    fontFamily: 'System', // Use system font for Apple-like look
  },
  chooseRole: {
    fontSize: 16,
    color: '#6e6e73',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2.5,
    marginBottom: 22,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    width: 320,
    alignSelf: 'center',
    elevation: 6,
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    marginBottom: 0,
    overflow: 'hidden',
  },
  roleIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 18,
    padding: 16,
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    fontFamily: 'System',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  roleSubtitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '400',
    fontFamily: 'System',
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    paddingTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#6e6e73',
    textAlign: 'center',
  },
});
