/**
 * Filter Sheet Component
 * Bottom sheet modal for advanced search filtering on professional directory
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Slider,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';
import type { DirectorySearchFilters } from '@/types/phase2';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: DirectorySearchFilters;
  onFiltersChange: (filters: DirectorySearchFilters) => void;
  onApply?: () => void;
}

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_COLOR = '#4ECDC4';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BORDER_COLOR = '#E0E0E0';

const SPECIALTIES = [
  'Weight Loss',
  'Muscle Gain',
  'Strength Training',
  'Endurance',
  'Flexibility',
  'Sports Training',
  'Nutrition',
  'Medical',
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
];

const MODES = [
  { id: 'in-person', label: 'In-Person' },
  { id: 'online', label: 'Online' },
  { id: 'hybrid', label: 'Hybrid' },
];

export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onApply,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleModeToggle = (mode: 'in-person' | 'online' | 'hybrid') => {
    const updated = localFilters.preferredMode.includes(mode)
      ? localFilters.preferredMode.filter((m) => m !== mode)
      : [...localFilters.preferredMode, mode];
    setLocalFilters({ ...localFilters, preferredMode: updated });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const updated = localFilters.goalCategories.includes(specialty)
      ? localFilters.goalCategories.filter((g) => g !== specialty)
      : [...localFilters.goalCategories, specialty];
    setLocalFilters({ ...localFilters, goalCategories: updated });
  };

  const handleLanguageToggle = (langCode: string) => {
    const updated = localFilters.preferredLanguages.includes(langCode)
      ? localFilters.preferredLanguages.filter((l) => l !== langCode)
      : [...localFilters.preferredLanguages, langCode];
    setLocalFilters({ ...localFilters, preferredLanguages: updated });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    if (onApply) onApply();
    onClose();
  };

  const handleReset = () => {
    const resetFilters: DirectorySearchFilters = {
      searchQuery: '',
      goalCategories: [],
      preferredMode: [],
      preferredLanguages: [],
      minRating: 0,
      maxPrice: 50000,
      radiusKm: 10,
      sortBy: 'rating',
    };
    setLocalFilters(resetFilters);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      />

      {/* Filter Sheet */}
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <X size={24} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price per Month</Text>
            <View style={styles.priceDisplay}>
              <Text style={styles.priceText}>
                ₹{localFilters.minRating} - ₹{localFilters.maxPrice}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50000}
              step={1000}
              value={localFilters.maxPrice}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, maxPrice: value })
              }
              minimumTrackTintColor={PRIMARY_COLOR}
              maximumTrackTintColor={BORDER_COLOR}
            />
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <View style={styles.ratingRow}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <Text style={styles.ratingValue}>{localFilters.minRating.toFixed(1)} ⭐</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.5}
              value={localFilters.minRating}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, minRating: value })
              }
              minimumTrackTintColor={PRIMARY_COLOR}
              maximumTrackTintColor={BORDER_COLOR}
            />
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.radiusRow}>
              <Text style={styles.sectionTitle}>Distance Radius</Text>
              <Text style={styles.radiusValue}>{localFilters.radiusKm.toFixed(0)} km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={localFilters.radiusKm}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, radiusKm: value })
              }
              minimumTrackTintColor={PRIMARY_COLOR}
              maximumTrackTintColor={BORDER_COLOR}
            />
          </View>

          {/* Service Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Mode</Text>
            <View style={styles.badgeGrid}>
              {MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.badgeButton,
                    localFilters.preferredMode.includes(mode.id as any) && styles.badgeButtonActive,
                  ]}
                  onPress={() => handleModeToggle(mode.id as any)}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      localFilters.preferredMode.includes(mode.id as any) && styles.badgeTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.badgeGrid}>
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.badgeButton,
                    localFilters.goalCategories.includes(specialty) && styles.badgeButtonActive,
                  ]}
                  onPress={() => handleSpecialtyToggle(specialty)}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      localFilters.goalCategories.includes(specialty) && styles.badgeTextActive,
                    ]}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.badgeGrid}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.badgeButton,
                    localFilters.preferredLanguages.includes(lang.code) && styles.badgeButtonActive,
                  ]}
                  onPress={() => handleLanguageToggle(lang.code)}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      localFilters.preferredLanguages.includes(lang.code) && styles.badgeTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  sheet: {
    flex: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  // ========== Header ==========
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  // ========== Content ==========
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 12,
  },

  // ========== Price ==========
  priceDisplay: {
    backgroundColor: '#F5F6F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },

  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },

  // ========== Slider ==========
  slider: {
    width: '100%',
    height: 40,
  },

  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },

  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  radiusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },

  // ========== Badges ==========
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  badgeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: '#F5F6F7',
  },

  badgeButtonActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },

  badgeText: {
    fontSize: 12,
    color: TEXT_DARK,
    fontWeight: '500',
  },

  badgeTextActive: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },

  // ========== Footer ==========
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },

  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },

  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
