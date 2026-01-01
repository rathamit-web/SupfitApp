

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';

const heightUnits = [
  { label: 'cm', value: 'cm' },
  { label: 'ft', value: 'ft' },
];
const weightUnits = [
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
];

const CreateProfileStep2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = Dimensions.get('window');
  const prevFormData = route.params?.formData || {};
  const [formData, setFormData] = useState({
    ...prevFormData,
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (field: 'heightUnit' | 'weightUnit', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    navigation.navigate('CreateProfileStep3', { formData });
  };
  const handleBack = () => {
    navigation.goBack();
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
            <Text style={styles.title}>A Little About You</Text>
            <Text style={styles.subtitle}>This helps us tailor recommendations and connect you with the right clients.</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.unitRow}>
                {heightUnits.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    style={[styles.unitBtn, formData.heightUnit === u.value && styles.unitBtnActive]}
                    onPress={() => handleUnitChange('heightUnit', u.value)}
                  >
                    <Text style={[styles.unitBtnText, formData.heightUnit === u.value && styles.unitBtnTextActive]}>{u.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder={`Enter height in ${formData.heightUnit}`}
                value={formData.height}
                onChangeText={v => handleInputChange('height', v.replace(/[^0-9.]/g, ''))}
                placeholderTextColor="#bdbdbd"
                keyboardType="numeric"
                returnKeyType="next"
                maxLength={5}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.unitRow}>
                {weightUnits.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    style={[styles.unitBtn, formData.weightUnit === u.value && styles.unitBtnActive]}
                    onPress={() => handleUnitChange('weightUnit', u.value)}
                  >
                    <Text style={[styles.unitBtnText, formData.weightUnit === u.value && styles.unitBtnTextActive]}>{u.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder={`Enter weight in ${formData.weightUnit}`}
                value={formData.weight}
                onChangeText={v => handleInputChange('weight', v.replace(/[^0-9.]/g, ''))}
                placeholderTextColor="#bdbdbd"
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={5}
              />
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.85}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, (!formData.height || !formData.weight) && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={!formData.height || !formData.weight}
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
            </View>
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
    minHeight: 340,
    justifyContent: 'flex-start',
  },
  title: {
    color: '#ff3c20',
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 15,
    marginBottom: 18,
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
  unitRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 2,
    width: '100%',
    justifyContent: 'flex-start',
  },
  unitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    marginRight: 8,
  },
  unitBtnActive: {
    borderColor: '#ff3c20',
    backgroundColor: 'rgba(255,60,32,0.08)',
  },
  unitBtnText: {
    color: '#ff3c20',
    fontWeight: '600',
    fontSize: 15,
  },
  unitBtnTextActive: {
    color: '#ff3c20',
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#fff6f3',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtnText: {
    color: '#ff3c20',
    fontWeight: '700',
    fontSize: 17,
  },
  nextBtn: {
    flex: 1,
    borderRadius: 16,
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

export default CreateProfileStep2;
