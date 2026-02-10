/**
 * Review Card Component
 * Displays a single professional review/testimonial with rating
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react-native';
import type { ProfessionalReview } from '@/types/phase2';

interface ReviewCardProps {
  review: ProfessionalReview & { reviewer_name?: string };
  onReplyPress?: () => void;
  onHelpfulPress?: () => void;
  isHelpful?: boolean;
}

const PRIMARY_COLOR = '#FF6B6B';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BORDER_COLOR = '#E0E0E0';
const SECONDARY_COLOR = '#4ECDC4';

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onReplyPress,
  onHelpfulPress,
  isHelpful = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        color={i < Math.floor(rating) ? PRIMARY_COLOR : BORDER_COLOR}
        fill={i < Math.floor(rating) ? PRIMARY_COLOR : 'none'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header: Rating + Date + Reviewer Name */}
      <View style={styles.header}>
        <View style={styles.ratingSection}>
          <View style={styles.stars}>{renderStars(review.rating)}</View>
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.reviewerName} numberOfLines={1}>
            {review.reviewer_name || 'Anonymous'}
          </Text>
          <Text style={styles.date}>{formatDate(review.created_at)}</Text>
        </View>
      </View>

      {/* Review Title & Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title} numberOfLines={2}>
          {review.title}
        </Text>
        <Text style={styles.content} numberOfLines={4}>
          {review.content}
        </Text>
      </View>

      {/* Professional Response (if available) */}
      {review.response_text && (
        <View style={styles.responseSection}>
          <Text style={styles.responseLabel}>Professional Response</Text>
          <Text style={styles.responseText}>{review.response_text}</Text>
        </View>
      )}

      {/* Footer: Helpful + Reply */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, isHelpful && styles.footerButtonActive]}
          onPress={onHelpfulPress}
        >
          <ThumbsUp
            size={14}
            color={isHelpful ? PRIMARY_COLOR : TEXT_LIGHT}
            fill={isHelpful ? PRIMARY_COLOR : 'none'}
          />
          <Text style={[styles.footerButtonText, isHelpful && styles.footerButtonTextActive]}>
            Helpful ({review.helpful_count})
          </Text>
        </Pressable>

        {onReplyPress && !review.response_text && (
          <Pressable
            style={styles.footerButton}
            onPress={onReplyPress}
          >
            <MessageCircle size={14} color={TEXT_LIGHT} />
            <Text style={styles.footerButtonText}>Reply</Text>
          </Pressable>
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
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  // ========== Header ==========
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  stars: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  headerInfo: {
    flex: 1,
  },

  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 2,
  },

  date: {
    fontSize: 11,
    color: TEXT_LIGHT,
  },

  // ========== Content ==========
  contentSection: {
    marginBottom: 12,
  },

  title: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
  },

  content: {
    fontSize: 12,
    color: TEXT_DARK,
    lineHeight: 18,
  },

  // ========== Response ==========
  responseSection: {
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: SECONDARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 4,
  },

  responseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 4,
  },

  responseText: {
    fontSize: 12,
    color: TEXT_DARK,
    lineHeight: 16,
  },

  // ========== Footer ==========
  footer: {
    flexDirection: 'row',
    gap: 8,
  },

  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F6F7',
  },

  footerButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },

  footerButtonText: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },

  footerButtonTextActive: {
    color: PRIMARY_COLOR,
  },
});
