import React, { useMemo } from 'react';
import { View, Pressable, Platform, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// Inline the correct RevenueTracker SVG path (Regular-L) using react-native-svg, scaled and centered for 24x24 alignment


interface IconProps {
  readonly color?: string;
  readonly size?: number;
  readonly active?: boolean;
}


import Svg, { Path } from 'react-native-svg';

// Inline Home SVG as a React Native SVG component (from HomeIcon.svg)
const HomeIcon = React.memo(({ color = '#6e6e73', size = 26, active = false }: IconProps) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path 
        d="M12 0c-0.5 0-1 0.25-1.5 0.75L7.97 3.28l8.83 8.83c1 1 1.5 2 1.5 3V24h3.3c1.6 0 2.4-0.8 2.4-2.4v-8.85c0-1-0.5-2-1.5-3l-9-9C13 0.25 12.5 0 12 0zM6.9 4.34L2.89 8.37 9.6 15.1c1 1 1.5 2 1.5 3V24h5.7v-8.89c-0.03-0.83-0.6-1.46-1.06-1.94L6.91 4.34zm-5.08 5.1l-0.32 0.31c-1 1-1.5 2-1.5 3v8.85C0 23.2 0.8 24 2.4 24h7.2v-5.9c-0.03-0.8-0.56-1.42-1.06-1.95Z" 
        fill={active ? '#ff3c20' : color} 
      />
    </Svg>
  </View>
));
HomeIcon.displayName = 'HomeIcon';

// Inline UserSetting SVG as a React Native SVG component (from UserSetting.svg)
const UserSettingIcon = React.memo(({ color = '#6e6e73', size = 22, active = false }: IconProps) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path 
        d="M11.001833333333334 0a5.489 5.489 0 1 1 0 10.977083333333333 5.489 5.489 0 0 1 0-10.977083333333333zm8.91275 11.9405h-0.027499999999999997l-4.14975-2.0551666666666666a0.6150833333333333 0.6150833333333333 0 0 0-0.8029999999999999 0.24566666666666667 20.540666666666667 20.540666666666667 0 0 1-3.9471666666666665 4.7822499999999994 20.539749999999998 20.539749999999998 0 0 1-3.928833333333333-4.766666666666667 0.6150833333333333 0.6150833333333333 0 0 0-0.8029999999999999-0.24658333333333335l-4.1570833333333335 2.0404999999999998h-0.027499999999999997a0.6150833333333333 0.6150833333333333 0 0 0-0.22733333333333333 0.8268333333333333 26.445833333333333 26.445833333333333 0 0 0 4.170833333333333 5.438583333333333l-0.0018333333333333333 0.0009166666666666666c0.022 0.02291666666666667 0.04583333333333334 0.044 0.06874999999999999 0.06599999999999999 0.3070833333333333 0.3070833333333333 0.6196666666666667 0.6086666666666667 0.9414166666666666 0.89925 0.07425 0.06783333333333333 0.15125 0.13199999999999998 0.22641666666666665 0.19891666666666666 0.28875 0.25483333333333336 0.5793333333333334 0.50875 0.8799999999999999 0.7516666666666666 0.13199999999999998 0.10725 0.27041666666666664 0.20808333333333334 0.40425 0.3125833333333333 0.2539166666666667 0.19799999999999998 0.506 0.3978333333333333 0.76725 0.58575 0.4033333333333333 0.2915 0.814 0.5729166666666666 1.2338333333333333 0.8405833333333333a0.8827499999999999 0.8827499999999999 0 0 0 0.9230833333333331 0.015583333333333334c0.44641666666666663-0.286 0.8818333333333332-0.5866666666666667 1.309-0.8983333333333333 0.06233333333333334-0.04583333333333334 0.121-0.09441666666666666 0.18333333333333335-0.14024999999999999 0.32816666666666666-0.24383333333333335 0.6535833333333333-0.49225 0.9716666666666667-0.7516666666666666 0.2145-0.17416666666666666 0.4216666666666667-0.3575 0.6306666666666666-0.5389999999999999 0.15583333333333335-0.13474999999999998 0.3116666666666667-0.26675 0.4638333333333333-0.4051666666666667 0.27041666666666664-0.24566666666666667 0.5316666666666666-0.4995833333333333 0.7919999999999999-0.75625 0.05591666666666666-0.05499999999999999 0.11641666666666667-0.10816666666666666 0.17233333333333334-0.16408333333333333l-0.0036666666666666666-0.0018333333333333333a26.447666666666667 26.447666666666667 0 0 0 4.184583333333333-5.45325 0.6150833333333333 0.6150833333333333 0 0 0-0.24658333333333335-0.8268333333333333z" 
        fill={active ? '#ff3c20' : color} 
      />
    </Svg>
  </View>
));
UserSettingIcon.displayName = 'UserSettingIcon';

// Inline ClientDetail SVG as a React Native SVG component (Regular-M variant from ClientDetails.svg)
const ClientDetailIcon = React.memo(({ color = '#6e6e73', size = 26, active = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 -50 120 120" fill="none">
    <Path 
      d="M23.125 14.77 Q21 14.77 19.438 13.208 Q17.875 11.645 17.875 9.52 V-3.605 Q17.875 -14.855 24.875 -23.48 Q31.875 -32.105 42.875 -34.48 Q37.875 -30.98 35.125 -25.667 Q32.375 -20.355 32.375 -14.23 V9.52 Q32.375 10.895 32.75 12.27 Q33.125 13.645 34 14.77 H23.125 Z M41.5 14.77 Q39.375 14.77 37.812 13.208 Q36.25 11.645 36.25 9.52 V-14.23 Q36.25 -22.98 42.438 -29.105 Q48.625 -35.23 57.375 -35.23 H81 Q89.75 -35.23 95.875 -29.105 Q102 -22.98 102 -14.23 V-6.23 Q102 2.52 95.875 8.645 Q89.75 14.77 81 14.77 H41.5 Z M60 -45.73 Q51.75 -45.73 46 -51.48 Q40.25 -57.23 40.25 -65.48 Q40.25 -73.73 46 -79.48 Q51.75 -85.23 60 -85.23 Q68.25 -85.23 74 -79.48 Q79.75 -73.73 79.75 -65.48 Q79.75 -57.23 74 -51.48 Q68.25 -45.73 60 -45.73 Z" 
      fill={active ? '#ff3c20' : color} 
    />
  </Svg>
));
ClientDetailIcon.displayName = 'ClientDetailIcon';

// Inline RevenueTracker SVG as a React Native SVG component
const RevenueTrackerIcon = React.memo(({ color = '#ff3c20', size = 26, active = false }: IconProps) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
    <Svg width={size} height={size} viewBox="0 -100 160 160" fill="none">
      <Path d="M29.025 22.82 Q25.155 22.82 22.253 19.918 Q19.35 17.015 19.35 13.145 V-83.605 Q19.35 -87.475 22.253 -90.377 Q25.155 -93.28 29.025 -93.28 H125.775 Q129.645 -93.28 132.548 -90.377 Q135.45 -87.475 135.45 -83.605 V13.145 Q135.45 17.015 132.548 19.918 Q129.645 22.82 125.775 22.82 H29.025 Z M29.025 -4.592 V13.145 Q29.025 13.145 29.025 13.145 Q29.025 13.145 29.025 13.145 H125.775 Q125.775 13.145 125.775 13.145 Q125.775 13.145 125.775 13.145 V-44.26 L85.463 -3.947 L56.921 -32.489 L29.025 -4.592 Z M29.025 -18.299  56.921 -46.195  85.463 -17.654  125.775 -57.966 V-83.605 Q125.775 -83.605 125.775 -83.605 Q125.775 -83.605 125.775 -83.605 H29.025 Q29.025 -83.605 29.025 -83.605 Q29.025 -83.605 29.025 -83.605 V-18.299 Z" fill={active ? '#ff3c20' : color} />
    </Svg>
  </View>
));
RevenueTrackerIcon.displayName = 'RevenueTrackerIcon';

const TAB_HEIGHT = 64;

type FooterNavProps = {
  mode?: 'user' | 'coach';
  navigation?: any;
  currentRoute?: string;
};

export default function FooterNav({ mode = 'user', navigation: navProp, currentRoute: currentRouteProp }: FooterNavProps = {}) {
  const navigationHook = useNavigation<StackNavigationProp<RootStackParamList>>();
  const navigation = navProp || navigationHook;
  const insets = useSafeAreaInsets();

  const currentRoute = useMemo(() => {
    if (currentRouteProp) return currentRouteProp;
    try {
      // @ts-ignore - RN Navigation state
      const state = navigation.getState?.();
      if (state?.routes && typeof state.index === 'number') {
        return state.routes[state.index]?.name as keyof RootStackParamList;
      }
    } catch {}
    return undefined;
  }, [navigation, currentRouteProp]);

  const isActive = (name: keyof RootStackParamList) => currentRoute === name;

  const onNavigate = (name: keyof RootStackParamList) => {
    if (!isActive(name)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      navigation.navigate(name);
    }
  };

  const userContent = (
    <View style={[styles.inner, { height: TAB_HEIGHT + (Platform.OS === 'ios' ? 0 : 6), paddingBottom: insets.bottom }] }>
      <Pressable
        style={[styles.iconBtn, isActive('IndividualHome') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Home"
        onPress={() => onNavigate('IndividualHome')}
      >
        <HomeIcon
          color={isActive('IndividualHome') ? '#ff3c20' : '#6e6e73'}
          size={22}
          active={isActive('IndividualHome')}
        />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, isActive('PlanNative') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Plan"
        onPress={() => onNavigate('PlanNative')}
      >
        <MaterialIcons name="event" size={24} color={isActive('PlanNative') ? '#ff3c20' : '#6e6e73'} />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, isActive('HealthDashboard') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Dashboard"
        onPress={() => onNavigate('HealthDashboard')}
      >
        <Image
          source={require('../../assets/icons/HealthDashboard.png')}
          style={{
            width: 22,
            height: 22,
            tintColor: isActive('HealthDashboard') ? '#ff3c20' : '#6e6e73',
          }}
          resizeMode="contain"
        />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, isActive('UserSettingsNative') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => onNavigate('UserSettingsNative')}
      >
        <UserSettingIcon
          color={isActive('UserSettingsNative') ? '#ff3c20' : '#6e6e73'}
          size={22}
          active={isActive('UserSettingsNative')}
        />
      </Pressable>
    </View>
  );

  const coachContent = (
    <View style={[styles.inner, { height: TAB_HEIGHT + (Platform.OS === 'ios' ? 0 : 6), paddingBottom: insets.bottom }] }>
      <Pressable
        style={[styles.iconBtn, styles.iconBtnFlex, isActive('CoachHome') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Home"
        onPress={() => onNavigate('CoachHome')}
      >
        <HomeIcon
          color={isActive('CoachHome') ? '#ff3c20' : '#6e6e73'}
          size={22}
          active={isActive('CoachHome')}
        />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, styles.iconBtnFlex]}
        accessibilityRole="button"
        accessibilityLabel="Revenue"
        onPress={() => onNavigate('RevenueTracker')}
      >
        <Image
          source={require('../../assets/icons/RevenueTracker.png')}
          style={{
            width: 22,
            height: 22,
            tintColor: isActive('RevenueTracker') ? '#ff3c20' : '#6e6e73',
          }}
          resizeMode="contain"
        />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, styles.iconBtnFlex, isActive('ClientDetail') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Clients"
        onPress={() => onNavigate('ClientDetail')}
      >
        <Image
          source={require('../../assets/icons/Clientdetail.png')}
          style={{
            width: 22,
            height: 22,
            tintColor: isActive('ClientDetail') ? '#ff3c20' : '#6e6e73',
          }}
          resizeMode="contain"
        />
      </Pressable>
      <Pressable
        style={[styles.iconBtn, styles.iconBtnFlex, isActive('Testimonials') && styles.iconBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Testimonials"
        onPress={() => onNavigate('Testimonials')}
      >
        <Image
          source={require('../../assets/icons/Testimonials.png')}
          style={{
            width: 22,
            height: 22,
            tintColor: isActive('Testimonials') ? '#ff3c20' : '#6e6e73',
          }}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );

  const content = mode === 'coach' ? coachContent : userContent;

  // pointerEvents moved to style - Glass + subtle gradient for unique premium feel
  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 40 : 20} tint={Platform.OS === 'ios' ? 'light' : 'default'} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(255,255,255,0.75)", "rgba(255,255,255,0.6)"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.barShadow]} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  barShadow: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'transparent',
    // Replace shadow* with boxShadow for web
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -4px 10px rgba(0,0,0,0.06)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 4,
        }),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconBtn: {
    paddingVertical: 10,
    // Remove horizontal padding for perfect alignment
    // borderRadius: 12, // Remove radius to avoid background shape
  },
  iconBtnFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {},
  // activeCircleBg removed
});
