import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import './ProfessionalProfile.css';

// Mock professional data
const MOCK_PROFESSIONAL_DATA = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    type: 'coach',
    bio: 'Certified fitness coach with 8+ years experience helping clients achieve their fitness goals.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 4.8,
    reviewCount: 156,
    responseTime: '2 hours',
    location: 'New York, NY',
    distance: 5.2,
    specialties: ['HIIT', 'Strength Training', 'Weight Loss', 'Nutrition Coaching'],
    languages: ['English', 'Spanish'],
    hourlyRate: 50,
    reviewStats: {
      averageRating: 4.8,
      totalReviews: 156,
      recommendedCount: 148,
      breakdownCount: { 5: 120, 4: 30, 3: 4, 2: 2, 1: 0 },
    },
    packages: [
      {
        id: 'pkg1',
        name: 'Single Session',
        duration: '1 hour',
        price: 50,
        description: 'Perfect for trying out my coaching style',
        features: ['Personalized workout plan', 'Form assessment', 'Post-session guidance'],
      },
      {
        id: 'pkg2',
        name: 'Monthly Package',
        duration: '4 sessions',
        price: 180,
        description: 'Best for consistent progress',
        features: [
          'Weekly sessions',
          'Custom meal plan',
          'Progress tracking',
          'WhatsApp support',
        ],
      },
      {
        id: 'pkg3',
        name: 'Quarterly Plan',
        duration: '12 sessions + assessment',
        price: 480,
        description: 'Transform your fitness completely',
        features: [
          'Bi-weekly sessions',
          'Monthly body composition analysis',
          'Custom nutrition plan',
          '24/7 support',
          'Pre-post photos',
        ],
      },
    ],
    reviews: [
      {
        id: 'r1',
        rating: 5,
        title: 'Amazing transformation!',
        content:
          'Sarah completely transformed my fitness journey. Her personalized approach and constant motivation kept me going. Highly recommended!',
        authorName: 'Rahul M.',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        date: '2 weeks ago',
        helpful: 24,
        response: 'Thank you so much Rahul! Your dedication was inspiring. Keep up the great work!',
      },
      {
        id: 'r2',
        rating: 5,
        title: 'Best decision ever',
        content:
          'I was skeptical at first, but Sarah\'s expertise and friendly nature made all the difference. Lost 8kg in 3 months!',
        authorName: 'Priya S.',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        date: '1 month ago',
        helpful: 18,
        response: null,
      },
      {
        id: 'r3',
        rating: 4,
        title: 'Great coach, very professional',
        content:
          'Sarah is very professional and knows her stuff. The only reason it\'s 4 stars instead of 5 is the slightly higher price point, but you get what you pay for.',
        authorName: 'Arun K.',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
        date: '6 weeks ago',
        helpful: 12,
        response: null,
      },
    ],
  },
};

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  date: string;
  helpful: number;
  response: string | null;
}

interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
}

const ProfessionalProfile: React.FC = () => {
  const { professionalId } = useParams<{ professionalId: string }>();
  const navigate = useNavigate();

  const professional =
    MOCK_PROFESSIONAL_DATA[professionalId as keyof typeof MOCK_PROFESSIONAL_DATA];

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    content: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!professional) {
    return (
      <div className="professional-profile-container error-state">
        <p>Professional not found</p>
        <Button onClick={() => navigate('/find-professionals')} className="mt-4">
          Back to Search
        </Button>
      </div>
    );
  }

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReviewForm({ rating: 5, title: '', content: '' });
    setShowReviewModal(false);
    setSubmittingReview(false);
    // Show success toast or notification here
  };

  return (
    <div className="professional-profile-container">
      {/* Header */}
      <div className="profile-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>{professional.name}</h1>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <img
          src={professional.avatar}
          alt={professional.name}
          className="avatar-large"
        />
        <h2 className="profile-name">{professional.name}</h2>
        <p className="profile-type">
          {professional.type.charAt(0).toUpperCase() +
            professional.type.slice(1)}
        </p>
        <p className="profile-bio">{professional.bio}</p>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <Star size={16} fill="white" />
            <div>
              <div className="stat-value">{professional.rating}</div>
              <div className="stat-label">
                ({professional.reviewCount} reviews)
              </div>
            </div>
          </div>
          <div className="stat-item">
            <Clock size={16} />
            <div>
              <div className="stat-value">~2h</div>
              <div className="stat-label">Response time</div>
            </div>
          </div>
          <div className="stat-item">
            <MapPin size={16} />
            <div>
              <div className="stat-value">
                {professional.distance}km
              </div>
              <div className="stat-label">{professional.location}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Specialties Section */}
        <div className="profile-section">
          <h3>Specialties</h3>
          <div className="badge-grid">
            {professional.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Languages Section */}
        <div className="profile-section">
          <h3>Languages</h3>
          <div className="badge-grid">
            {professional.languages.map((lang) => (
              <Badge key={lang}>{lang}</Badge>
            ))}
          </div>
        </div>

        {/* Packages Section */}
        <div className="profile-section">
          <h3>Packages & Pricing</h3>
          <div className="packages-grid">
            {professional.packages.map((pkg) => (
              <div key={pkg.id} className="package-card">
                <div className="package-header">
                  <h4>{pkg.name}</h4>
                  <span className="package-price">₹{pkg.price}</span>
                </div>
                <p className="package-description">
                  {pkg.duration}
                </p>
                <p className="package-description">
                  {pkg.description}
                </p>
                <ul className="features-list">
                  {pkg.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <Button
                  onClick={() =>
                    navigate(`/checkout?professionalId=${professional.id}&packageId=${pkg.id}`)
                  }
                  className="book-package-btn"
                >
                  Book Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="profile-section">
          <div className="reviews-header">
            <h3>Reviews ({professional.reviewCount})</h3>
            <Button
              size="sm"
              onClick={() => setShowReviewModal(true)}
              className="write-review-btn"
            >
              <MessageCircle size={16} />
              Write Review
            </Button>
          </div>

          {professional.reviews.length > 0 ? (
            <div className="reviews-list">
              {professional.reviews.map((review: Review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div>
                      <div className="review-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? '#FF6B6B' : '#e0e0e0'}
                            color={i < review.rating ? '#FF6B6B' : '#e0e0e0'}
                          />
                        ))}
                        <span className="review-value">{review.rating}.0</span>
                      </div>
                      <p className="review-title">{review.title}</p>
                    </div>
                    <span className="review-date">{review.date}</span>
                  </div>

                  <p className="review-content">{review.content}</p>

                  {review.response && (
                    <div className="response-section">
                      <p className="response-label">Coach's Response:</p>
                      <p className="response-text">{review.response}</p>
                    </div>
                  )}

                  <div className="review-footer">
                    <button className="helpful-btn">
                      👍 Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="profile-cta">
        <Button
          className="cta-button"
          onClick={() =>
            navigate(`/checkout?professionalId=${professional.id}`)
          }
        >
          <BookOpen size={16} className="mr-2" />
          Book a Session
        </Button>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>

          <div className="review-form">
            {/* Rating Selector */}
            <div className="form-group">
              <Label htmlFor="rating">Rating</Label>
              <div className="rating-selector">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i + 1}
                    className={`star-btn ${
                      reviewForm.rating >= i + 1 ? 'active' : ''
                    }`}
                    onClick={() =>
                      setReviewForm((f) => ({
                        ...f,
                        rating: i + 1,
                      }))
                    }
                    type="button"
                  >
                    <Star
                      size={28}
                      fill={
                        reviewForm.rating >= i + 1 ? '#FF6B6B' : 'white'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <Label htmlFor="title">Title</Label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Amazing results!"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm((f) => ({
                    ...f,
                    title: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>

            {/* Content */}
            <div className="form-group">
              <Label htmlFor="content">Review</Label>
              <Textarea
                id="content"
                placeholder="Share your experience..."
                value={reviewForm.content}
                onChange={(e) =>
                  setReviewForm((f) => ({
                    ...f,
                    content: e.target.value,
                  }))
                }
              />
              <small>{reviewForm.content.length}/500</small>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={
                  submittingReview ||
                  !reviewForm.title ||
                  !reviewForm.content
                }
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalProfile;
