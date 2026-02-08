import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { saveSubscription, SUBSCRIPTION_KEYS } from '../lib/subscriptionStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

type GoalCategory = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'yoga_stretching'
  | 'posture_therapy'
  | 'pilates'
  | 'nutrition_coaching'
  | 'core_strength';

interface GoalCategoryInfo {
  id: GoalCategory;
  label: string;
  icon: string;
}

const GOAL_CATEGORIES: GoalCategoryInfo[] = [
  { id: 'weight_loss', label: 'Weight Loss', icon: 'monitor-weight' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness-center' },
  { id: 'yoga_stretching', label: 'Yoga & Stretching', icon: 'self-improvement' },
  { id: 'posture_therapy', label: 'Posture Therapy', icon: 'accessibility' },
  { id: 'pilates', label: 'Pilates', icon: 'meditation' },
  { id: 'nutrition_coaching', label: 'Nutrition Specialist', icon: 'restaurant' },
  { id: 'core_strength', label: 'Core Strength', icon: 'filter-center-focus' },
];

interface DieticianPackage {
  id: number;
  name: string;
  duration: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
}

interface Dietician {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
  clients: number;
  image: string;
  location: string;
  distance?: string;
  mode: string[];
  certifications: string[];
  packages: DieticianPackage[];
  bio: string;
  matchScore?: number;
}

const dieticians: Dietician[] = [
  {
    id: 1,
    name: 'Priya Sharma',
    specialty: 'Clinical Nutrition',
    experience: '10 years',
    rating: 4.9,
    reviews: 210,
    clients: 120,
    image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80',
    location: 'Sector 44, Noida',
    distance: '1.8 km',
    mode: ['Online', 'Offline'],
    certifications: ['M.Sc. Nutrition', 'Registered Dietician'],
    bio: 'Expert in weight management, diabetes, and sports nutrition. Helped 500+ clients achieve their health goals.',
    packages: [
      {
        id: 1,
        name: 'Weight Loss Plan',
        duration: '1 Month',
        monthlyPrice: '₹1,499',
        yearlyPrice: '₹14,999',
        features: ['Personalized Diet', 'Weekly Check-ins', 'WhatsApp Support'],
      },
      {
        id: 2,
        name: 'Diabetes Care',
        duration: '3 Months',
        monthlyPrice: '₹1,299',
        yearlyPrice: '₹12,999',
        features: ['Glycemic Control', 'Meal Planning', 'Progress Tracking'],
      },
    ],
  },
  {
    id: 2,
    name: 'Amit Verma',
    specialty: 'Sports Nutrition',
    experience: '7 years',
    rating: 4.8,
    reviews: 98,
    clients: 60,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
    location: 'Sector 63, Noida',
    distance: '2.4 km',
    mode: ['Online'],
    certifications: ['ISSA Certified', 'Sports Nutritionist'],
    bio: 'Specialist in sports and performance nutrition. Helped 200+ athletes optimize their diet.',
    packages: [
      {
        id: 1,
        name: 'Athlete Plan',
        duration: '1 Month',
        monthlyPrice: '₹1,999',
        yearlyPrice: '₹19,999',
        features: ['Performance Diet', 'Supplement Guidance', 'Weekly Review'],
      },
    ],
  },
];

const SelectDieticianNative = ({ route }: any) => {
  const navigation = useNavigation();
  const [selectedDietician, setSelectedDietician] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [selectedGoals, setSelectedGoals] = useState<GoalCategory[]>([]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const subscription = await AsyncStorage.getItem(SUBSCRIPTION_KEYS.dietician);
        setHasActiveSubscription(!!subscription);
      } catch {
        setHasActiveSubscription(false);
      }
    };
    checkSubscriptionStatus();
  }, []);

  const handleSelectDietician = (dieticianId: number) => {
    setSelectedDietician(dieticianId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = () => {
    if (!selectedDietician || !selectedPackage) return;
    setShowPaymentModal(true);
  };

  const calculateMatchScore = (dietician: Dietician): number => {
    let score = (dietician.rating / 5) * 50;
    
    if (dietician.reviews >= 50) score += 10;
    else if (dietician.reviews >= 20) score += 7;
    else if (dietician.reviews >= 5) score += 4;
    
    if (dietician.mode.includes('Online')) score += 15;
    
    if (selectedGoals.length > 0) score += 10;
    
    return Math.round(Math.min(score, 100));
  };

  const dieticiansWithScores = dieticians.map(dietician => ({
    ...dietician,
    matchScore: calculateMatchScore(dietician),
  })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const filteredDieticians = dieticiansWithScores.filter(dietician =>
    searchQuery === '' ? true : 
    dietician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dietician.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dietician.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dietician.mode.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePaymentConfirm = async () => {
    if (!selectedDietician || !selectedPackage) return;
    setIsProcessing(true);
    const dietician = dieticians.find(d => d.id === selectedDietician);
    const pkg = dietician?.packages.find(p => p.id === selectedPackage);
    // Save to AsyncStorage
    await saveSubscription('dietician', {
      name: dietician?.name,
      status: 'paid',
      amount: pkg?.monthlyPrice || pkg?.yearlyPrice,
      validUpto: '2025-12-31', // Example, should be calculated
      packageName: pkg?.name,
    });
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <LinearGradient colors={["#f8f9fa", "#f5f5f7"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={styles.title}>Select Your Dietician</Text>
          <TouchableOpacity onPress={() => setShowSearchModal(true)} style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Goal Criteria Section */}
        <View style={styles.goalsSection}>
          <Text style={styles.goalsSectionTitle}>Select Your Goals</Text>
          <View style={styles.goalsGrid}>
            {GOAL_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(category.id) && styles.goalButtonSelected,
                ]}
                onPress={() => {
                  setSelectedGoals((prev) =>
                    prev.includes(category.id)
                      ? prev.filter((g) => g !== category.id)
                      : [...prev, category.id]
                  );
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={24}
                  color={selectedGoals.includes(category.id) ? '#ff3c20' : '#999'}
                />
                <Text
                  style={[
                    styles.goalButtonText,
                    selectedGoals.includes(category.id) && styles.goalButtonTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredDieticians.map((dietician) => (
          <View key={dietician.id} style={[styles.card, selectedDietician === dietician.id && styles.cardSelected]}>
            {/* Match Score Badge */}
            {dietician.matchScore !== undefined && (
              <View style={[
                styles.matchScoreBadge,
                dietician.matchScore! >= 85 && styles.matchScoreBadgeExcellent,
                dietician.matchScore! >= 60 && dietician.matchScore! < 85 && styles.matchScoreBadgeGood,
                dietician.matchScore! < 60 && styles.matchScoreBadgeFair,
              ]}>
                <Text style={styles.matchScoreText}>🎯 {dietician.matchScore}%</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => handleSelectDietician(dietician.id)} activeOpacity={0.85} style={{ flexDirection: 'row' }}>
              <Image source={{ uri: dietician.image }} style={styles.dieticianImage} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.dieticianName}>{dietician.name}</Text>
                <Text style={styles.dieticianMeta}>{dietician.specialty} • {dietician.experience}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialIcons name="star" size={18} color="#ffb300" />
                  <Text style={styles.dieticianRating}>{dietician.rating}</Text>
                  <Text style={styles.dieticianReviews}>({dietician.reviews} reviews)</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                  {dietician.certifications.map((c) => (
                    <View key={c} style={styles.certTag}>
                      <Text style={styles.certText}>{c}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.dieticianBio}>{dietician.bio}</Text>
              </View>
            </TouchableOpacity>
            {selectedDietician === dietician.id && (
              <View style={styles.packagesWrap}>
                <Text style={styles.packagesTitle}>Packages</Text>
                {dietician.packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.packageCard, selectedPackage === pkg.id && styles.packageCardSelected]}
                    onPress={() => handleSelectPackage(pkg.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.packageName}>{pkg.name} ({pkg.duration})</Text>
                    <Text style={styles.packagePrice}>Monthly: {pkg.monthlyPrice} | Yearly: {pkg.yearlyPrice}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                      {pkg.features.map((f) => (
                        <View key={f} style={styles.featureTag}>
                          <Text style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.subscribeBtn, (!selectedPackage || isProcessing) && styles.subscribeBtnDisabled]}
                  onPress={handleSubscribe}
                  disabled={!selectedPackage || isProcessing}
                >
                  <Text style={styles.subscribeBtnText}>{isProcessing ? 'Processing...' : 'Subscribe'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* Search Modal */}
      <Modal visible={showSearchModal} transparent animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Search Dieticians</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <MaterialIcons name="close" size={24} color="#1d1d1f" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#6e6e73" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, specialty, or location..."
                placeholderTextColor="#c7c7cc"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color="#6e6e73" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.searchResults}>
              {filteredDieticians.length > 0 ? (
                filteredDieticians.map((dietician) => (
                  <TouchableOpacity
                    key={dietician.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      handleSelectDietician(dietician.id);
                      setShowSearchModal(false);
                      setSearchQuery('');
                    }}
                  >
                    <Image source={{ uri: dietician.image }} style={styles.searchResultImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.searchResultName}>{dietician.name}</Text>
                      <Text style={styles.searchResultMeta}>{dietician.specialty} • {dietician.location}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <MaterialIcons name="star" size={14} color="#ffb300" />
                        <Text style={styles.searchResultRating}>{dietician.rating} ({dietician.reviews})</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#c7c7cc" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No dieticians found matching "{searchQuery}"</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalDesc}>Proceed to pay and activate your subscription.</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={handlePaymentConfirm} disabled={isProcessing}>
              <Text style={styles.confirmBtnText}>{isProcessing ? 'Processing...' : 'Pay & Subscribe'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPaymentModal(false)} disabled={isProcessing}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', color: '#1d1d1f', marginBottom: 18, textAlign: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, marginBottom: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardSelected: { borderWidth: 2, borderColor: '#ff3c20' },
  dieticianImage: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#eee' },
  dieticianName: { fontSize: 18, fontWeight: '700', color: '#1d1d1f' },
  dieticianMeta: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  dieticianRating: { fontSize: 15, fontWeight: '700', color: '#ffb300', marginLeft: 4 },
  dieticianReviews: { fontSize: 12, color: '#6e6e73', marginLeft: 4 },
  certTag: { backgroundColor: 'rgba(32,120,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, marginBottom: 4 },
  certText: { fontSize: 12, color: '#2078ff' },
  dieticianBio: { fontSize: 13, color: '#6e6e73', marginTop: 6 },
  packagesWrap: { marginTop: 16, backgroundColor: 'rgba(245,245,247,0.95)', borderRadius: 14, padding: 14 },
  packagesTitle: { fontSize: 16, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  packageCard: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  packageCardSelected: { borderColor: '#ff3c20', borderWidth: 2 },
  packageName: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  packagePrice: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  featureTag: { backgroundColor: 'rgba(255,60,32,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, marginBottom: 4 },
  featureText: { fontSize: 12, color: '#ff3c20' },
  subscribeBtn: { backgroundColor: '#ff3c20', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  subscribeBtnDisabled: { backgroundColor: '#ffb3a1' },
  subscribeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: '#6e6e73', marginBottom: 18, textAlign: 'center' },
  confirmBtn: { backgroundColor: '#ff3c20', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { backgroundColor: '#eee', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 32, alignItems: 'center' },
  cancelBtnText: { color: '#1d1d1f', fontWeight: '600', fontSize: 15 },
  searchButton: { backgroundColor: '#ff3c20', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  searchModalContent: { backgroundColor: '#fff', borderRadius: 20, flex: 0.9, marginHorizontal: 16, marginVertical: 40, flexDirection: 'column', padding: 0, overflow: 'hidden' },
  searchModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchModalTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f5f5f7', marginHorizontal: 16, marginVertical: 12, borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1d1d1f', marginHorizontal: 8, paddingVertical: 8 },
  searchResults: { flex: 1, paddingHorizontal: 16 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f7' },
  searchResultImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#eee' },
  searchResultName: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  searchResultMeta: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  searchResultRating: { fontSize: 12, color: '#6e6e73', marginLeft: 4 },
  noResultsText: { textAlign: 'center', fontSize: 15, color: '#6e6e73', marginTop: 32 },
  goalsSection: { marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: 16 },
  goalsSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalButton: { width: '48%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#f5f5f7', marginBottom: 8 },
  goalButtonSelected: {},
  goalButtonText: { fontSize: 12, color: '#6e6e73', marginTop: 6, textAlign: 'center' },
  goalButtonTextSelected: { fontWeight: '600' },
  matchScoreBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,60,32,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, zIndex: 10 },
  matchScoreBadgeExcellent: { backgroundColor: 'rgba(76, 175, 80, 0.9)' },
  matchScoreBadgeGood: { backgroundColor: 'rgba(255, 193, 7, 0.9)' },
  matchScoreBadgeFair: { backgroundColor: 'rgba(244, 67, 54, 0.9)' },
  matchScoreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default SelectDieticianNative;
