import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FooterNav from '../components/FooterNav';

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isActive: boolean;
}

interface EditingPackage extends Package {
  newFeature: string;
}

const CoachSubscriptionNative = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      name: 'Basic Package',
      price: 999,
      description: 'Perfect for beginners',
      features: ['Personalized workout plans', 'Weekly check-ins', 'Email support'],
      isActive: true,
    },
    {
      id: '2',
      name: 'Premium Package',
      price: 1999,
      description: 'For serious fitness enthusiasts',
      features: [
        'Personalized workout plans',
        'Weekly check-ins',
        'Video call consultations',
        'Nutrition guidance',
        'Priority support',
      ],
      isActive: false,
    },
    {
      id: '3',
      name: 'Elite Package',
      price: 2999,
      description: 'The ultimate coaching experience',
      features: [
        'All Premium features',
        'Daily personalized coaching',
        'Supplement recommendations',
        '24/7 support',
        'Progress tracking analytics',
      ],
      isActive: false,
    },
  ]);

  const [editingPackage, setEditingPackage] = useState<EditingPackage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const togglePackage = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id ? { ...pkg, isActive: !pkg.isActive } : pkg
      )
    );
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage({ ...pkg, newFeature: '' });
    setShowEditModal(true);
  };

  const savePackageChanges = () => {
    if (!editingPackage) return;

    if (!editingPackage.name.trim()) {
      Alert.alert('Missing Details', 'Package name is required.');
      return;
    }

    if (editingPackage.price <= 0) {
      Alert.alert('Missing Details', 'Price must be greater than 0.');
      return;
    }

    if (editingPackage.features.length === 0) {
      Alert.alert('Missing Details', 'Add at least one feature.');
      return;
    }

    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === editingPackage.id
          ? {
              id: pkg.id,
              name: editingPackage.name,
              price: editingPackage.price,
              description: editingPackage.description,
              features: editingPackage.features,
              isActive: pkg.isActive,
            }
          : pkg
      )
    );

    setShowEditModal(false);
    setEditingPackage(null);
    Alert.alert('Package Updated', 'Package updated successfully.');
  };

  const addFeature = () => {
    if (!editingPackage) return;

    const newFeature = editingPackage.newFeature.trim();
    if (!newFeature) {
      Alert.alert('Invalid Feature', 'Feature cannot be empty.');
      return;
    }

    setEditingPackage({
      ...editingPackage,
      features: [...editingPackage.features, newFeature],
      newFeature: '',
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      features: editingPackage.features.filter((_, i) => i !== index),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={28} color="#ff3c20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscription Packages</Text>
          <Text style={styles.headerSubtitle}>Customize packages for your clients</Text>
        </View>

        {/* Packages List */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <View>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                </View>
                <Switch
                  value={pkg.isActive}
                  onValueChange={() => togglePackage(pkg.id)}
                  trackColor={{ false: '#e5e5ea', true: '#ff3c20' }}
                  thumbColor={pkg.isActive ? '#ff3c20' : '#f4f4f4'}
                />
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{pkg.price}</Text>
                <Text style={styles.priceLabel}>per month</Text>
              </View>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features:</Text>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#34c759"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.editBtn}
                onPress={() => openEditModal(pkg)}
              >
                <MaterialIcons
                  name="edit"
                  size={18}
                  color="#ff3c20"
                  style={styles.buttonIcon}
                />
                <Text style={styles.editBtnText}>Edit Package</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add New Package Button */}
        <TouchableOpacity style={styles.addPackageBtn}>
          <MaterialIcons
            name="add"
            size={24}
            color="#ffffff"
            style={styles.buttonIcon}
          />
          <Text style={styles.addPackageBtnText}>Add New Package</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Package Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Package</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={24} color="#1d1d1f" />
                </TouchableOpacity>
              </View>

              {editingPackage && (
                <>
                  {/* Package Name */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Package Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingPackage.name}
                      onChangeText={(text) =>
                        setEditingPackage({ ...editingPackage, name: text })
                      }
                      placeholder="e.g., Basic, Premium, Elite"
                      placeholderTextColor="#9a9a9a"
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.textInput, { minHeight: 80 }]}
                      value={editingPackage.description}
                      onChangeText={(text) =>
                        setEditingPackage({ ...editingPackage, description: text })
                      }
                      placeholder="Short description of the package"
                      placeholderTextColor="#9a9a9a"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Price */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Price (₹) *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingPackage.price.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        setEditingPackage({
                          ...editingPackage,
                          price: isNaN(num) ? 0 : num,
                        });
                      }}
                      placeholder="Enter price"
                      placeholderTextColor="#9a9a9a"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Features Section */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Features *</Text>

                    {/* Features List */}
                    {editingPackage.features.length > 0 && (
                      <View style={styles.featuresList}>
                        {editingPackage.features.map((feature, idx) => (
                          <View key={idx} style={styles.featureChip}>
                            <Text style={styles.featureChipText} numberOfLines={1}>
                              {feature}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeFeature(idx)}
                              style={styles.removeFeatureBtn}
                            >
                              <MaterialIcons name="close" size={16} color="#ff3c20" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add Feature Input */}
                    <View style={styles.addFeatureContainer}>
                      <TextInput
                        style={styles.addFeatureInput}
                        value={editingPackage.newFeature}
                        onChangeText={(text) =>
                          setEditingPackage({ ...editingPackage, newFeature: text })
                        }
                        placeholder="Add a new feature"
                        placeholderTextColor="#9a9a9a"
                      />
                      <TouchableOpacity
                        style={styles.addFeatureBtn}
                        onPress={addFeature}
                      >
                        <MaterialIcons name="add" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowEditModal(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={savePackageChanges}
                    >
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <FooterNav mode="coach" navigation={navigation} currentRoute="CoachSubscription" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 12,
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#1d1d1f',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6e6e73',
    fontWeight: '500',
  },
  packagesContainer: {
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '400',
  },
  priceContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff3c20',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6e6e73',
    fontWeight: '500',
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '400',
  },
  featureIcon: {
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 60, 32, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 32, 0.2)',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3c20',
  },
  addPackageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addPackageBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalContent: {
    padding: 20,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  modalCloseBtn: {
    padding: 8,
    marginRight: -8,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#f9f9fb',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    marginRight: 8,
    marginBottom: 8,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1d1d1f',
    marginRight: 6,
    maxWidth: 150,
  },
  removeFeatureBtn: {
    padding: 4,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFeatureInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#f9f9fb',
    marginRight: 8,
  },
  addFeatureBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    backgroundColor: '#f9f9fb',
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CoachSubscriptionNative;
