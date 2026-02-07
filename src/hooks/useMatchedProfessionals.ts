import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/shared/supabaseClient';

export interface SignalScore {
  score: number;
  weight: number;
  explanation: string;
}

export interface MatchResult {
  professional_id: string;
  name: string;
  avatar: string | null;
  location: { lat: number; lng: number };
  distance_km: number;
  price: number;
  rating: number;
  review_count: number;
  specialties: string[];
  available_slot: string | null;
  overall_score: number;
  signal_breakdown: {
    proximity: SignalScore;
    goal_alignment: SignalScore;
    budget_fit: SignalScore;
    rating: SignalScore;
    availability: SignalScore;
  };
  matched_at: string;
}

export interface MatchFilters {
  min_rating?: number;
  max_price?: number;
  available_today?: boolean;
}

export interface MatchedProfessionalsResponse {
  success: boolean;
  data: MatchResult[];
  count: number;
  error?: string;
}

/**
 * React Hook: Fetch matched professionals for a user
 * 
 * Uses TanStack React Query for caching, deduplication, and state management
 * 
 * @param userId - The user ID to match professionals for
 * @param professionalType - Optional filter: 'coach' | 'nutritionist' | 'physiotherapist' | 'yoga' | 'gym'
 * @param filters - Optional filters for min_rating, max_price, available_today
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with data, isLoading, error, etc.
 * 
 * @example
 * const { data: professionals, isLoading, error } = useMatchedProfessionals(
 *   userId,
 *   'coach',
 *   { min_rating: 4, max_price: 5000 }
 * );
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorBoundary error={error} />;
 * 
 * return professionals.map(prof => (
 *   <MatchedProfessionalCard key={prof.professional_id} professional={prof} />
 * ));
 */
export function useMatchedProfessionals(
  userId: string | undefined | null,
  professionalType?: string,
  filters?: MatchFilters,
  enabled: boolean = true
): UseQueryResult<MatchResult[], Error> {
  return useQuery<MatchResult[], Error>({
    queryKey: [
      'matchedProfessionals',
      userId,
      professionalType,
      JSON.stringify(filters || {}),
    ],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      try {
        // Get the current session to get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Call edge function
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/match-professionals`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              professional_type: professionalType,
              limit: 10,
              filters: filters,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch matched professionals');
        }

        const result: MatchedProfessionalsResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Match algorithm returned error');
        }

        return result.data;
      } catch (error) {
        console.error('Error fetching matched professionals:', error);
        throw error instanceof Error ? error : new Error('Unknown error');
      }
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - results stay fresh for 5 min
    gcTime: 30 * 60 * 1000, // 30 minutes - cache for 30 min before garbage collection
    retry: 1, // Retry once on failure
    placeholderData: (previousData) => previousData, // Keep showing old data while refetching
  });
}

/**
 * Advanced hook variant: Infinite scroll support for paginated results
 */
export function useMatchedProfessionalsInfinite(
  userId: string | undefined | null,
  professionalType?: string,
  filters?: MatchFilters
) {
  // For now, this returns a single page
  // In Phase 4, this can be extended to use useInfiniteQuery for pagination
  return useMatchedProfessionals(userId, professionalType, filters);
}

/**
 * Utility hook: Prefetch matches (for optimistic UI updates)
 */
import { useQueryClient } from '@tanstack/react-query';

export function usePrefetchMatchedProfessionals() {
  const queryClient = useQueryClient();

  return async (
    userId: string,
    professionalType?: string,
    filters?: MatchFilters
  ) => {
    await queryClient.prefetchQuery({
      queryKey: [
        'matchedProfessionals',
        userId,
        professionalType,
        JSON.stringify(filters || {}),
      ],
      queryFn: async () => {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/match-professionals`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              professional_type: professionalType,
              limit: 10,
              filters: filters,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to prefetch');
        const result = await response.json();
        return result.data;
      },
    });
  };
}

/**
 * Utility: Clear matched professionals cache (e.g., after user updates profile)
 */
export function useClearMatchCache() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.removeQueries({
      queryKey: ['matchedProfessionals', userId],
      exact: false,
    });
  };
}
