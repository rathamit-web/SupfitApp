/**
 * NAVIGATION DATA TRANSFER OBJECTS (DTOs)
 * Type-safe route parameters with Zod validation
 * 
 * Issue #3 Fix: Route Param Contract Not Versioned
 * Issue #6 Fix: PII in Route Params
 * 
 * RULE: All route.params must be validated with Zod
 *       NO PII (email, phone, notes) in route params
 *       Routes pass IDs only, fetch sensitive data in-component
 * 
 * Date: 2026-02-09
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// VERSION 1 SCHEMAS (Current)
// ═══════════════════════════════════════════════════════════════

/**
 * FindCoaches route params (from SelectCoach)
 * Minimal params info
 */
export const FindCoachesParamsV1 = z.object({
  source: z.enum(['SelectCoach', 'Home', 'DeepLink']).optional(),
  timestamp: z.number().optional(),
}).strict();

export type FindCoachesParams = z.infer<typeof FindCoachesParamsV1>;

/**
 * SearchResults route params (from FindCoaches after filtering)
 * Contains filter context that led to results
 */
export const SearchResultsParamsV1 = z.object({
  selectedGoals: z.array(z.string().min(1)).min(1, 'At least one goal required'),
  filters: z.object({
    preferredMode: z.array(z.enum(['online', 'in_person', 'hybrid'])).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPrice: z.number().positive().optional(),
    radiusKm: z.number().nonnegative().optional(),
    languages: z.array(z.string()).optional(),
  }).optional(),
  matchLogic: z.enum(['AND', 'OR', 'ANY']).default('ANY'),
  page: z.number().int().positive().default(1),
}).strict();

export type SearchResultsParams = z.infer<typeof SearchResultsParamsV1>;

/**
 * ProfessionalDetail route params (from SearchResults card click)
 * CRITICAL: NO PII fields here!
 * 
 * Safe fields only:
 * - professional_id (UUID for fetching)
 * - name (for display)
 * - rating (for display)
 * - price (for display)
 * 
 * NOT included (fetch with RLS inside component):
 * - email (sensitive)
 * - phone (sensitive)
 * - private_notes (professional-only)
 * - payment_info (sensitive)
 */
export const ProfessionalDetailParamsV1 = z.object({
  professionalId: z.string().uuid('Invalid professional ID format'),
  // Optional: Passed data from search for instant display
  passedProfessional: z.object({
    professional_id: z.string().uuid(),
    name: z.string().min(1, 'Name required'),
    description: z.string().min(1, 'Description required'),
    price: z.number().positive('Price must be positive'),
    rating: z.number().min(0).max(5).nullable(),
    review_count: z.number().nonnegative(),
    specialties: z.array(z.string().min(1)),
    mode: z.array(z.enum(['online', 'in_person', 'hybrid'])).min(1),
    distance_km: z.number().nonnegative().nullable(),
    match_score: z.number().min(0).max(100),
    photo_url: z.string().url().optional(),
    // EXPLICITLY NOT included: email, phone, private_notes, payment info
  }).strict().optional(),
}).strict();

export type ProfessionalDetailParams = z.infer<typeof ProfessionalDetailParamsV1>;

/**
 * Booking route params (from ProfessionalDetail select package)
 */
export const BookingParamsV1 = z.object({
  professionalId: z.string().uuid(),
  packageId: z.string().uuid(),
  packageName: z.string().min(1),
  packagePrice: z.number().positive(),
}).strict();

export type BookingParams = z.infer<typeof BookingParamsV1>;

// ═══════════════════════════════════════════════════════════════
// MIGRATION HELPERS (For future breaking changes)
// ═══════════════════════════════════════════════════════════════

/**
 * Safely parse route params with fallback to previous version
 * If new schema fails, tries old schema and migrates
 */
export const safeParseProfessionalDetailParams = (params: any) => {
  try {
    // Try V1 first
    return { params: ProfessionalDetailParamsV1.parse(params), version: 1 };
  } catch (e) {
    // Log version negotiation for analytics
    console.warn('Failed to parse ProfessionalDetail params as V1:', e);
    throw e; // Re-throw if no fallback version exists
  }
};

export const safeParseSearchResultsParams = (params: any) => {
  try {
    return { params: SearchResultsParamsV1.parse(params), version: 1 };
  } catch (e) {
    console.warn('Failed to parse SearchResults params as V1:', e);
    throw e;
  }
};

export const safeParseBookingParams = (params: any) => {
  try {
    return { params: BookingParamsV1.parse(params), version: 1 };
  } catch (e) {
    console.warn('Failed to parse Booking params as V1:', e);
    throw e;
  }
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Validates route params and returns type-safe object
 * Use before any navigation.navigate() call
 */
export const validateRouteParams = <T extends z.ZodSchema>(
  schema: T,
  params: any,
  routeName: string,
): T['_output'] => {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(
        `Invalid params for route "${routeName}": ${fieldErrors}`,
      );
    }
    throw error;
  }
};

/**
 * Creates safe navigation params, validates before use
 */
export const createNavigationParams = <T extends z.ZodSchema>(
  schema: T,
  data: any,
  routeName: string,
): T['_output'] => {
  try {
    const validatedParams = schema.parse(data);
    console.debug(`✅ Valid params for ${routeName}:`, validatedParams);
    return validatedParams;
  } catch (error) {
    console.error(`❌ Invalid params for ${routeName}:`, error);
    if (error instanceof z.ZodError) {
      // Return which field failed and why
      const issues = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        received: JSON.stringify(e.code === 'invalid_type' ? 'wrong type' : e.code),
      }));
      throw new Error(
        `Navigation validation failed for ${routeName}:\n${JSON.stringify(issues, null, 2)}`,
      );
    }
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * EXAMPLE: Safe navigation from SearchResultsNative to ProfessionalDetailNative
 * 
 * const handlePressCard = (professional: Professional) => {
 *   try {
 *     // Create params
 *     const params = createNavigationParams(
 *       ProfessionalDetailParamsV1,
 *       {
 *         professionalId: professional.professional_id,
 *         passedProfessional: {
 *           professional_id: professional.professional_id,
 *           name: professional.name,
 *           description: professional.description,
 *           price: professional.price,
 *           rating: professional.rating,
 *           review_count: professional.review_count,
 *           specialties: professional.specialties,
 *           mode: professional.mode,
 *           distance_km: professional.distance_km,
 *           match_score: professional.match_score,
 *           photo_url: professional.photo_url,
 *           // NOT passing: email, phone, private_notes
 *         },
 *       },
 *       'ProfessionalDetail',
 *     );
 * 
 *     // Navigate after validation
 *     navigation.navigate('ProfessionalDetail', params);
 *   } catch (error) {
 *     console.error('Navigation failed:', error);
 *     Toast.show('Navigation error', { duration: Toast.durations.SHORT });
 *   }
 * };
 */

/**
 * EXAMPLE: Type-safe route param usage in screen
 * 
 * const ProfessionalDetailNative = ({ route }) => {
 *   // Validate and destructure with full type safety
 *   const { professionalId, passedProfessional } = validateRouteParams(
 *     ProfessionalDetailParamsV1,
 *     route.params,
 *     'ProfessionalDetail',
 *   );
 * 
 *   // Now TypeScript knows exact shape
 *   const [professional, setProfessional] = useState<Professional | null>(
 *     passedProfessional || null,
 *   );
 * 
 *   // Sensitive data fetched securely inside component
 *   useEffect(() => {
 *     const fetchFull = async () => {
 *       const { data } = await supabaseClient
 *         .from('professional_packages')
 *         .select('*')
 *         .eq('id', professionalId)
 *         .single();
 *       // RLS filters sensitive fields
 *       setProfessional(data);
 *     };
 *     fetchFull();
 *   }, [professionalId]);
 * };
 */
