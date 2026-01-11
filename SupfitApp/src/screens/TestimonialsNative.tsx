import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FooterNav from '../components/FooterNav';

interface TestimonialsNativeProps {
  readonly navigation: {
    navigate: (screen: string, params?: Record<string, any>) => void;
    goBack: () => void;
  };
}

interface Testimonial {
  id: number;
  trainee: string;
  coach: string;
  text: string;
  date: string;
  stars: number;
  visible: boolean;
  replied: boolean;
  reply: string;
}

const initialTestimonials: Testimonial[] = [
  {
    id: 1,
    trainee: 'Amit S.',
    coach: 'John Martinez',
    text: 'John helped me gain strength and confidence. His plans are easy to follow and effective!',
    date: '2025-12-10',
    stars: 5,
    visible: true,
    replied: false,
    reply: '',
  },
  {
    id: 2,
    trainee: 'Priya R.',
    coach: 'John Martinez',
    text: 'I lost 10kg in 3 months with John\'s guidance. Highly recommended!',
    date: '2025-12-09',
    stars: 4,
    visible: false,
    replied: true,
    reply: 'Thank you Priya! Keep up the great work! 💪',
  },
  {
    id: 3,
    trainee: 'Megha T.',
    coach: 'Sarah Chen',
    text: 'Sarah\'s yoga sessions brought peace and flexibility to my life.',
    date: '2025-12-08',
    stars: 5,
    visible: true,
    replied: false,
    reply: '',
  },
];

const TestimonialsNative = ({ navigation }: TestimonialsNativeProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [replyText, setReplyText] = useState('');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  // Sort testimonials by date descending (most recent first)
  const sortedTestimonials = [...testimonials].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const pendingReplies = testimonials.filter((t) => !t.replied).length;

  const handlePublishToggle = (id: number) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t))
    );
  };

  const handleOpenReplyModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setReplyModalVisible(true);
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedTestimonial) return;

    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === selectedTestimonial.id ? { ...t, replied: true, reply: replyText.trim() } : t
      )
    );
    setReplyText('');
    setReplyModalVisible(false);
    setSelectedTestimonial(null);
  };

  const handleCancelReply = () => {
    setReplyText('');
    setReplyModalVisible(false);
    setSelectedTestimonial(null);
  };

  const renderStars = (count: number, testimonialId: number) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <MaterialIcons
            key={`star-${testimonialId}-${i}`}
            name="star"
            size={20}
            color="#FFD600"
            style={styles.starIcon}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(248,250,252,1)', 'rgba(245,245,247,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Notification Badge */}
          <View style={styles.notificationContainer}>
            <TouchableOpacity style={styles.notificationButton} accessibilityLabel="Notifications">
              <MaterialIcons name="notifications" size={24} color="#1d1d1f" />
            </TouchableOpacity>
            {pendingReplies > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingReplies}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { fontSize: 20 }]}>Reviews and Ratings</Text>
          <Text style={styles.subtitle}>Review, reply, and publish feedback from your trainees.</Text>
        </LinearGradient>

        <View style={styles.content}>
          {sortedTestimonials.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No feedback yet.</Text>
            </View>
          )}

          {sortedTestimonials.map((t) => (
            <View key={t.id} style={styles.testimonialCard}>
              {/* Header with Trainee and Date */}
              <View style={styles.testimonialHeader}>
                <View style={styles.traineeInfo}>
                  <Text style={styles.traineeName}>{t.trainee}</Text>
                  <Text style={styles.coachInfo}>
                    for <Text style={styles.coachName}>{t.coach}</Text>
                  </Text>
                </View>
                <Text style={styles.dateText}>{t.date || '—'}</Text>
              </View>

              {/* Star Rating */}
              {renderStars(t.stars, t.id)}

              {/* Feedback Text */}
              <Text style={styles.feedbackText}>{t.text}</Text>

              {/* Coach Reply */}
              {Boolean(t.reply) && (
                <View style={styles.replyContainer}>
                  <Text style={styles.replyLabel}>Coach Reply: </Text>
                  <Text style={styles.replyText}>{t.reply}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    t.visible ? styles.unpublishButton : styles.publishButton,
                  ]}
                  onPress={() => handlePublishToggle(t.id)}
                  accessibilityLabel={t.visible ? 'Unpublish feedback' : 'Publish feedback'}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      t.visible ? styles.unpublishButtonText : styles.publishButtonText,
                    ]}
                  >
                    {t.visible ? 'Unpublish' : 'Publish'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.replyButton,
                    t.replied && styles.disabledButton,
                  ]}
                  onPress={() => !t.replied && handleOpenReplyModal(t)}
                  disabled={t.replied}
                  accessibilityLabel={t.replied ? 'Already replied' : 'Reply to feedback'}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.replyButtonText,
                      t.replied && styles.disabledButtonText,
                    ]}
                  >
                    {t.replied ? 'Replied' : 'Reply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <FooterNav mode="coach" navigation={navigation} currentRoute="Testimonials" />

      {/* Reply Modal */}
      <Modal visible={replyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Feedback</Text>
              <TouchableOpacity
                onPress={handleCancelReply}
                style={styles.modalCloseButton}
                accessibilityLabel="Close reply modal"
              >
                <MaterialIcons name="close" size={24} color="#6e6e73" />
              </TouchableOpacity>
            </View>

            {selectedTestimonial && (
              <View style={styles.modalTestimonialInfo}>
                <Text style={styles.modalTraineeName}>{selectedTestimonial.trainee}</Text>
                <Text style={styles.modalFeedbackText}>{selectedTestimonial.text}</Text>
              </View>
            )}

            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your reply..."
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              placeholderTextColor="#6e6e73"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelReply}
                accessibilityLabel="Cancel reply"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSendButton,
                  !replyText.trim() && styles.modalSendButtonDisabled,
                ]}
                onPress={handleReply}
                disabled={!replyText.trim()}
                accessibilityLabel="Send reply"
              >
                <Text
                  style={[
                    styles.modalSendText,
                    !replyText.trim() && styles.modalSendTextDisabled,
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  notificationContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badge: {
    backgroundColor: '#ff3c20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#ff3c20',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: '#6e6e73',
    fontWeight: '500',
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 24,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emptyText: {
    fontSize: 17,
    color: '#6e6e73',
    fontWeight: '500',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  traineeInfo: {
    flex: 1,
    gap: 4,
  },
  traineeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ff3c20',
    lineHeight: 22,
  },
  coachInfo: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '500',
    lineHeight: 18,
  },
  coachName: {
    fontWeight: '700',
    color: '#1d1d1f',
  },
  dateText: {
    fontSize: 13,
    color: '#b0b0b5',
    lineHeight: 18,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    marginRight: 2,
  },
  feedbackText: {
    fontSize: 15,
    color: '#1d1d1f',
    fontWeight: '500',
    lineHeight: 22,
  },
  replyContainer: {
    backgroundColor: 'rgba(255, 60, 32, 0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  replyLabel: {
    fontSize: 15,
    color: '#ff3c20',
    fontWeight: '700',
    lineHeight: 22,
  },
  replyText: {
    fontSize: 15,
    color: '#ff3c20',
    fontStyle: 'italic',
    lineHeight: 22,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  publishButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  unpublishButton: {
    backgroundColor: 'rgba(255, 60, 32, 0.12)',
  },
  replyButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  publishButtonText: {
    color: '#34c759',
  },
  unpublishButtonText: {
    color: '#ff3c20',
  },
  replyButtonText: {
    color: '#1d4ed8',
  },
  disabledButtonText: {
    color: '#6e6e73',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTestimonialInfo: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  modalTraineeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff3c20',
    lineHeight: 22,
  },
  modalFeedbackText: {
    fontSize: 14,
    color: '#1d1d1f',
    fontWeight: '500',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1d1d1f',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    lineHeight: 22,
  },
  modalSendButton: {
    flex: 1,
    backgroundColor: '#ff3c20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#ff3c20',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalSendButtonDisabled: {
    backgroundColor: 'rgba(255, 60, 32, 0.3)',
  },
  modalSendText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 22,
  },
  modalSendTextDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default TestimonialsNative;
