/**
 * NAVIGATION TYPES - Route Parameters with Zod Validation
 *
 * This file defines typed contracts for navigation parameters.
 * Ensures type safety and catches breaking changes at compile time.
 *
 * Versioning strategy:
 * - V1 = current production version
 * - V2 = future version (adds fields backwards-compatibly)
 * - Migration: Try V2, fallback to V1 with defaults
 *
 * Usage:
 *   const params = ProfessionalDetailParamsV1.parse(route.params);
 *   // Now TypeScript knows exact shape, validated at runtime
 */

import { z } from 'zod';

// ============================================================================
// VERSION 1: Professional Detail Route Params (Current)
// ============================================================================

export const ProfessionalDetailParamsV1 = z.object({
  professionalId: z
    .string()
    .uuid('Invalid professional ID format'),

  // Safe fields only - NO PII
  professional: z.object({
    professional_id: z.string().uuid(),
    name: z.string().min(1, 'Name required'),
    description: z.string(),
    price: z.number().positive('Price must be positive'),
    rating: z.number().min(0).max(5).nullable(),
    review_count: z.number().nonnegative(),
    specialties: z.array(z.string()),
    mode: z.array(z.string()),
    distance_km: z.number().nonnegative(),
    match_score: z.number().min(0).max(200), // 0-200 scale from RPC
    photo_url: z.string().url().optional(),
    // NOTE: email, phone, private_notes are NEVER included
  }).strict(), // strict = no extra fields allowed

  // Optional: Track source for analytics
  source: z.enum(['SearchResults', 'FindCoaches', 'Favorites']).optional(),
});

export type ProfessionalDetailParamsV1 = z.infer<typeof ProfessionalDetailParamsV1>;

// ============================================================================
// VERSION 2: Professional Detail Route Params (Future)
// ============================================================================
// Example of how versioning works for future-proof APIs

export const ProfessionalDetailParamsV2 = z.object({
  professionalId: z.string().uuid('Invalid professional ID format'),

  professional: z.object({
    professional_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    rating: z.number().min(0).max(5).nullable(),
    review_count: z.number().nonnegative(),
    specialties: z.array(z.string()),
    mode: z.array(z.string()),
    distance_km: z.number().nonnegative(),
    match_score: z.number().min(0).max(200),
    photo_url: z.string().url().optional(),
    // NEW in V2: availability_status
    availability_status: z.enum(['available', 'booked', 'unavailable']).optional(),
  }).strict(),

  source: z.enum(['SearchResults', 'FindCoaches', 'Favorites']).optional(),
});

export type ProfessionalDetailParamsV2 = z.infer<typeof ProfessionalDetailParamsV2>;

// ============================================================================
// VERSIONED PARSING (Try newest first, fallback to older)
// ============================================================================

/**
 * Smart parser that handles multiple versions
 * Enables gradual rollouts without coordinated deployments
 */
export const parseProfessionalDetailParams = (
  params: any
): ProfessionalDetailParamsV2 => {
  // Try V2 first (newest)
  const resultV2 = ProfessionalDetailParamsV2.safeParse(params);
  if (resultV2.success) {
    return resultV2.data;
  }

  // Fallback to V1 (legacy), migrate to V2 format
  const resultV1 = ProfessionalDetailParamsV1.safeParse(params);
  if (resultV1.success) {
    // Auto-migrate V1 → V2 with defaults
    const migrated: ProfessionalDetailParamsV2 = {
      ...resultV1.data,
      professional: {
        ...resultV1.data.professional,
        availability_status: 'available', // Default for V1 data
      },
    };
    return migrated;
  }

  // No version matched - throw detailed error
  throw new Error(
    `Invalid ProfessionalDetail params. Errors:\n` +
    `V2: ${resultV2.error?.message}\n` +
    `V1: ${resultV1.error?.message}`
  );
};

// ============================================================================
// SEARCH RESULTS ROUTE PARAMS
// ============================================================================

export const SearchResultsParamsV1 = z.object({
  selectedGoals: z.array(z.string()).min(1, 'At least one goal required'),

  filters: z.object({
    preferredMode: z.array(z.string()).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPrice: z.number().positive().optional(),
    radiusKm: z.number().positive().optional(),
  }).optional(),

  // Track source for analytics
  source: z.enum(['FindCoaches', 'SearchCriteria']).optional(),
});

export type SearchResultsParamsV1 = z.infer<typeof SearchResultsParamsV1>;

// ============================================================================
// FIND COACHES ROUTE PARAMS
// ============================================================================

export const FindCoachesParamsV1 = z.object({
  source: z.enum(['SelectCoach', 'AppTab', 'DeepLink']).optional(),
  autoOpenFilters: z.boolean().optional().default(false),
}).optional();

export type FindCoachesParamsV1 = z.infer<typeof FindCoachesParamsV1>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Safely parse route params with error reporting
 * Use in screen components during navigation
 */
export const validateRouteParams = <T extends z.ZodType>(
  params: any,
  schema: T,
  screenName: string
): z.infer<T> | null => {
  const result = schema.safeParse(params);

  if (!result.success) {
    console.error(
      `❌ Invalid route params for ${screenName}:\n`,
      result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n')
    );
    return null;
  }

  return result.data;
};

/**
 * Create typed route params builder (prevents typos)
 */
export const buildProfessionalDetailParams = (
  professionalId: string,
  professional: Omit<ProfessionalDetailParamsV1['professional'], 'professional_id'> & {
    professional_id: string;
  }
): ProfessionalDetailParamsV1 => {
  return ProfessionalDetailParamsV1.parse({
    professionalId,
    professional,
  });
};

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * HOW TO USE NAVIGATION TYPES
 *
 * 1. IN NAVIGATION SOURCE (SearchResults):
 *    ```tsx
 *    const handlePressCard = (professional: Professional) => {
 *      // Build params with type safety
 *      const params = buildProfessionalDetailParams(
 *        professional.professional_id,
 *        {
 *          professional_id: professional.professional_id,
 *          name: professional.name,
 *          price: professional.price,
 *          // Only safe fields - no email/phone!
 *        }
 *      );
 *
 *      navigation.navigate('ProfessionalDetail', params);
 *    };
 *    ```
 *
 * 2. IN NAVIGATION TARGET (ProfessionalDetail):
 *    ```tsx
 *    const ProfessionalDetailNative = ({ route }) => {
 *      // Safely parse params
 *      const params = parseProfessionalDetailParams(route.params);
 *
 *      // Now TypeScript knows exact shape
 *      const { professionalId, professional } = params;
 *      // professional.name ✅ exists
 *      // professional.email ❌ never exists (not in schema)
 *    };
 *    ```
 *
 * 3. HANDLING VALIDATION ERRORS:
 *    ```tsx
 *    try {
 *      const params = parseProfessionalDetailParams(route.params);
 *      // Use params
 *    } catch (error) {
 *      // Show user-friendly error
 *      Toast.show('Navigation error: unable to load professional');
 *      navigation.goBack();
 *    }
 *    ```
 *
 * 4. FUTURE: ADDING V2:
 *    ```tsx
 *    // V2 params automatically migrate from V1
 *    const v2Params = parseProfessionalDetailParams(legacyV1Params);
 *    // availability_status defaults to 'available' if missing
 *    ```
 */

export default {
  ProfessionalDetailParamsV1,
  ProfessionalDetailParamsV2,
  SearchResultsParamsV1,
  FindCoachesParamsV1,
  parseProfessionalDetailParams,
  validateRouteParams,
  buildProfessionalDetailParams,
};
