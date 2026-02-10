/**
 * Find Coaches/Professionals Screen
 * Displays searchable directory of professionals with filtering and sorting
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProfessionalSearch } from '@/hooks/phase2';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import { SearchHeader } from '@/components/SearchHeader';
import { FilterSheet } from '@/components/FilterSheet';
import type { DirectorySearchFilters } from '@/types/phase2';

const PRIMARY_COLOR = '#FF6B6B';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BACKGROUND = '#F8F9FA';

export const FindCoachesNative = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // State
  const [filters, setFilters] = useState<DirectorySearchFilters>({
    searchQuery: '',
    goalCategories: [],
    preferredMode: [],
    preferredLanguages: [],
    minRating: 0,
    maxPrice: 50000,
    radiusKm: 10,
    sortBy: 'rating',
  });

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Query data from Supabase
  const { data: professionals, isLoading, error, refetch } = useProfessionalSearch({
    goal_categories: filters.goalCategories.length > 0 ? filters.goalCategories : undefined,
    preferred_mode: filters.preferredMode.length > 0 ? filters.preferredMode : undefined,
    preferred_languages: filters.preferredLanguages.length > 0 ? filters.preferredLanguages : undefined,
    min_rating: filters.minRating,
    max_price: filters.maxPrice,
    radius_km: filters.radiusKm,
    limit: 50,
  });

  // Filter local results by search query and sort
  const filteredResults = useMemo(() => {
    let results = professionals || [];

    // Client-side search filtering
    if (filters.searchQuery.length > 0) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Sorting
    return results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.price - b.price;
        case 'distance':
          return (a.distance_km || 999) - (b.distance_km || 999);
        case 'rating':
        default:
          return b.rating - a.rating || b.review_count - a.review_count;
      }
    });
  }, [professionals, filters.searchQuery, filters.sortBy]);

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleFilterPress = useCallback(() => {
    setShowFilterSheet(true);
  }, []);

  const handleFiltersApply = useCallback((newFilters: DirectorySearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((sort: 'rating' | 'price' | 'distance') => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
  }, []);

  const handleProfessionalPress = useCallback((professionalId: string) => {
    navigation.navigate('ProfessionalProfile', { professionalId });
  }, [navigation]);

  const handleBookmark = useCallback((professionalId: string) => {
    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(professionalId)) {
        updated.delete(professionalId);
      } else {
        updated.add(professionalId);
      }
      return updated;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh professionals');
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Compute active filter count
  const activeFiltersCount =
    (filters.goalCategories.length > 0 ? 1 : 0) +
    (filters.preferredMode.length > 0 ? 1 : 0) +
    (filters.preferredLanguages.length > 0 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.maxPrice < 50000 ? 1 : 0) +
    (filters.radiusKm < 10 ? 1 : 0);

  // Empty State
  if (!isLoading && filteredResults.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
        <SearchHeader
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
          onFilterPress={handleFilterPress}
          activeFiltersCount={activeFiltersCount}
          sortBy={filters.sortBy}
          onSortChange={handleSortChange}
        />

        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>No professionals found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your filters or search criteria
          </Text>
        </View>

        <FilterSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          filters={filters}
          onFiltersChange={handleFiltersApply}
        />
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
        <SearchHeader
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
          onFilterPress={handleFilterPress}
          activeFiltersCount={activeFiltersCount}
        />

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Failed to load professionals'}
          </Text>
        </View>

        <FilterSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          filters={filters}
          onFiltersChange={handleFiltersApply}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
      {/* Search & Filter Header */}
      <SearchHeader
        searchQuery={filters.searchQuery}
        onSearchChange={handleSearchChange}
        onFilterPress={handleFilterPress}
        activeFiltersCount={activeFiltersCount}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
      />

      {/* Results or Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Finding professionals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={item}
              onPress={() => handleProfessionalPress(item.id)}
              onBookmark={() => handleBookmark(item.id)}
              isBookmarked={bookmarkedIds.has(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={PRIMARY_COLOR}
              colors={[PRIMARY_COLOR]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No results</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredResults.length > 0 && !isLoading ? (
              <View style={styles.footerSpacing} />
            ) : null
          }
        />
      )}

      {/* Results Count */}
      {!isLoading && filteredResults.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {filteredResults.length} professional{filteredResults.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Filter Sheet */}
      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        onFiltersChange={handleFiltersApply}
        onApply={() => setShowFilterSheet(false)}
      />
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ========== Loading ==========
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginTop: 12,
  },

  // ========== Error ==========
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ========== Empty State ==========
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyStateText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ========== List ==========
  listContent: {
    paddingBottom: 60,
  },

  footerSpacing: {
    height: 20,
  },

  // ========== Count Badge ==========
  countBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
