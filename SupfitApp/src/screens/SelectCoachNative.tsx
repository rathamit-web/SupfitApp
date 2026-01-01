import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { saveSubscription } from '../lib/subscriptionStorage';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface CoachPackage {
  id: number;
  name: string;
  duration: string;
  monthlyPrice: string;
  yearlyPrice: string;
  sessions: number;
  features: string[];
}

interface Coach {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
  clients: number;
  image: string;
  location: string;
  mode: string[];
  certifications: string[];
  packages: CoachPackage[];
  bio: string;
}

const coaches: Coach[] = [
  {
    id: 1,
    name: 'John Martinez',
    specialty: 'Strength & Conditioning',
    experience: '8 years',
    rating: 4.9,
    reviews: 156,
    clients: 48,
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
    location: 'Sector 18, Noida',
    mode: ['Online', 'Offline'],
    certifications: ['ACE Certified', 'NASM CPT', 'Sports Nutrition'],
    bio: 'Specialized in strength training and body transformation. Helped 200+ clients achieve their fitness goals.',
    packages: [
      {
        id: 1,
        name: 'Starter Pack',
        duration: '1 Month',
        monthlyPrice: '₹2,999',
        yearlyPrice: '₹29,999',
        sessions: 4,
        features: ['4 Sessions', 'Personalized Plan', 'Progress Tracking'],
      },
      {
        id: 2,
        name: 'Pro Pack',
        duration: '3 Months',
        monthlyPrice: '₹2,499',
        yearlyPrice: '₹24,999',
        sessions: 12,
        features: ['12 Sessions', 'Diet Guidance', 'Progress Tracking', 'WhatsApp Support'],
      },
    ],
  },
  {
    id: 2,
    name: 'Sarah Lee',
    specialty: 'Yoga & Meditation',
    experience: '6 years',
    rating: 4.8,
    reviews: 98,
    clients: 32,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    location: 'Sector 62, Noida',
    mode: ['Online'],
    certifications: ['Yoga Alliance', 'Mindfulness Coach'],
    bio: 'Yoga and meditation expert. Helped 100+ clients find balance and flexibility.',
    packages: [
      {
        id: 1,
        name: 'Yoga Starter',
        duration: '1 Month',
        monthlyPrice: '₹1,999',
        yearlyPrice: '₹19,999',
        sessions: 8,
        features: ['8 Sessions', 'Guided Meditation', 'Flexibility Training'],
      },
    ],
  },
];

const SelectCoachNative = () => {
  const navigation = useNavigation();
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectCoach = (coachId: number) => {
    setSelectedCoach(coachId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = () => {
    if (!selectedCoach || !selectedPackage) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedCoach || !selectedPackage) return;
    setIsProcessing(true);
    const coach = coaches.find(c => c.id === selectedCoach);
    const pkg = coach?.packages.find(p => p.id === selectedPackage);
    // Save to AsyncStorage
    await saveSubscription('coach', {
      name: coach?.name,
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
        <Text style={styles.title}>Select Your Coach</Text>
        {coaches.map((coach) => (
          <View key={coach.id} style={[styles.card, selectedCoach === coach.id && styles.cardSelected]}>
            <TouchableOpacity onPress={() => handleSelectCoach(coach.id)} activeOpacity={0.85} style={{ flexDirection: 'row' }}>
              <Image source={{ uri: coach.image }} style={styles.coachImage} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.coachName}>{coach.name}</Text>
                <Text style={styles.coachMeta}>{coach.specialty} • {coach.experience}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MaterialIcons name="star" size={18} color="#ffb300" />
                  <Text style={styles.coachRating}>{coach.rating}</Text>
                  <Text style={styles.coachReviews}>({coach.reviews} reviews)</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                  {coach.certifications.map((c) => (
                    <View key={c} style={styles.certTag}>
                      <Text style={styles.certText}>{c}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.coachBio}>{coach.bio}</Text>
              </View>
            </TouchableOpacity>
            {selectedCoach === coach.id && (
              <View style={styles.packagesWrap}>
                <Text style={styles.packagesTitle}>Packages</Text>
                {coach.packages.map((pkg) => (
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
  coachImage: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#eee' },
  coachName: { fontSize: 18, fontWeight: '700', color: '#1d1d1f' },
  coachMeta: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  coachRating: { fontSize: 15, fontWeight: '700', color: '#ffb300', marginLeft: 4 },
  coachReviews: { fontSize: 12, color: '#6e6e73', marginLeft: 4 },
  certTag: { backgroundColor: 'rgba(32,120,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, marginBottom: 4 },
  certText: { fontSize: 12, color: '#2078ff' },
  coachBio: { fontSize: 13, color: '#6e6e73', marginTop: 6 },
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
});

export default SelectCoachNative;
