/**
 * Phase 2: Professional Directory Hooks
 * React Query hooks for fetching professionals, reviews, languages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import type {
  ProfessionalPackageWithDetails,
  ProfessionalProfile,
  ProfessionalSearchParams,
  ProfessionalSearchResult,
  ProfessionalReview,
  ProfessionalLanguage,
  ReviewSubmissionForm,
  ProfessionalReviewStats,
} from '@/types/phase2';

// ============================================
// Search Professionals
// ============================================

/**
 * Hook: Search professionals by goals with multi-criteria filtering
 * Uses search_professionals_by_goals() RPC function
 */
export function useProfessionalSearch(params: ProfessionalSearchParams) {
  const {
    goal_categories = [],
    preferred_mode,
    preferred_languages,
    min_rating = 0,
    max_price = 999999,
    radius_km = 10,
    availability_window_days = 14,
    limit = 20,
    offset = 0,
  } = params;

  return useQuery({
    queryKey: [
      'professionals',
      'search',
      {
        goal_categories,
        preferred_mode,
        preferred_languages,
        min_rating,
        max_price,
        radius_km,
        limit,
        offset,
      },
    ],
    queryFn: async () => {
      // First, get user's location from profile
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the search function
      const { data, error } = await supabaseClient.rpc('search_professionals_by_goals', {
        p_user_id: user.id,
        p_goal_categories: goal_categories,
        p_preferred_mode: preferred_mode || null,
        p_preferred_timing: null,
        p_min_rating: min_rating,
        p_max_price: max_price,
        p_radius_km: radius_km,
        p_limit: limit,
        p_availability_window_days: availability_window_days,
      });

      if (error) throw error;

      // Enrich with languages and reviews
      const enriched = await Promise.all(
        data.map(async (prof) => {
          const [languages, reviewStats] = await Promise.all([
            fetchProfessionalLanguages(prof.professional_id),
            fetchReviewStats(prof.professional_id),
          ]);

          return {
            id: prof.professional_id,
            name: prof.name,
            avatar_url: undefined, // Get from user profile
            professional_type: prof.mode.includes('coaching') ? 'coach' : 'coach',
            specialties: prof.specialties || [],
            price: prof.price,
            rating: reviewStats?.avg_rating || 0,
            review_count: reviewStats?.total_reviews || 0,
            distance_km: prof.distance_km,
            mode: prof.mode,
            languages: languages.map((l) => l.language_code),
            match_score: prof.match_score,
            has_available_slots: !!prof.available_slots,
          } as ProfessionalSearchResult;
        })
      );

      return enriched;
    },
  });
}

// ============================================
// Fetch Individual Professional Profile
// ============================================

/**
 * Hook: Get complete professional profile with all details
 */
export function useProfessionalProfile(professionalPackageId: string) {
  return useQuery({
    queryKey: ['professional', 'profile', professionalPackageId],
    queryFn: async () => {
      // Fetch package with relationships
      const { data: packageData, error: pkgError } = await supabaseClient
        .from('professional_packages')
        .select('*')
        .eq('id', professionalPackageId)
        .single();

      if (pkgError || !packageData) throw new Error('Package not found');

      // Fetch related data in parallel
      const [languages, reviews, reviewStats, userProfile] = await Promise.all([
        fetchProfessionalLanguages(professionalPackageId),
        fetchProfessionalReviews(professionalPackageId, 'approved'),
        fetchReviewStats(professionalPackageId),
        fetchUserProfile(packageData.owner_user_id),
      ]);

      return {
        id: packageData.id,
        owner_user_id: packageData.owner_user_id,
        name: packageData.name,
        avatar_url: userProfile?.avatar_url,
        bio: userProfile?.bio,
        professional_type: packageData.professional_type,
        specialties: packageData.specialties || [],
        experience_years: packageData.experience_years,
        rating: packageData.rating || 0,
        review_count: packageData.review_count || 0,
        review_stats: reviewStats,
        location_lat: packageData.location_lat,
        location_lng: packageData.location_lng,
        mode: packageData.mode || [],
        available_slots: packageData.available_slots,
        languages,
        packages: [packageData as ProfessionalPackageWithDetails],
        recent_reviews: reviews.slice(0, 5),
      } as ProfessionalProfile;
    },
  });
}

// ============================================
// Fetch Reviews
// ============================================

/**
 * Fetch reviews for a professional package
 */
async function fetchProfessionalReviews(
  professionalPackageId: string,
  status: string = 'approved'
) {
  const { data, error } = await supabaseClient
    .from('professional_reviews')
    .select('*')
    .eq('professional_package_id', professionalPackageId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as ProfessionalReview[];
}

/**
 * Hook: Use reviews for a professional
 */
export function useProfessionalReviews(
  professionalPackageId: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['professional', 'reviews', professionalPackageId, limit],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('professional_reviews')
        .select('*')
        .eq('professional_package_id', professionalPackageId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ProfessionalReview[];
    },
  });
}

// ============================================
// Fetch Languages
// ============================================

/**
 * Fetch languages for a professional
 */
async function fetchProfessionalLanguages(professionalPackageId: string) {
  const { data, error } = await supabaseClient
    .from('professional_languages')
    .select('*')
    .eq('professional_package_id', professionalPackageId);

  if (error) throw error;
  return data as ProfessionalLanguage[];
}

/**
 * Hook: Use languages for a professional
 */
export function useProfessionalLanguages(professionalPackageId: string) {
  return useQuery({
    queryKey: ['professional', 'languages', professionalPackageId],
    queryFn: () => fetchProfessionalLanguages(professionalPackageId),
  });
}

// ============================================
// Fetch Review Stats
// ============================================

/**
 * Fetch aggregate review stats
 */
async function fetchReviewStats(
  professionalPackageId: string
) {
  const { data, error } = await supabaseClient
    .from('professional_review_stats')
    .select('*')
    .eq('professional_package_id', professionalPackageId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // 404 is OK
  return (data || null) as ProfessionalReviewStats | null;
}

/**
 * Hook: Use review stats
 */
export function useReviewStats(professionalPackageId: string) {
  return useQuery({
    queryKey: ['professional', 'stats', professionalPackageId],
    queryFn: () => fetchReviewStats(professionalPackageId),
  });
}

// ============================================
// User Profile Helpers
// ============================================

/**
 * Fetch user profile
 */
async function fetchUserProfile(userId: string) {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // 404 is OK
  return data || null;
}

// ============================================
// Mutations: Submit Review
// ============================================

/**
 * Hook: Submit a review for a professional
 */
export function useSubmitReview(professionalPackageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: ReviewSubmissionForm) => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabaseClient
        .from('professional_reviews')
        .insert([
          {
            professional_package_id: form.professional_package_id,
            reviewer_user_id: user.id,
            rating: form.rating,
            title: form.title,
            content: form.content,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as ProfessionalReview;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['professional', 'reviews', professionalPackageId],
      });
      queryClient.invalidateQueries({
        queryKey: ['professional', 'stats', professionalPackageId],
      });
    },
  });
}

// ============================================
// Mutations: Update Helpful Count
// ============================================

/**
 * Hook: Mark review as helpful
 */
export function useMarkReviewHelpful(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseClient
        .from('professional_reviews')
        .update({ helpful_count: supabaseClient.raw('helpful_count + 1') })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['professional', 'reviews'],
      });
    },
  });
}

// ============================================
// Mutations: Professional Profile Update
// ============================================

/**
 * Hook: Update professional profile languages
 */
export function useUpdateProfessionalLanguages(professionalPackageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (languages: Array<{
      language_code: string;
      language_name: string;
      proficiency_level: 'native' | 'fluent' | 'intermediate' | 'basic';
    }>) => {
      // Delete existing languages
      await supabaseClient
        .from('professional_languages')
        .delete()
        .eq('professional_package_id', professionalPackageId);

      // Insert new languages
      const { data, error } = await supabaseClient
        .from('professional_languages')
        .insert(
          languages.map((lang) => ({
            professional_package_id: professionalPackageId,
            ...lang,
          }))
        )
        .select();

      if (error) throw error;
      return data as ProfessionalLanguage[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['professional', 'languages', professionalPackageId],
      });
    },
  });
}

// ============================================
// Queries: Get Paginated Results
// ============================================

/**
 * Hook: Infinite scroll professionals
 * Use with useInfiniteQuery for pagination
 */
export function useInfiniteProfessionalSearch(
  baseParams: Omit<ProfessionalSearchParams, 'offset'>
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['professionals', 'search', 'paginated', baseParams],
    queryFn: async () => {
      let allResults: ProfessionalSearchResult[] = [];
      let offset = 0;
      const limit = 20;
      let hasMore = true;

      while (hasMore && offset < 200) {
        // Limit to 200 results max for perf
        const params = { ...baseParams, offset, limit };
        const result = await supabaseClient.rpc('search_professionals_by_goals', {
          // ... call function
        });

        if (result.error || !result.data || result.data.length === 0) {
          hasMore = false;
        } else {
          allResults = [...allResults, ...(result.data || [])];
          offset += limit;
        }
      }

      return allResults;
    },
  });
}

// ============================================
// Query: Featured Professionals
// ============================================

/**
 * Hook: Get featured/trending professionals
 */
export function useFeaturedProfessionals(limit: number = 10) {
  return useQuery({
    queryKey: ['professionals', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('professional_packages')
        .select('*') // Get the fields we need
        .eq('visibility', 'public')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
