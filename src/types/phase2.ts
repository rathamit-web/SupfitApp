/**
 * Phase 2: Professional Directory Types
 * Defines TypeScript interfaces for professionals, reviews, languages, search results
 */

/**
 * Professional Review
 * Represents a client review/testimonial for a professional
 */
export interface ProfessionalReview {
  id: string;
  professional_package_id: string;
  reviewer_user_id: string;
  rating: number; // 0-5
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  helpful_count: number;
  unhelpful_count: number;
  response_text?: string;
  response_at?: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string; // Denormalized for display
  reviewer_avatar_url?: string; // Denormalized for display
}

/**
 * Professional Language
 * Languages a professional speaks/works in
 */
export interface ProfessionalLanguage {
  id: string;
  professional_package_id: string;
  language_code: string; // 'en', 'hi', 'es', 'fr', etc.
  language_name: string;
  proficiency_level: 'native' | 'fluent' | 'intermediate' | 'basic';
  created_at: string;
  updated_at: string;
}

/**
 * Professional Review Stats (Denormalized)
 * Aggregate statistics for fast search ranking
 */
export interface ProfessionalReviewStats {
  professional_package_id: string;
  total_reviews: number;
  avg_rating: number; // 0-5
  rating_distribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  recent_reviews_3m: number;
  helpful_count: number;
  last_review_at?: string;
  updated_at: string;
}

/**
 * Professional Package with Enriched Data (for UI display)
 * Combines base package with reviews, languages, stats
 */
export interface ProfessionalPackageWithDetails {
  // Base package fields
  id: string;
  owner_user_id: string;
  professional_type: 'coach' | 'dietician';
  name: string;
  description: string;
  price: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  visibility: 'private' | 'unlisted' | 'public';
  status: 'active' | 'inactive' | 'pending';
  features: string[];
  duration_days?: number;
  max_capacity?: number;

  // Geospatial
  location_lat?: number;
  location_lng?: number;
  location_geo?: {
    type: 'Point';
    coordinates: [number, number];
  };
  mode: ('in-person' | 'online' | 'hybrid')[];
  specialties: string[];
  available_slots?: Record<string, string[]>;

  // Pricing & Stats
  rating: number;
  review_count: number;
  experience_years?: number;
  
  // Phase 2: Rich data
  languages: ProfessionalLanguage[];
  reviews: ProfessionalReview[];
  review_stats: ProfessionalReviewStats;

  // Search metadata
  distance_km?: number;
  match_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Professional Profile (Display on "Coach/Professional" page)
 * Client-facing view of a professional
 */
export interface ProfessionalProfile {
  id: string;
  owner_user_id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  professional_type: 'coach' | 'dietician';
  specialties: string[];
  experience_years?: number;
  
  // Ratings
  rating: number;
  review_count: number;
  review_stats: ProfessionalReviewStats;

  // Location & Availability
  location_lat?: number;
  location_lng?: number;
  mode: ('in-person' | 'online' | 'hybrid')[];
  available_slots?: Record<string, string[]>;

  // Languages
  languages: ProfessionalLanguage[];

  // Packages (available subscription plans)
  packages: ProfessionalPackageWithDetails[];

  // Recent reviews (last 5)
  recent_reviews: ProfessionalReview[];
}

/**
 * Search Query Params for Professional Directory
 */
export interface ProfessionalSearchParams {
  goal_categories?: string[]; // Fitness goals, dietary needs, etc.
  preferred_mode?: ('in-person' | 'online' | 'hybrid')[];
  preferred_languages?: string[]; // Language codes
  min_rating?: number;
  max_price?: number;
  radius_km?: number;
  availability_window_days?: number;
  limit?: number;
  offset?: number; // For pagination
  sort_by?: 'rating' | 'price' | 'distance' | 'reviews' | 'match_score';
}

/**
 * Search Result Item
 * Simplified view for search results/list display
 */
export interface ProfessionalSearchResult {
  id: string;
  name: string;
  avatar_url?: string;
  professional_type: 'coach' | 'dietician';
  specialties: string[];
  price: number;
  rating: number;
  review_count: number;
  distance_km?: number;
  mode: ('in-person' | 'online' | 'hybrid')[];
  languages: string[];
  match_score?: number;
  has_available_slots: boolean;
}

/**
 * Review Submission Form
 */
export interface ReviewSubmissionForm {
  professional_package_id: string;
  rating: number; // 1-5
  title: string;
  content: string;
}

/**
 * Professional Profile Edit Form (Coach/Dietician side)
 */
export interface ProfessionalProfileEditForm {
  name: string;
  bio?: string;
  experience_years?: number;
  specialties: string[];
  languages: Array<{
    language_code: string;
    language_name: string;
    proficiency_level: 'native' | 'fluent' | 'intermediate' | 'basic';
  }>;
  location_lat?: number;
  location_lng?: number;
  mode: ('in-person' | 'online' | 'hybrid')[];
  available_slots?: Record<string, string[]>;
}

/**
 * Subscription for purchasing a professional package
 */
export interface ProfessionalPackageSubscription {
  id: string;
  professional_package_id: string;
  subscriber_user_id: string;
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

/**
 * Directory UI - ProfessionalCard Props
 */
export interface ProfessionalCardProps {
  professional: ProfessionalSearchResult;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

/**
 * Directory UI - Search Filter State
 */
export interface DirectorySearchFilters {
  searchQuery: string;
  goalCategories: string[];
  preferredMode: ('in-person' | 'online' | 'hybrid')[];
  preferredLanguages: string[];
  minRating: number;
  maxPrice: number;
  radiusKm: number;
  sortBy: 'rating' | 'price' | 'distance';
}
