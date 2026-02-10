/**
 * Search Header Component
 * Provides search input and quick filter options for professional directory
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Search, Filter, X, ChevronDown } from 'lucide-react-native';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  activeFiltersCount?: number;
  sortBy?: 'rating' | 'price' | 'distance';
  onSortChange?: (sort: 'rating' | 'price' | 'distance') => void;
}

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_COLOR = '#4ECDC4';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BORDER_COLOR = '#E0E0E0';

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onFilterPress,
  activeFiltersCount = 0,
  sortBy = 'rating',
  onSortChange,
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions = [
    { key: 'rating', label: 'Top Rated' },
    { key: 'price', label: 'Price: Low to High' },
    { key: 'distance', label: 'Nearest First' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={TEXT_LIGHT} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search skills or specialties..."
            placeholderTextColor={TEXT_LIGHT}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <X size={16} color={TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Filter size={18} color={activeFiltersCount > 0 ? PRIMARY_COLOR : TEXT_LIGHT} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        
        <Pressable
          style={styles.sortDropdown}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortDropdownText}>
            {sortOptions.find((o) => o.key === sortBy)?.label || 'Top Rated'}
          </Text>
          <ChevronDown
            size={14}
            color={TEXT_LIGHT}
            style={{ transform: [{ rotate: showSortMenu ? '180deg' : '0deg' }] }}
          />
        </Pressable>

        {/* Sort Menu */}
        {showSortMenu && onSortChange && (
          <View style={styles.sortMenu}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortMenuItem,
                  sortBy === option.key && styles.sortMenuItemActive,
                ]}
                onPress={() => {
                  onSortChange(option.key);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.sortMenuItemText,
                    sortBy === option.key && styles.sortMenuItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },

  // ========== Search Row ==========
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F6F7',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: PRIMARY_COLOR,
  },

  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: PRIMARY_COLOR,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // ========== Sort ==========
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sortLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },

  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F6F7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },

  sortDropdownText: {
    fontSize: 12,
    color: TEXT_DARK,
    fontWeight: '500',
  },

  sortMenu: {
    position: 'absolute',
    top: 90,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  sortMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  sortMenuItemActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },

  sortMenuItemText: {
    fontSize: 13,
    color: TEXT_DARK,
  },

  sortMenuItemTextActive: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
});
