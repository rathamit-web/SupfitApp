
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const CreateProfileStep1 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = Dimensions.get('window');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    avatar: '',
  });
  const [selectedGender, setSelectedGender] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
    handleInputChange('gender', gender);
  };

  const handleNext = () => {
    navigation.navigate('CreateProfileStep2', { formData });
  };

  return (
    <LinearGradient
      colors={["#e0e7ff", "#f5d0fe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <BlurView intensity={60} tint="light" style={[styles.card, { width: width > 400 ? 370 : '95%' }]}> 
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/images/Supfitlogo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Create Profile</Text>
              <Text style={styles.headerStep}>Step 1 of 3</Text>
            </View>
            <LinearGradient colors={["#ff3c20", "#eee"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.progressBar} />
            <Text style={styles.title}>Let's Get Started</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={v => handleInputChange('name', v)}
                placeholderTextColor="#bdbdbd"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={formData.age}
                onChangeText={v => handleInputChange('age', v.replace(/[^0-9]/g, ''))}
                placeholderTextColor="#bdbdbd"
                keyboardType="numeric"
                returnKeyType="next"
                maxLength={3}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {genders.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.genderBtn, formData.gender === g.value && styles.genderBtnActive]}
                    onPress={() => handleGenderSelect(g.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.genderBtnText, formData.gender === g.value && styles.genderBtnTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, (!formData.name || !formData.age || !formData.gender) && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!formData.name || !formData.age || !formData.gender}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#ff3c20", "#ff6a3c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    minHeight: 420,
    justifyContent: 'flex-start',
  },
  logoWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  logo: {
    width: 150,
    height: 60,
    marginBottom: 8,
    marginTop: 0,
    alignSelf: 'center',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#222',
    letterSpacing: -0.5,
  },
  headerStep: {
    color: '#888',
    fontWeight: '500',
    fontSize: 15,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  title: {
    color: '#ff3c20',
    fontWeight: '800',
    fontSize: 26,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 15,
    marginBottom: 22,
    textAlign: 'center',
  },
  inputWrap: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#222',
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 2,
    width: '100%',
    justifyContent: 'flex-start',
  },
  genderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    marginRight: 8,
  },
  genderBtnActive: {
    borderColor: '#ff3c20',
    backgroundColor: 'rgba(255,60,32,0.08)',
  },
  genderBtnText: {
    color: '#ff3c20',
    fontWeight: '600',
    fontSize: 15,
  },
  genderBtnTextActive: {
    color: '#ff3c20',
    fontWeight: '700',
  },
  nextBtn: {
    width: '100%',
    borderRadius: 16,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnGradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
});

export default CreateProfileStep1;
