



import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';


const consentPoints = [
  'My health, personal, and smartwatch data will be used only for tracking and analysis.',
  'My information will not be shared or sold, except as required by law.',
  'The app follows HIPAA and data protection standards to keep my information secure.',
  'I may withdraw consent or request deletion of my data at any time.',
];

export default function CreateProfileStep3() {
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');

  const handleContinue = () => {
    // You can navigate to the next screen or home here
    navigation.navigate('IndividualHome');
  };

  return (
    <LinearGradient
      colors={["#e0e7ff", "#f5d0fe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { width: width > 400 ? 370 : '95%' }]}> 
          <Text style={styles.title}>User Data Consent & Privacy Notice</Text>
          <Text style={styles.italicText}>“Your data, your control — always secure.”</Text>
          <View style={styles.consentBox}>
            <Text style={styles.consentIntro}>By continuing, I agree that:</Text>
            {consentPoints.map((point, idx) => (
              <Text key={idx} style={styles.consentPoint}>• {point}</Text>
            ))}
            <View style={styles.consentFinalRow}>
              <Text style={styles.checkIcon}>☑️</Text>
              <Text style={styles.consentFinalText}>I have read and consent to the collection and use of my data as described.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.buttonWrap} activeOpacity={0.9} onPress={handleContinue}>
            <LinearGradient
              colors={["#ff3c20", "#ff6a3c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
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
    fontSize: 22,
    marginBottom: 12,
    marginTop: 0,
    textAlign: 'center',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#ff3c20',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  consentBox: {
    marginBottom: 16,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 14,
  },
  consentIntro: {
    color: '#444',
    fontSize: 15,
    marginBottom: 8,
  },
  consentPoint: {
    color: '#444',
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 8,
  },
  consentFinalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#ff3c20',
  },
  consentFinalText: {
    color: '#ff3c20',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  buttonWrap: {
    width: '100%',
    maxWidth: 220,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 32,
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
