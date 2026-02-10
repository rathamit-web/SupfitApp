import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
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

interface ProfessionalPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  feature_list: string[];
}

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  content: string;
  createdAt: string;
  helpfulCount: number;
}

interface ProfessionalDetailProps {
  route: any;
  navigation: any;
}

export default function ProfessionalDetailNative({
  route,
  navigation,
}: ProfessionalDetailProps) {
  const { professionalId, professional: passedProfessional } = route.params;
  const [professional, setProfessional] = useState<Professional | null>(
    passedProfessional || null
  );
  const [packages, setPackages] = useState<ProfessionalPackage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(!passedProfessional);
  const [selectedPackage, setSelectedPackage] = useState<ProfessionalPackage | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
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

  useEffect(() => {
    if (!passedProfessional && professionalId) {
      fetchProfessionalDetails();
    } else {
      fetchPackages();
    }
    // Fetch reviews for this professional
    fetchReviews(0);
  }, [professionalId, passedProfessional]);

  const fetchProfessionalDetails = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('professional_packages')
        .select('*')
        .eq('id', professionalId)
        .single();

      if (error) throw error;

      setProfessional(data as any);
      await fetchPackages(data.owner_user_id);
    } catch (err) {
      console.error('Error fetching professional details:', err);
      Toast.show('Error loading professional profile', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  const fetchPackages = async (ownerId?: string) => {
    try {
      const targetId = ownerId || professional?.owner_user_id;
      if (!targetId) return;

      const { data, error } = await supabaseClient
        .from('professional_packages')
        .select('id, name, description, price, billing_cycle, feature_list')
        .eq('owner_user_id', targetId)
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;

      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page: number = 0) => {
    if (reviewsLoading || !professional) return;

    try {
      setReviewsLoading(true);
      const pageSize = 5;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // First, get all packages for this professional
      const { data: packagesData, error: packagesError } = await supabaseClient
        .from('professional_packages')
        .select('id')
        .eq('owner_user_id', professional.owner_user_id);

      if (packagesError) throw packagesError;

      const packageIds = packagesData?.map((p: any) => p.id) || [];
      
      if (packageIds.length === 0) {
        setReviews([]);
        setHasMoreReviews(false);
        return;
      }

      // Fetch approved reviews for all packages
      const { data, error } = await supabaseClient
        .from('professional_reviews')
        .select('id, reviewer_name, rating, content, created_at, helpful_count, response_text')
        .in('professional_package_id', packageIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newReviews = (data || []).map((review: any) => ({
        id: review.id,
        reviewerName: review.reviewer_name || 'Anonymous',
        rating: review.rating,
        content: review.content,
        createdAt: review.created_at,
        helpfulCount: review.helpful_count || 0,
      }));

      if (page === 0) {
        setReviews(newReviews);
      } else {
        setReviews([...reviews, ...newReviews]);
      }

      setHasMoreReviews(newReviews.length === pageSize);
      setReviewsPage(page);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      Toast.show('Error loading reviews', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubscribe = async (package_: ProfessionalPackage) => {
    if (!userId || !professional) {
      Toast.show('User not found', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    try {
      // Create subscription
      const { data, error } = await supabaseClient
        .from('professional_package_subscriptions')
        .insert({
          package_id: package_.id,
          subscriber_user_id: userId,
          owner_user_id: professional.owner_user_id,
          status: 'active',
        })
        .select();

      if (error) {
        if (error.message.includes('duplicate')) {
          Toast.show('You already subscribed to this package', {
            duration: Toast.durations.SHORT,
            position: Toast.positions.BOTTOM,
          });
        } else {
          throw error;
        }
      } else {
        Toast.show('Successfully subscribed! 🎉', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
        setShowSubscribeModal(false);
        // Optionally navigate to subscription details
        setTimeout(() => {
          navigation.navigate('MySubscriptions');
        }, 500);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Toast.show('Error subscribing to package', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    }
  };

  if (loading || !professional) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const getRankColor = (score: number) => {
    if (score >= 85) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#F44336';
    return '#999';
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Professional Profile</Text>
        <TouchableOpacity onPress={() => { /* Share functionality */ }}>
          <MaterialIcons name="share" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {professional.photo_url ? (
            <Image
              source={{ uri: professional.photo_url }}
              style={styles.heroImage}
            />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <MaterialIcons name="person" size={80} color="#DDD" />
            </View>
          )}

          {/* Match Score Overlay */}
          <View
            style={[
              styles.matchScoreOverlay,
              { backgroundColor: getRankColor(professional.match_score) },
            ]}
          >
            <Text style={styles.matchScoreText}>{professional.match_score}% Match</Text>
          </View>
        </View>

        {/* Professional Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.nameHeader}>
            <View style={styles.nameCol}>
              <Text style={styles.name}>{professional.name}</Text>
              <View style={styles.ratingSection}>
                <MaterialIcons name="star" size={16} color="#FF9800" />
                <Text style={styles.rating}>
                  {professional.rating ? professional.rating.toFixed(1) : 'N/A'}
                </Text>
                <Text style={styles.reviewCount}>
                  ({professional.review_count} reviews)
                </Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <MaterialIcons name="location-on" size={16} color="#FF6B35" />
              <Text style={styles.distance}>{professional.distance_km.toFixed(1)} km</Text>
            </View>
          </View>

          {/* Description */}
          {professional.description && (
            <Text style={styles.description}>{professional.description}</Text>
          )}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="currency-rupee" size={20} color="#FF6B35" />
              <Text style={styles.statLabel}>Price</Text>
              <Text style={styles.statValue}>₹{professional.price}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <MaterialIcons name="videocam" size={20} color="#FF6B35" />
              <Text style={styles.statLabel}>Mode</Text>
              <Text style={styles.statValue} numberOfLines={2}>
                {professional.mode.join(', ')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <MaterialIcons name="school" size={20} color="#FF6B35" />
              <Text style={styles.statLabel}>Specialties</Text>
              <Text style={styles.statValue} numberOfLines={2}>
                {professional.specialties.slice(0, 2).join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Match Score Explanation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why This Match ({professional.match_score}%)?</Text>
          <View style={styles.matchScoreBreakdown}>
            <View style={styles.signalItem}>
              <View style={[styles.signalDot, { backgroundColor: '#FF9800' }]} />
              <View style={styles.signalContent}>
                <Text style={styles.signalLabel}>Expertise Match</Text>
                <Text style={styles.signalValue}>Aligns with your fitness goals</Text>
              </View>
            </View>
            <View style={styles.signalItem}>
              <View style={[styles.signalDot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.signalContent}>
                <Text style={styles.signalLabel}>High Rating</Text>
                <Text style={styles.signalValue}>{professional.rating ? professional.rating.toFixed(1) : 'N/A'} stars from reviews</Text>
              </View>
            </View>
            <View style={styles.signalItem}>
              <View style={[styles.signalDot, { backgroundColor: '#2196F3' }]} />
              <View style={styles.signalContent}>
                <Text style={styles.signalLabel}>Proximity</Text>
                <Text style={styles.signalValue}>{professional.distance_km.toFixed(1)} km away</Text>
              </View>
            </View>
            <View style={styles.signalItem}>
              <View style={[styles.signalDot, { backgroundColor: '#9C27B0' }]} />
              <View style={styles.signalContent}>
                <Text style={styles.signalLabel}>Availability</Text>
                <Text style={styles.signalValue}>Flexible scheduling available</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Specialties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.tagContainer}>
            {professional.specialties.map((specialty, idx) => (
              <View key={idx} style={styles.largeTag}>
                <Text style={styles.largeTagText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Packages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Packages</Text>

          {packages.length === 0 ? (
            <View style={styles.noPackagesContainer}>
              <MaterialIcons name="folder-open" size={40} color="#CCC" />
              <Text style={styles.noPackagesText}>
                No packages available at the moment
              </Text>
            </View>
          ) : (
            <FlatList
              data={packages}
              renderItem={({ item }) => (
                <PackageCard
                  package_={item}
                  onSelect={() => {
                    setSelectedPackage(item);
                    setShowSubscribeModal(true);
                  }}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Reviews ({professional.review_count})</Text>
            {reviews.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  if (hasMoreReviews) {
                    fetchReviews(reviewsPage + 1);
                  }
                }}
                disabled={!hasMoreReviews || reviewsLoading}
              >
                <Text style={styles.seeAllLink}>
                  {hasMoreReviews ? 'Load More' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.noReviewsContainer}>
              <MaterialIcons name="rate-review" size={40} color="#CCC" />
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to share your experience!
              </Text>
            </View>
          ) : (
            <FlatList
              data={reviews}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  onPress={() => {
                    setSelectedReview(item);
                    setShowReviewModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.reviewHeader}>
                    <View>
                      <Text style={styles.reviewerName}>{item.reviewerName}</Text>
                      <View style={styles.ratingContainer}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <MaterialIcons
                            key={i}
                            name={i < item.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={i < item.rating ? '#FFB800' : '#CCC'}
                          />
                        ))}
                        <Text style={styles.ratingText}>
                          {item.rating}.0 • {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text
                    style={styles.reviewContent}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {item.content}
                  </Text>
                  <View style={styles.reviewFooter}>
                    <TouchableOpacity
                      onPress={() => {
                        Toast.show('👍 Marked as helpful', {
                          duration: Toast.durations.SHORT,
                          position: Toast.positions.BOTTOM,
                        });
                      }}
                    >
                      <Text style={styles.helpfulText}>
                        👍 {item.helpfulCount} found helpful
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListFooterComponent={
                reviewsLoading && reviews.length > 0 ? (
                  <ActivityIndicator
                    size="small"
                    color="#666"
                    style={{ marginVertical: 12 }}
                  />
                ) : null
              }
            />
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose This Professional?</Text>
          <View style={styles.benefitsList}>
            <BenefitItem icon="verified" text="Verified Professional" />
            <BenefitItem icon="shield" text="Secure Transactions" />
            <BenefitItem icon="schedule" text="Flexible Scheduling" />
            <BenefitItem icon="support-agent" text="24/7 Support" />
          </View>
        </View>

        {/* Contact CTA */}
        <View style={styles.contactCTA}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              Toast.show('Message feature coming soon!', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            }}
          >
            <MaterialIcons name="message" size={20} color="#FFF" />
            <Text style={styles.contactButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.callButton]}
            onPress={() => {
              Toast.show('Call feature coming soon!', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
              });
            }}
          >
            <MaterialIcons name="phone" size={20} color="#FFF" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Review Detail Modal */}
      <ReviewModal
        visible={showReviewModal}
        review={selectedReview}
        onClose={() => setShowReviewModal(false)}
      />

      {/* Subscribe Modal */}
      <SubscribeModal
        visible={showSubscribeModal}
        package_={selectedPackage}
        professional={professional}
        onClose={() => setShowSubscribeModal(false)}
        onSubscribe={() => {
          if (selectedPackage) {
            handleSubscribe(selectedPackage);
          }
        }}
      />
    </View>
  );
}

const PackageCard: React.FC<{
  package_: ProfessionalPackage;
  onSelect: () => void;
}> = ({ package_, onSelect }) => {
  return (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <View>
          <Text style={styles.packageName}>{package_.name}</Text>
          {package_.description && (
            <Text style={styles.packageDesc} numberOfLines={2}>
              {package_.description}
            </Text>
          )}
        </View>
        <View style={styles.packagePrice}>
          <Text style={styles.price}>₹{package_.price}</Text>
          <Text style={styles.billingCycle}>/{package_.billing_cycle}</Text>
        </View>
      </View>

      {package_.feature_list && package_.feature_list.length > 0 && (
        <View style={styles.packageFeatures}>
          {package_.feature_list.slice(0, 3).map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.featureText} numberOfLines={1}>
                {feature}
              </Text>
            </View>
          ))}
          {package_.feature_list.length > 3 && (
            <Text style={styles.moreFeatures}>
              +{package_.feature_list.length - 3} more features
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.selectPackageButton} onPress={onSelect}>
        <Text style={styles.selectPackageButtonText}>Select Package</Text>
      </TouchableOpacity>
    </View>
  );
};

const BenefitItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <MaterialIcons name={icon as any} size={20} color="#FF6B35" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const ReviewModal: React.FC<{
  visible: boolean;
  review: Review | null;
  onClose: () => void;
}> = ({ visible, review, onClose }) => {
  if (!visible || !review) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.reviewModalOverlay}>
        <View style={styles.reviewModalContent}>
          <View style={styles.reviewModalHeader}>
            <Text style={styles.reviewModalTitle}>Review</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reviewModalBody}>
            <View style={styles.reviewModalAuthor}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarInitial}>
                  {review.reviewerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{review.reviewerName}</Text>
                <View style={styles.modalRatingContainer}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcons
                      key={i}
                      name={i < review.rating ? 'star' : 'star-outline'}
                      size={16}
                      color={i < review.rating ? '#FFB800' : '#CCC'}
                    />
                  ))}
                  <Text style={styles.modalRatingText}>{review.rating}.0 stars</Text>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.reviewFullContent}>
              <Text style={styles.reviewFullText}>{review.content}</Text>
            </View>

            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => {
                  Toast.show('👍 Thanks for your feedback!', {
                    duration: Toast.durations.SHORT,
                    position: Toast.positions.BOTTOM,
                  });
                }}
              >
                <MaterialIcons name="thumb-up" size={18} color="#4CAF50" />
                <Text style={styles.helpfulButtonText}>
                  Helpful ({review.helpfulCount})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => {
                  Toast.show('Review reported', {
                    duration: Toast.durations.SHORT,
                    position: Toast.positions.BOTTOM,
                  });
                }}
              >
                <MaterialIcons name="flag" size={18} color="#FF6B35" />
                <Text style={styles.reportButtonText}>Report</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.reviewModalFooter}>
            <TouchableOpacity
              style={styles.reviewCloseButton}
              onPress={onClose}
            >
              <Text style={styles.reviewCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SubscribeModal: React.FC<{
  visible: boolean;
  package_: ProfessionalPackage | null;
  professional: Professional;
  onClose: () => void;
  onSubscribe: () => void;
}> = ({ visible, package_, professional, onClose, onSubscribe }) => {
  if (!visible || !package_) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.subscribeModalOverlay}>
        <View style={styles.subscribeModalContent}>
          <View style={styles.subscribeModalHeader}>
            <Text style={styles.subscribeModalTitle}>Confirm Subscription</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.subscribeModalBody}>
            <View style={styles.subscribeInfo}>
              <Text style={styles.subscribeLabel}>Professional</Text>
              <Text style={styles.subscribeValue}>{professional.name}</Text>
            </View>

            <View style={styles.subscribeInfo}>
              <Text style={styles.subscribeLabel}>Package</Text>
              <Text style={styles.subscribeValue}>{package_.name}</Text>
            </View>

            {package_.description && (
              <View style={styles.subscribeInfo}>
                <Text style={styles.subscribeLabel}>Description</Text>
                <Text style={styles.subscribeValue}>{package_.description}</Text>
              </View>
            )}

            <View style={styles.subscribeInfo}>
              <Text style={styles.subscribeLabel}>Price</Text>
              <Text style={styles.subsribePrice}>
                ₹{package_.price} / {package_.billing_cycle}
              </Text>
            </View>

            {package_.feature_list && package_.feature_list.length > 0 && (
              <View style={styles.subscribeInfo}>
                <Text style={styles.subscribeLabel}>Includes</Text>
                {package_.feature_list.map((feature, idx) => (
                  <View key={idx} style={styles.includedFeature}>
                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.includedFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.subscribeFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onSubscribe}>
              <Text style={styles.confirmButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: 300,
    backgroundColor: '#EEE',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DDD',
  },
  matchScoreOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  nameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8F3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  matchScoreBreakdown: {
    gap: 12,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  signalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    flexShrink: 0,
  },
  signalContent: {
    flex: 1,
  },
  signalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  signalValue: {
    fontSize: 12,
    color: '#999',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  largeTag: {
    backgroundColor: '#FFF8F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  largeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  packageCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  packageName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  packageDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  packagePrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  billingCycle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  packageFeatures: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  moreFeatures: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectPackageButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectPackageButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  noPackagesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPackagesText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 13,
    color: '#666',
  },
  contactCTA: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 20,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subscribeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  subscribeModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  subscribeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  subscribeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subscribeModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subscribeInfo: {
    marginBottom: 16,
  },
  subscribeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subscribeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  subsribePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  includedFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  includedFeatureText: {
    fontSize: 12,
    color: '#666',
  },
  subscribeFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Review Styles
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 12,
    color: '#2078ff',
    fontWeight: '600',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noReviewsText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB800',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  reviewContent: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  // Review Modal Styles
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  reviewModalAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  modalRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  reviewFullContent: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  reviewFullText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  helpfulButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F6',
  },
  helpfulButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: '#FEF5F2',
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B35',
  },
  reviewModalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  reviewCloseButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
