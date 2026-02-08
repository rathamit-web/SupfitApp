import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import supabaseClient from '../../shared/supabaseClient';
import Toast from 'react-native-root-toast';

type GoalCategory = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'yoga_stretching'
  | 'posture_therapy'
  | 'cardio_fitness'
  | 'beginner_training'
  | 'pilates'
  | 'nutrition_coaching'
  | 'sports_performance'
  | 'injury_recovery'
  | 'flexibility'
  | 'mobility'
  | 'core_strength'
  | 'endurance_training'
  | 'functional_fitness'
  | 'rehabilitation';

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

interface GoalCategoryButtonProps {
  category: GoalCategoryInfo;
  isSelected: boolean;
  onPress: () => void;
}

const GoalCategoryButton: React.FC<GoalCategoryButtonProps> = ({
  category,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={category.icon as any}
        size={28}
        color={isSelected ? '#FF6B35' : '#999'}
      />
      <Text
        style={[
          styles.categoryButtonText,
          isSelected && styles.categoryButtonTextSelected,
        ]}
        numberOfLines={2}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
};

interface SearchFiltersState {
  timing: string[];
  mode: string[];
  minRating: number;
  maxPrice: number;
}

interface FilterPanelProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  visible: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  visible,
  onClose,
}) => {
  if (!visible) return null;

  const timingOptions = ['morning', 'evening', 'any_time'];
  const modeOptions = ['in-person', 'online', 'hybrid'];
  const ratingOptions = [0, 3, 3.5, 4, 4.5, 5];
  const priceOptions = [1000, 3000, 5000, 10000];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalBody}>
            {/* Preferred Timing */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Preferred Timing</Text>
              <View style={styles.filterOptionsRow}>
                {timingOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOptionButton,
                      filters.timing.includes(option) &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() => {
                      const newTiming = filters.timing.includes(option)
                        ? filters.timing.filter((t) => t !== option)
                        : [...filters.timing, option];
                      onFiltersChange({ ...filters, timing: newTiming });
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.timing.includes(option) &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option === 'any_time' ? 'Any Time' : option.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferred Mode */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Preferred Mode</Text>
              <View style={styles.filterOptionsRow}>
                {modeOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOptionButton,
                      filters.mode.includes(option) &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() => {
                      const newMode = filters.mode.includes(option)
                        ? filters.mode.filter((m) => m !== option)
                        : [...filters.mode, option];
                      onFiltersChange({ ...filters, mode: newMode });
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.mode.includes(option) &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option
                        .split('-')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Rating */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.filterOptionsRow}>
                {ratingOptions.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterOptionButton,
                      filters.minRating === rating &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() =>
                      onFiltersChange({ ...filters, minRating: rating })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.minRating === rating &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {rating === 0 ? 'Any' : `${rating}★`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Maximum Price */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Maximum Price (₹)</Text>
              <View style={styles.filterOptionsRow}>
                {priceOptions.map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.filterOptionButton,
                      filters.maxPrice === price &&
                        styles.filterOptionButtonActive,
                    ]}
                    onPress={() =>
                      onFiltersChange({ ...filters, maxPrice: price })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.maxPrice === price &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      ₹{price / 1000}k
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.filterApplyButton}
            onPress={onClose}
          >
            <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function SearchCriteriaNative({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<GoalCategory[]>([]);
  const [filters, setFilters] = useState<SearchFiltersState>({
    timing: [],
    mode: [],
    minRating: 0,
    maxPrice: 10000,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  const handleSearch = async () => {
    if (selectedGoals.length === 0) {
      Toast.show('Please select at least one fitness goal', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    if (!userId) {
      Toast.show('User not found', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    setLoading(true);
    try {
      // Save user search goals to database
      for (const goal of selectedGoals) {
        await supabaseClient.from('user_search_goals').upsert(
          {
            user_id: userId,
            goal_category: goal,
            priority: selectedGoals.indexOf(goal),
          },
          { onConflict: 'user_id,goal_category' }
        );
      }

      // Navigate to search results with selected criteria
      navigation.navigate('SearchResults', {
        selectedGoals,
        filters,
      });

      // Log search to history
      await supabaseClient.from('search_history').insert({
        user_id: userId,
        query_filters: {
          goals: selectedGoals,
          ...filters,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      Toast.show('Error performing search', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Professional</Text>
        <Text style={styles.headerSubtitle}>Select your fitness goals</Text>
      </View>

      {/* Goal Categories Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryGrid}>
          {GOAL_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryGridItem}>
              <GoalCategoryButton
                category={category}
                isSelected={selectedGoals.includes(category.id)}
                onPress={() => {
                  setSelectedGoals((prev) =>
                    prev.includes(category.id)
                      ? prev.filter((g) => g !== category.id)
                      : [...prev, category.id]
                  );
                }}
              />
            </View>
          ))}
        </View>

        {/* Selected Summary */}
        {selectedGoals.length > 0 && (
          <View style={styles.selectedSummary}>
            <Text style={styles.selectedSummaryTitle}>
              {selectedGoals.length} goal(s) selected
            </Text>
            <View style={styles.selectedGoalsTags}>
              {selectedGoals.map((goal) => {
                const category = GOAL_CATEGORIES.find((c) => c.id === goal);
                return (
                  <View key={goal} style={styles.goalTag}>
                    <Text style={styles.goalTagText}>{category?.label}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedGoals((prev) =>
                          prev.filter((g) => g !== goal)
                        )
                      }
                    >
                      <MaterialIcons
                        name="close"
                        size={14}
                        color="#FFF"
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Filters Summary */}
        <View style={styles.filtersSummary}>
          <Text style={styles.filtersSummaryTitle}>Filters Applied:</Text>
          <View style={styles.filtersSummaryTags}>
            {filters.timing.length > 0 && (
              <View style={styles.summaryTag}>
                <MaterialIcons name="schedule" size={14} color="#666" />
                <Text style={styles.summaryTagText}>
                  Timing: {filters.timing.map(t => t === 'any_time' ? 'Any' : t).join(', ')}
                </Text>
              </View>
            )}
            {filters.mode.length > 0 && (
              <View style={styles.summaryTag}>
                <MaterialIcons name="videocam" size={14} color="#666" />
                <Text style={styles.summaryTagText}>
                  Mode: {filters.mode.join(', ')}
                </Text>
              </View>
            )}
            {filters.minRating > 0 && (
              <View style={styles.summaryTag}>
                <MaterialIcons name="star" size={14} color="#FF9800" />
                <Text style={styles.summaryTagText}>Rating: {filters.minRating}★+</Text>
              </View>
            )}
            {filters.maxPrice < 10000 && (
              <View style={styles.summaryTag}>
                <MaterialIcons name="currency-rupee" size={14} color="#666" />
                <Text style={styles.summaryTagText}>Price: ₹{filters.maxPrice / 1000}k</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterPanel(true)}
        >
          <MaterialIcons name="tune" size={20} color="#FF6B35" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.searchButton,
            selectedGoals.length === 0 && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={selectedGoals.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <MaterialIcons name="search" size={20} color="#FFF" />
              <Text style={styles.searchButtonText}>Search</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Panel Modal */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        visible={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EEE',
    minHeight: 120,
  },
  categoryButtonSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F3',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryButtonTextSelected: {
    color: '#FF6B35',
  },
  selectedSummary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  selectedSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  selectedGoalsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersSummary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filtersSummaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filtersSummaryTags: {
    flexDirection: 'column',
    gap: 6,
  },
  summaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9F9F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  summaryTagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  searchButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#CCC',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterOptionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FFF',
  },
  filterApplyButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterApplyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
