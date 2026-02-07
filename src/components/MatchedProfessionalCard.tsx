import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ChevronDown, MapPin, Star, Clock, DollarSign, Zap } from 'lucide-react-native';
import { MatchResult, SignalScore } from '@/hooks/useMatchedProfessionals';

interface MatchedProfessionalCardProps {
  professional: MatchResult;
  onViewProfile: (id: string) => void;
  onSubscribe: (id: string) => void;
  testID?: string;
}

/**
 * Renders a single matched professional card with:
 * - Profile photo, name, rating
 * - Distance, price, availabilty
 * - Overall score with color coding
 * - Expandable signal breakdown (why this match?)
 * - Action buttons (View Profile, Subscribe)
 */
export function MatchedProfessionalCard({
  professional,
  onViewProfile,
  onSubscribe,
  testID = 'matched-professional-card',
}: MatchedProfessionalCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Determine score color based on overall score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#34C759'; // Green - HIGH
    if (score >= 60) return '#FF9500'; // Orange - MEDIUM
    if (score >= 40) return '#FF6B6B'; // Red - LOW
    return '#999999'; // Gray - UNAVAILABLE
  };

  const scoreColor = getScoreColor(professional.overall_score);
  const scoreTier =
    professional.overall_score >= 80
      ? 'HIGH'
      : professional.overall_score >= 60
        ? 'MEDIUM'
        : professional.overall_score >= 40
          ? 'LOW'
          : 'UNAVAILABLE';

  return (
    <View style={styles.card} testID={testID}>
      {/* Header Section: Photo + Name + Rating */}
      <View style={styles.header}>
        {professional.avatar ? (
          <Image
            source={{ uri: professional.avatar }}
            style={styles.avatar}
            testID="professional-avatar"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {professional.name?.charAt(0)}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.name} testID="professional-name">
            {professional.name}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.rating} testID="professional-rating">
              {professional.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({professional.review_count} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Info Section */}
      <View style={styles.infoGrid}>
        {/* Distance */}
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <MapPin size={16} color="#666" />
          </View>
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue} testID="professional-distance">
            {professional.distance_km.toFixed(1)} km
          </Text>
        </View>

        {/* Price */}
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <DollarSign size={16} color="#666" />
          </View>
          <Text style={styles.infoLabel}>Price</Text>
          <Text style={styles.infoValue} testID="professional-price">
            ₹{professional.price}/session
          </Text>
        </View>

        {/* Availability */}
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Clock size={16} color="#666" />
          </View>
          <Text style={styles.infoLabel}>Available</Text>
          <Text style={styles.infoValue} testID="professional-availability">
            {professional.available_slot
              ? professional.available_slot.split(' ')[0].split(',').slice(0, 1).join('')
              : 'Not soon'}
          </Text>
        </View>
      </View>

      {/* Specialties */}
      {professional.specialties && professional.specialties.length > 0 && (
        <View style={styles.specialtiesSection}>
          <Text style={styles.specialtiesLabel}>Specialties</Text>
          <View style={styles.specialtiesList}>
            {professional.specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {professional.specialties.length > 3 && (
              <View style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>
                  +{professional.specialties.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Match Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreBox}>
            <Text
              style={[styles.scoreText, { color: scoreColor }]}
              testID="overall-score"
            >
              {professional.overall_score.toFixed(0)}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Match Score</Text>
            <View style={[styles.scoreTierBadge, { borderColor: scoreColor }]}>
              <View style={[styles.scoreTierDot, { backgroundColor: scoreColor }]} />
              <Text style={[styles.scoreTierText, { color: scoreColor }]}>
                {scoreTier}
              </Text>
            </View>
          </View>
        </View>

        {/* Why This Match Button */}
        <TouchableOpacity
          style={styles.breakdownToggle}
          onPress={() => setShowBreakdown(!showBreakdown)}
          testID="toggle-breakdown"
        >
          <Zap size={14} color="#FF9500" />
          <Text style={styles.breakdownToggleText}>Why this match?</Text>
          <ChevronDown
            size={16}
            color="#666"
            style={[
              styles.chevron,
              showBreakdown && { transform: [{ rotate: '180deg' }] },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Signal Breakdown (Expandable) */}
      {showBreakdown && (
        <SignalBreakdown signals={professional.signal_breakdown} />
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={() => onViewProfile(professional.professional_id)}
          testID="view-profile-button"
        >
          <Text style={styles.outlineButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.solidButton]}
          onPress={() => onSubscribe(professional.professional_id)}
          testID="subscribe-button"
        >
          <Text style={styles.solidButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Signal Breakdown Component: Shows 5 signals with scores and explanations
 */
function SignalBreakdown({ signals }: { signals: Record<string, SignalScore> }) {
  const signalOrder = [
    'proximity',
    'goal_alignment',
    'budget_fit',
    'rating',
    'availability',
  ];

  const signalLabels: Record<string, string> = {
    proximity: '📍 Proximity',
    goal_alignment: '💪 Goal Aligned',
    budget_fit: '💵 Budget Fit',
    rating: '⭐ Rating',
    availability: '📅 Availability',
  };

  return (
    <View style={styles.breakdownSection} testID="signal-breakdown">
      <Text style={styles.breakdownTitle}>Why this match?</Text>

      {signalOrder.map((signalName) => {
        const signal = signals[signalName as keyof typeof signals];
        if (!signal) return null;

        return (
          <SignalRow
            key={signalName}
            label={signalLabels[signalName]}
            score={signal.score}
            weight={signal.weight * 100}
            explanation={signal.explanation}
          />
        );
      })}
    </View>
  );
}

/**
 * Individual Signal Row Component
 */
function SignalRow({
  label,
  score,
  weight,
  explanation,
}: {
  label: string;
  score: number;
  weight: number;
  explanation: string;
}) {
  const scoreColor =
    score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF6B6B';

  return (
    <View style={styles.signalRow}>
      <View style={styles.signalLabel}>
        <Text style={styles.signalLabelText}>{label}</Text>
        <Text style={styles.signalScore} testID={`signal-${label}-score`}>
          {score.toFixed(0)}/100 ({weight.toFixed(0)}% weight)
        </Text>
      </View>

      <View style={styles.signalBar}>
        <View
          style={[
            styles.signalBarFill,
            {
              width: `${score}%`,
              backgroundColor: scoreColor,
            },
          ]}
        />
      </View>

      <Text style={styles.signalExplanation}>{explanation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header Section
  header: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  // Specialties
  specialtiesSection: {
    marginBottom: 12,
  },
  specialtiesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    color: '#666',
  },

  // Score Section
  scoreSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 14,
    color: '#999',
    marginLeft: 2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  scoreTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    width: 'fit-content',
  },
  scoreTierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  scoreTierText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Breakdown Toggle
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  breakdownToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },

  // Signal Breakdown
  breakdownSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  signalRow: {
    marginBottom: 10,
  },
  signalLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  signalLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  signalScore: {
    fontSize: 11,
    color: '#666',
  },
  signalBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  signalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  signalExplanation: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  solidButton: {
    backgroundColor: '#34C759',
  },
  solidButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MatchedProfessionalCard;
