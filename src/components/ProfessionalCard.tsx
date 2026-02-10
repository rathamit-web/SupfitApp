/**
 * Professional Card Component
 * Displays professional preview (name, rating, specialty, price, distance)
 * Used in directory list and search results
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Star, MapPin, Briefcase, Heart } from 'lucide-react-native';
import type { ProfessionalSearchResult } from '@/types/phase2';

interface ProfessionalCardProps {
  professional: ProfessionalSearchResult;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_COLOR = '#4ECDC4';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BORDER_COLOR = '#E0E0E0';

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onPress,
  onBookmark,
  isBookmarked = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
    >
      {/* Header: Avatar + Name + Bookmark */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: professional.avatar_url || `https://ui-avatars.com/api/?name=${professional.name}`,
            }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {professional.name}
          </Text>
          <Text style={styles.type} numberOfLines={1}>
            {professional.professional_type === 'coach' ? 'Fitness Coach' : 'Dietician'}
          </Text>
        </View>

        {onBookmark && (
          <TouchableOpacity
            style={[styles.bookmarkButton, isBookmarked && styles.bookmarkActive]}
            onPress={onBookmark}
            activeOpacity={0.7}
          >
            <Heart
              size={20}
              color={isBookmarked ? PRIMARY_COLOR : TEXT_LIGHT}
              fill={isBookmarked ? PRIMARY_COLOR : 'none'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Rating & Reviews */}
      <View style={styles.ratingSection}>
        <View style={styles.ratingGroup}>
          <Star size={16} color={PRIMARY_COLOR} fill={PRIMARY_COLOR} />
          <Text style={styles.rating}>{professional.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({professional.review_count})</Text>
        </View>

        {/* Specialties (first 2) */}
        <View style={styles.specialties}>
          <Text style={styles.specialty} numberOfLines={1}>
            {professional.specialties.slice(0, 2).join(', ')}
          </Text>
        </View>
      </View>

      {/* Mode & Languages */}
      <View style={styles.infoRow}>
        <View style={styles.modeContainer}>
          {professional.mode.map((m) => (
            <View key={m} style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{m === 'in-person' ? 'In-Person' : m === 'online' ? 'Online' : 'Hybrid'}</Text>
            </View>
          ))}
        </View>

        {professional.languages && professional.languages.length > 0 && (
          <Text style={styles.languages}>
            🌐 {professional.languages.slice(0, 2).join(', ')}
          </Text>
        )}
      </View>

      {/* Distance & Price */}
      <View style={styles.footerRow}>
        <View style={styles.leftFooter}>
          {professional.distance_km !== undefined && (
            <View style={styles.distanceGroup}>
              <MapPin size={14} color={TEXT_LIGHT} />
              <Text style={styles.distance}>{professional.distance_km.toFixed(1)} km away</Text>
            </View>
          )}

          {professional.has_available_slots && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          )}
        </View>

        <View style={styles.priceGroup}>
          <Text style={styles.price}>₹{professional.price}</Text>
          <Text style={styles.priceUnit}>/month</Text>
        </View>
      </View>

      {/* Match Score (if available) */}
      {professional.match_score !== undefined && professional.match_score > 0 && (
        <View style={styles.matchScoreBar}>
          <View style={[styles.matchScoreFill, { width: `${Math.min(professional.match_score, 100)}%` }]} />
        </View>
      )}
    </Pressable>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  containerPressed: {
    backgroundColor: '#F8F9FA',
  },

  // ========== Header ==========
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarContainer: {
    marginRight: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SECONDARY_COLOR,
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 2,
  },

  type: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },

  bookmarkButton: {
    padding: 8,
  },

  bookmarkActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
  },

  // ========== Rating Section ==========
  ratingSection: {
    marginBottom: 12,
  },

  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginLeft: 4,
  },

  reviewCount: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginLeft: 4,
  },

  specialties: {
    marginBottom: 0,
  },

  specialty: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontStyle: 'italic',
  },

  // ========== Info Row ==========
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },

  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },

  modeBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },

  modeBadgeText: {
    fontSize: 10,
    color: SECONDARY_COLOR,
    fontWeight: '600',
  },

  languages: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginLeft: 8,
  },

  // ========== Footer Row ==========
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  distanceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  distance: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginLeft: 4,
  },

  availableBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  availableText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },

  priceGroup: {
    alignItems: 'flex-end',
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    lineHeight: 20,
  },

  priceUnit: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },

  // ========== Match Score Bar ==========
  matchScoreBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },

  matchScoreFill: {
    height: 4,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 2,
  },
});
