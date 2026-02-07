import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AlertCircle, Filter } from 'lucide-react-native';
import MatchedProfessionalCard from '@/components/MatchedProfessionalCard';
import { useMatchedProfessionals, MatchFilters } from '@/hooks/useMatchedProfessionals';
import { useAuth } from '@/hooks/useAuth';

export interface MatchedProfessionalsPageParams {
  professionalType?: string;
}

/**
 * MatchedProfessionals Page
 * 
 * Displays a ranked list of professionals matched to the current user.
 * Features:
 * - Real-time matching with 5-signal algorithm
 * - Expandable signal breakdown for each professional
 * - Filter options (professional type, rating, price)
 * - Pull-to-refresh for re-matching
 * - Error handling with fallback UI
 */
export default function MatchedProfessionalsPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Route params
  const professionalType = (route.params as MatchedProfessionalsPageParams)
    ?.professionalType;

  // Filter state
  const [filters, setFilters] = useState<MatchFilters>({
    min_rating: 3.5,
    max_price: 10000,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch matched professionals
  const {
    data: professionals = [],
    isLoading,
    error,
    refetch,
  } = useMatchedProfessionals(user?.id, professionalType, filters);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Handle view profile navigation
  const handleViewProfile = (professionalId: string) => {
    navigation.navigate('ProfessionalDetail', { professionalId });
  };

  // Handle subscribe
  const handleSubscribe = (professionalId: string) => {
    navigation.navigate('SubscribeFlow', { professionalId });
  };

  // Update filter
  const updateFilter = (newFilters: Partial<MatchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please log in to view matched professionals</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {professionalType
            ? `${professionalType.charAt(0).toUpperCase() + professionalType.slice(1)}s`
            : 'Matched Professionals'}
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onUpdate={updateFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Loading State */}
        {isLoading && professionals.length === 0 && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Finding best matches...</Text>
          </View>
        )}

        {/* Error State */}
        {error && professionals.length === 0 && (
          <View style={styles.errorContainer}>
            <AlertCircle size={40} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Could not load professionals</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && professionals.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyMessage}>
              {professionalType
                ? `No ${professionalType}s match your criteria. Try adjusting your filters or preferred radius.`
                : 'No professionals match your criteria. Try adjusting your filters or location.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                // Reset filters
                setFilters({
                  min_rating: 3.5,
                  max_price: 10000,
                });
              }}
            >
              <Text style={styles.retryButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Professional List */}
        {professionals.length > 0 && (
          <>
            <View style={styles.matchesHeader}>
              <Text style={styles.matchesCount}>
                {professionals.length} {professionals.length === 1 ? 'match' : 'matches'} found
              </Text>
              <Text style={styles.matchesSubtext}>
                Ranked by signal strength
              </Text>
            </View>

            {professionals.map((professional, index) => (
              <View key={professional.professional_id} style={styles.cardWrapper}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <MatchedProfessionalCard
                  professional={professional}
                  onViewProfile={handleViewProfile}
                  onSubscribe={handleSubscribe}
                  testID={`match-card-${index}`}
                />
              </View>
            ))}

            {/* Bottom padding */}
            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {/* Summary Footer (when matches exist) */}
      {professionals.length > 0 && !isLoading && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Top match: {professionals[0].name} ({professionals[0].overall_score}/100)
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Filter Panel Component
 */
function FilterPanel({
  filters,
  onUpdate,
  onClose,
}: {
  filters: MatchFilters;
  onUpdate: (filters: Partial<MatchFilters>) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.filterPanel}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.filterCloseButton}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Minimum Rating Filter */}
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>Minimum Rating</Text>
        <View style={styles.filterOptions}>
          {[3, 3.5, 4, 4.5, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.filterOption,
                filters.min_rating === rating && styles.filterOptionActive,
              ]}
              onPress={() => onUpdate({ min_rating: rating })}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filters.min_rating === rating &&
                    styles.filterOptionTextActive,
                ]}
              >
                {rating}⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Maximum Price Filter */}
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>Maximum Price</Text>
        <View style={styles.filterOptions}>
          {[1000, 3000, 5000, 10000].map((price) => (
            <TouchableOpacity
              key={price}
              style={[
                styles.filterOption,
                filters.max_price === price && styles.filterOptionActive,
              ]}
              onPress={() => onUpdate({ max_price: price })}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filters.max_price === price &&
                    styles.filterOptionTextActive,
                ]}
              >
                ₹{price / 1000}k
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Available Today Filter */}
      <View style={styles.filterItem}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() =>
            onUpdate({ available_today: !filters.available_today })
          }
        >
          <View style={styles.checkbox}>
            {filters.available_today && (
              <View style={styles.checkboxChecked} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Available Today Only</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterButton: {
    padding: 8,
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  filterCloseButton: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },

  // Content
  content: {
    flex: 1,
  },

  // Center Content
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },

  // Error State
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
  },

  // Empty State
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Retry Button
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Matches Header
  matchesHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  matchesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  matchesSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  // Card Wrapper
  cardWrapper: {
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 20,
    right: 24,
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
