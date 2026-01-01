import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';



const features = [
  {
    icon: <MaterialCommunityIcons name="robot" size={24} color="#fff" />, // AI-Powered Dashboard
    title: 'AI-Powered Dashboard',
    description: 'Real-time vitals tracking with AI algorithms.',
  },
  {
    icon: <MaterialIcons name="fitness-center" size={24} color="#fff" />, // Personalized Plans
    title: 'Personalized Plans',
    description: 'Custom workout and diet plans for you.',
  },
  {
    icon: <FontAwesome5 name="user-friends" size={24} color="#fff" />, // For Coaches
    title: 'For Coaches',
    description: 'Manage clients and grow your business.',
  },
  {
    icon: <Ionicons name="shield-checkmark" size={24} color="#fff" />, // Privacy First
    title: 'Privacy First',
    description: 'Enterprise-grade data security.',
  },
];

type RoleCardProps = {
  icon: React.ReactNode;
  title: string;
  role: string;
};
import type { NavigationProp } from '@react-navigation/native';
type RootStackParamList = {
  Auth: { role: string };
};
const RoleCard = ({ icon, title, role }: RoleCardProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.roleCard}
      onPress={() => {
        // You can use AsyncStorage or Context for role persistence if needed
        navigation.navigate('Auth', { role });
      }}
      activeOpacity={0.85}
    >
      <View style={styles.roleIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDesc}>
          {role === 'individual'
            ? 'AI-powered fitness tracking'
            : 'Grow your fitness business with Supfit'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={28} color="#fff" />
    </TouchableOpacity>
  );
};

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};
const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIcon}>{icon}</View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </View>
);

const Landingpage = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{color: 'red', fontSize: 20}}>Landingpage loaded</Text>
      <View style={styles.card}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.heading}>Fuel your fitness, powered by AI</Text>
        <Text style={styles.subheading}>Choose Your Role</Text>
        <View style={{ width: '100%', gap: 12 }}>
          <RoleCard
            icon={<MaterialIcons name="person" size={24} color="#fff" />}
            title="Individual User"
            role="individual"
          />
          <RoleCard
            icon={<FontAwesome5 name="user-check" size={24} color="#fff" />}
            title="Coach & Dietician"
            role="coach"
          />
        </View>
        <View style={styles.featuresGrid}>
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </View>
        <Text style={styles.footer}>© 2024 SupFit. Your journey to better health starts here.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e7ff', // fallback for gradient
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 60,
    marginBottom: 12,
  },
  heading: {
    fontWeight: '700',
    fontSize: 22,
    color: '#FF3C20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontWeight: '600',
    fontSize: 18,
    color: '#1d1d1f',
    marginBottom: 18,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3C20',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#FF3C20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  roleIcon: {
    backgroundColor: '#FF3C20',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  roleTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: '#fff',
  },
  roleDesc: {
    fontSize: 13,
    color: '#fff',
    marginTop: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  featureCard: {
    width: 150,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    alignItems: 'center',
    padding: 14,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIcon: {
    backgroundColor: '#FF3C20',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  featureTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1d1d1f',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6e6e73',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#6e6e73',
    fontSize: 12,
    marginTop: 18,
  },
});

export default Landingpage;
