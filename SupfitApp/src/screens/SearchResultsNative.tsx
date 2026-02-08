import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-root-toast';
import supabaseClient from '../../shared/supabaseClient';

interface Professional {
  professional_id: string;
  owner_user_id: string;
  name: string;
  description: string;
  price: number;
  rating: number | null;
  review_count: number;
  specialties: string[];
  mode: string[];
  distance_km: number;
  match_score: number;
  photo_url?: string;
}

interface SearchResultsProps {
  route: any;
  navigation: any;
}

const ProfessionalSearchCard: React.FC<{
  professional: Professional;
  rank: number;
  onPress: () => void;
}> = ({ professional, rank, onPress }) => {
  const getRankColor = (score: number) => {
    if (score >= 85) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    if (score >= 40) return '#F44336'; // Red
    return '#999'; // Gray
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Perfect Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  return (
    <TouchableOpacity
      style={styles.professionalCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Rank Badge */}
      {rank <= 3 && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>#{rank}</Text>
        </View>
      )}

      {/* Photo */}
      <View style={styles.photoContainer}>
        {professional.photo_url ? (
          <Image
            source={{ uri: professional.photo_url }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialIcons name="person" size={40} color="#DDD" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {/* Name & Match Score */}
        <View style={styles.cardHeader}>
          <View style={styles.nameSection}>
            <Text style={styles.name} numberOfLines={2}>
              {professional.name}
            </Text>
            <View style={styles.ratingRow}>
              {professional.rating && professional.rating > 0 ? (
                <>
                  <MaterialIcons name="star" size={14} color="#FF9800" />
                  <Text style={styles.rating}>
                    {professional.rating.toFixed(1)} ({professional.review_count} reviews)
                  </Text>
                </>
              ) : (
                <Text style={styles.noRating}>No ratings yet</Text>
              )}
            </View>
          </View>

          {/* Match Score Circle */}
          <View
            style={[
              styles.matchScoreCircle,
              { borderColor: getRankColor(professional.match_score) },
            ]}
          >
            <Text style={[styles.matchScore, { color: getRankColor(professional.match_score) }]}>
              {professional.match_score}
            </Text>
            <Text style={styles.matchScoreLabel}>
              {getScoreLabel(professional.match_score).split(' ')[0]}
            </Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.specialtiesContainer}>
          {professional.specialties.slice(0, 2).map((specialty, idx) => (
            <View key={idx} style={styles.specialtyTag}>
              <Text style={styles.specialtyTagText} numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          ))}
          {professional.specialties.length > 2 && (
            <Text style={styles.moreSpecialties}>
              +{professional.specialties.length - 2} more
            </Text>
          )}
        </View>

        {/* Quick Info Row */}
        <View style={styles.quickInfoRow}>
          <View style={styles.quickInfoItem}>
            <MaterialIcons name="location-on" size={14} color="#666" />
            <Text style={styles.quickInfoText}>
              {professional.distance_km.toFixed(1)} km
            </Text>
          </View>

          <View style={styles.quickInfoItem}>
            <MaterialIcons name="currency-rupee" size={14} color="#666" />
            <Text style={styles.quickInfoText}>₹{professional.price}/session</Text>
          </View>

          <View style={styles.quickInfoItem}>
            <MaterialIcons name="videocam" size={14} color="#666" />
            <Text style={styles.quickInfoText} numberOfLines={1}>
              {professional.mode.slice(0, 2).join(', ')}
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={onPress}
        >
          <Text style={styles.viewProfileButtonText}>See Profile</Text>
          <MaterialIcons name="chevron-right" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function SearchResultsNative({
  route,
  navigation,
}: SearchResultsProps) {
  const { selectedGoals, filters } = route.params || {};
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  const fetchResults = useCallback(async () => {
    if (!userId || !selectedGoals || selectedGoals.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Call the search function via RPC
      const { data, error } = await supabaseClient.rpc(
        'search_professionals_by_goals',
        {
          p_user_id: userId,
          p_goal_categories: selectedGoals,
          p_preferred_mode: filters?.mode?.length > 0 ? filters.mode : null,
          p_preferred_timing: filters?.timing?.length > 0 ? filters.timing : null,
          p_min_rating: filters?.minRating || 0,
          p_max_price: filters?.maxPrice || 999999,
          p_radius_km: 10,
          p_limit: 50,
        }
      );

      if (error) {
        console.error('Search error:', error);
        Toast.show('Error fetching results', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error('Search exception:', err);
      Toast.show('Error performing search', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, selectedGoals, filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const handleProfessionalPress = (professional: Professional) => {
    // Log interaction
    if (userId) {
      supabaseClient.from('search_history').insert({
        user_id: userId,
        query_filters: { goals: selectedGoals, ...filters },
        selected_professional_id: professional.professional_id,
      }).then(() => console.log('Interaction logged'));
    }

    // Navigate to professional detail
    navigation.navigate('ProfessionalDetail', {
      professionalId: professional.professional_id,
      professional,
    });
  };

  if (loading && results.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Finding professionals...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="search-off" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No professionals found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your filters or criteria
        </Text>
        <TouchableOpacity
          style={styles.emptyRetryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyRetryButtonText}>Go Back & Adjust</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Search Results</Text>
          <Text style={styles.headerSubtitle}>
            {results.length} professional{results.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={({ item, index }) => (
          <ProfessionalSearchCard
            professional={item}
            rank={index + 1}
            onPress={() => handleProfessionalPress(item)}
          />
        )}
        keyExtractor={(item) => item.professional_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
          />
        }
        scrollIndicatorInsets={{ right: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  professionalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  photoContainer: {
    width: 100,
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEE',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  noRating: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  matchScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  specialtyTagText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickInfoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  viewProfileButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewProfileButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyRetryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  emptyRetryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
