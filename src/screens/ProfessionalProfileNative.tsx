/**
 * Professional Profile Screen
 * Displays detailed professional profile with reviews, packages, and availability
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Star, MapPin, Globe, ArrowLeft, Briefcase, MessageSquare, Calendar } from 'lucide-react-native';
import { useProfessionalProfile, useProfessionalReviews, useSubmitReview } from '@/hooks/phase2';
import { ReviewCard } from '@/components/ReviewCard';
import type { ProfessionalProfile } from '@/types/phase2';

const PRIMARY_COLOR = '#FF6B6B';
const SECONDARY_COLOR = '#4ECDC4';
const TEXT_DARK = '#2C3E50';
const TEXT_LIGHT = '#7F8C8D';
const BORDER_COLOR = '#E0E0E0';
const BACKGROUND = '#F8F9FA';

interface RouteParams {
  professionalId: string;
}

export const ProfessionalProfileNative = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { professionalId } = route.params as RouteParams;

  // State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Queries
  const { data: professional, isLoading, error } = useProfessionalProfile(professionalId);
  const { data: reviews } = useProfessionalReviews(professionalId, 20);
  const submitReviewMutation = useSubmitReview(professionalId);

  // Handlers
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (reviewTitle.length < 5 || reviewContent.length < 10) {
      Alert.alert('Error', 'Review is too short');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitReviewMutation.mutateAsync({
        professional_package_id: professionalId,
        rating: reviewRating,
        title: reviewTitle,
        content: reviewContent,
      });

      Alert.alert('Success', 'Review submitted! It will be visible after moderation.');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewContent('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [reviewRating, reviewTitle, reviewContent, professionalId, submitReviewMutation]);

  const handleBookPackage = useCallback(() => {
    if (professional?.packages[0]) {
      navigation.navigate('CheckoutNative', {
        packageId: professional.packages[0].id,
        packageName: professional.packages[0].name,
        price: professional.packages[0].price,
        professionalId: professional.id,
      });
    }
  }, [professional, navigation]);

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error || !professional) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={24} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Professional not found</Text>
          <Text style={styles.errorText}>This professional is no longer available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: professional.avatar_url || `https://ui-avatars.com/api/?name=${professional.name}&size=200`,
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>{professional.name}</Text>
          <Text style={styles.type}>
            {professional.professional_type === 'coach' ? 'Fitness Coach' : 'Dietician'}
          </Text>

          {professional.bio && (
            <Text style={styles.bio}>{professional.bio}</Text>
          )}

          {/* Rating & Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={16} color={PRIMARY_COLOR} fill={PRIMARY_COLOR} />
              <Text style={styles.statLabel}>{professional.rating.toFixed(1)}</Text>
              <Text style={styles.statValue}>({professional.review_count})</Text>
            </View>

            {professional.experience_years && (
              <View style={styles.statItem}>
                <Briefcase size={16} color={SECONDARY_COLOR} />
                <Text style={styles.statLabel}>{professional.experience_years}y</Text>
                <Text style={styles.statValue}>Experience</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specialties */}
        {professional.specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.badgeGrid}>
              {professional.specialties.map((specialty) => (
                <View key={specialty} style={styles.badge}>
                  <Text style={styles.badgeText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Service Modes */}
        {professional.mode.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Modes</Text>
            <View style={styles.badgeGrid}>
              {professional.mode.map((mode) => (
                <View key={mode} style={[styles.badge, styles.modeBadge]}>
                  <Text style={styles.badgeText}>
                    {mode === 'in-person' ? '📍 In-Person' : mode === 'online' ? '💻 Online' : '🔄 Hybrid'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {professional.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.badgeGrid}>
              {professional.languages.map((lang) => (
                <View key={lang.id} style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {lang.language_name} ({lang.proficiency_level})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Packages */}
        {professional.packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packages</Text>
            {professional.packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                </View>

                {pkg.description && (
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                )}

                {pkg.features && pkg.features.length > 0 && (
                  <View style={styles.featuresList}>
                    {pkg.features.slice(0, 5).map((feature, idx) => (
                      <Text key={idx} style={styles.featureItem}>
                        ✓ {feature}
                      </Text>
                    ))}
                    {pkg.features.length > 5 && (
                      <Text style={styles.featureItem}>+ {pkg.features.length - 5} more features</Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={handleBookPackage}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => setShowReviewModal(true)}
            >
              <MessageSquare size={14} color="#FFFFFF" />
              <Text style={styles.writeReviewButtonText}>Write</Text>
            </TouchableOpacity>
          </View>

          {reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReplyPress={() => Alert.alert('Reply', 'Reply functionality coming soon')}
              />
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* CTA Button */}
      {professional.packages.length > 0 && (
        <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleBookPackage}
          >
            <Text style={styles.ctaButtonText}>Book a Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowReviewModal(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={24} color={TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Rating Selector */}
            <View style={styles.ratingSelector}>
              <Text style={styles.modalLabel}>Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Star
                      size={32}
                      color={star <= reviewRating ? PRIMARY_COLOR : BORDER_COLOR}
                      fill={star <= reviewRating ? PRIMARY_COLOR : 'none'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Summary of your experience"
                placeholderTextColor={TEXT_LIGHT}
                value={reviewTitle}
                onChangeText={setReviewTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>{reviewTitle.length}/100</Text>
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Review</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                placeholder="Share your detailed experience..."
                placeholderTextColor={TEXT_LIGHT}
                value={reviewContent}
                onChangeText={setReviewContent}
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>{reviewContent.length}/500</Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowReviewModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSubmitButton, isSubmittingReview && { opacity: 0.6 }]}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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

  // ========== Header ==========
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  // ========== Loading ==========
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },

  // ========== Content ==========
  content: {
    paddingBottom: 100,
  },

  // ========== Hero Section ==========
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: SECONDARY_COLOR,
  },

  name: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },

  type: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 12,
  },

  bio: {
    fontSize: 13,
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },

  statItem: {
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 4,
  },

  statValue: {
    fontSize: 12,
    color: TEXT_LIGHT,
  },

  // ========== Section ==========
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  badge: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  modeBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },

  badgeText: {
    fontSize: 12,
    color: TEXT_DARK,
    fontWeight: '500',
  },

  // ========== Package Card ==========
  packageCard: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },

  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  packageName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },

  packageDescription: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 10,
  },

  featuresList: {
    marginBottom: 12,
  },

  featureItem: {
    fontSize: 12,
    color: TEXT_DARK,
    marginBottom: 6,
  },

  bookButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  bookButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },

  // ========== Reviews ==========
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  writeReviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  noReviewsText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginTop: 16,
  },

  bottomSpacing: {
    height: 20,
  },

  // ========== CTA ==========
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    backgroundColor: '#FFFFFF',
  },

  ctaButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ========== Modal ==========
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  ratingSelector: {
    marginBottom: 20,
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
  },

  starsContainer: {
    flexDirection: 'row',
    gap: 16,
  },

  inputGroup: {
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: TEXT_DARK,
    marginBottom: 4,
  },

  contentInput: {
    height: 100,
    textAlignVertical: 'top',
  },

  charCount: {
    fontSize: 11,
    color: TEXT_LIGHT,
    textAlign: 'right',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },

  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
  },

  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },

  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
  },

  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
