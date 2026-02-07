import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface MatchRequest {
  user_id: string;
  professional_type?: string;
  limit?: number;
  filters?: {
    min_rating?: number;
    max_price?: number;
    available_today?: boolean;
  };
}

interface SignalScore {
  score: number;
  weight: number;
  explanation: string;
}

interface MatchResult {
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

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ===== SIGNAL SCORING FUNCTIONS =====

/**
 * PROXIMITY SIGNAL (30% weight)
 * Score based on distance from user to professional
 */
function calculateProximityScore(
  distanceKm: number,
  preferredRadiusKm: number,
  userLocationQuality: number
): SignalScore {
  if (distanceKm > preferredRadiusKm) {
    return {
      score: 0,
      weight: 0.3,
      explanation: `${distanceKm.toFixed(1)} km outside ${preferredRadiusKm} km preference`,
    };
  }

  // Distance decay: 100 at 0km, 0 at radius
  const distanceScore = Math.max(
    0,
    100 - (distanceKm / preferredRadiusKm) * 100
  );

  // Adjust by user location quality (high quality = more confident)
  const qualityMultiplier = userLocationQuality / 100;
  const adjustedScore = distanceScore * qualityMultiplier;

  return {
    score: Math.min(100, adjustedScore),
    weight: 0.3,
    explanation: `${distanceKm.toFixed(1)} km away (quality adjusted)`,
  };
}

/**
 * GOAL ALIGNMENT SIGNAL (25% weight)
 * Score based on overlap between user goals and professional specialties
 */
function calculateGoalAlignmentScore(
  userGoals: string[],
  professionalSpecialties: string[]
): SignalScore {
  if (!userGoals || userGoals.length === 0) {
    return {
      score: 50, // neutral if no goals set
      weight: 0.25,
      explanation: "No fitness goals set for comparison",
    };
  }

  if (!professionalSpecialties || professionalSpecialties.length === 0) {
    return {
      score: 0,
      weight: 0.25,
      explanation: "Professional has no specialties listed",
    };
  }

  // Simple overlap: count matching goals
  const normalizedGoals = userGoals.map((g) => g.toLowerCase().trim());
  const normalizedSpecialties = professionalSpecialties.map((s) =>
    s.toLowerCase().trim()
  );

  const matches = normalizedGoals.filter((goal) =>
    normalizedSpecialties.some((spec) => spec.includes(goal) || goal.includes(spec))
  );

  const overlapPercentage = (matches.length / userGoals.length) * 100;

  return {
    score: Math.min(100, overlapPercentage),
    weight: 0.25,
    explanation: `${matches.length}/${userGoals.length} goals matched (${Math.round(overlapPercentage)}%)`,
  };
}

/**
 * BUDGET FIT SIGNAL (20% weight)
 * Binary: within budget = 100, outside = 0
 */
function calculateBudgetFitScore(
  professionalPrice: number,
  userBudgetMin: number,
  userBudgetMax: number
): SignalScore {
  const withinBudget =
    professionalPrice >= userBudgetMin &&
    professionalPrice <= userBudgetMax;

  if (withinBudget) {
    return {
      score: 100,
      weight: 0.2,
      explanation: `₹${professionalPrice} within ₹${userBudgetMin}-₹${userBudgetMax} budget`,
    };
  }

  const overage = professionalPrice > userBudgetMax
    ? professionalPrice - userBudgetMax
    : userBudgetMin - professionalPrice;

  return {
    score: 0,
    weight: 0.2,
    explanation: `₹${professionalPrice} vs ₹${userBudgetMin}-₹${userBudgetMax} (₹${overage} difference)`,
  };
}

/**
 * RATING & REVIEWS SIGNAL (15% weight)
 * Normalized rating (0-5 → 0-100) + bonus for high review count
 */
function calculateRatingScore(
  rating: number,
  reviewCount: number
): SignalScore {
  // Normalize 0-5 rating to 0-100
  const baseScore = (rating / 5) * 100;

  // Bonus points for high review count
  const reviewBonus = reviewCount > 10 ? 5 : 0;
  const finalScore = Math.min(100, baseScore + reviewBonus);

  return {
    score: finalScore,
    weight: 0.15,
    explanation: `${rating}/5 stars (${reviewCount} reviews)${reviewBonus > 0 ? ` +${reviewBonus} for popularity` : ""}`,
  };
}

/**
 * AVAILABILITY SIGNAL (10% weight)
 * Check if professional has available slots
 */
function calculateAvailabilityScore(
  availableSlots: any,
  nextAvailableSlot: string | null
): SignalScore {
  if (!nextAvailableSlot) {
    return {
      score: 0,
      weight: 0.1,
      explanation: "No available slots",
    };
  }

  // Parse the next available slot date
  const slotDate = new Date(nextAvailableSlot);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  slotDate.setHours(0, 0, 0, 0);

  const daysUntilSlot = Math.floor(
    (slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilSlot <= 1) {
    return {
      score: 100,
      weight: 0.1,
      explanation: `Available today/tomorrow at ${new Date(nextAvailableSlot).toLocaleTimeString()}`,
    };
  } else if (daysUntilSlot <= 7) {
    return {
      score: 50,
      weight: 0.1,
      explanation: `Available in ${daysUntilSlot} days`,
    };
  }

  return {
    score: 0,
    weight: 0.1,
    explanation: `Available in ${daysUntilSlot} days (too far)`,
  };
}

// ===== LOGGING & DATABASE FUNCTIONS =====

/**
 * Log signal calculation to match_signals_log for audit trail
 */
async function logSignalCalculation(
  userId: string,
  professionalId: string,
  signalName: string,
  score: number,
  reasoning: Record<string, any>
) {
  try {
    await supabase.from("match_signals_log").insert({
      user_id: userId,
      professional_id: professionalId,
      signal_name: signalName,
      signal_value: score,
      reasoning: reasoning,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error logging signal ${signalName}:`, error);
    // Don't throw - logging failure shouldn't block matching
  }
}

/**
 * Log overall match result for analytics
 */
async function logMatchResult(
  userId: string,
  resultSnapshot: MatchResult[]
) {
  try {
    await supabase.from("match_signals_log").insert({
      user_id: userId,
      signal_name: "match_results_snapshot",
      signal_value: resultSnapshot.length,
      reasoning: {
        top_match_score: resultSnapshot[0]?.overall_score || 0,
        total_matches: resultSnapshot.length,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging match results:", error);
  }
}

/**
 * Check cache for recent matches
 */
async function getCachedMatches(
  userId: string,
  professionalType: string | undefined
): Promise<MatchResult[] | null> {
  try {
    const cacheKey = professionalType
      ? `${userId}:${professionalType}`
      : `${userId}:all`;

    const { data, error } = await supabase
      .from("match_cache")
      .select("results_snapshot, expires_at")
      .eq("user_id", userId)
      .eq("professional_type", professionalType || "all")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.results_snapshot as MatchResult[];
  } catch (error) {
    console.log("Cache miss:", error);
    return null;
  }
}

/**
 * Update cache with new matches
 */
async function updateMatchCache(
  userId: string,
  professionalType: string | undefined,
  results: MatchResult[],
  userActivityLevel: string
) {
  try {
    // Determine TTL based on user activity level
    const ttlHours =
      userActivityLevel === "high"
        ? 6
        : userActivityLevel === "medium"
          ? 24
          : 72;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await supabase.from("match_cache").upsert(
      {
        user_id: userId,
        professional_type: professionalType || "all",
        results_snapshot: results,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,professional_type",
      }
    );
  } catch (error) {
    console.error("Error updating cache:", error);
  }
}

// ===== MAIN MATCHING ENGINE =====

async function matchProfessionals(
  request: MatchRequest
): Promise<MatchResult[]> {
  const {
    user_id,
    professional_type,
    limit = 10,
    filters = {},
  } = request;

  // Step 1: Get user data
  const { data: userData, error: userError } = await supabase
    .from("user_profiles")
    .select(
      `
      id,
      location_geo,
      location_quality_score,
      preferred_radius_km,
      budget_min,
      budget_max,
      fitness_goals
    `
    )
    .eq("id", user_id)
    .single();

  if (userError || !userData) {
    throw new Error(`User not found: ${user_id}`);
  }

  // Extract user data
  const userLocation = userData.location_geo;
  const userLocationQuality = userData.location_quality_score || 75;
  const userPreferredRadius = userData.preferred_radius_km || 5;
  const userBudgetMin = userData.budget_min || 500;
  const userBudgetMax = userData.budget_max || 10000;
  const userGoals = userData.fitness_goals || [];

  // Step 2: Get professional activity cohort (for cache TTL)
  const { data: activityData } = await supabase
    .from("user_activity_log")
    .select("event_type")
    .eq("user_id", user_id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  const activityCount = activityData?.length || 0;
  const userActivityLevel =
    activityCount > 20 ? "high" : activityCount > 5 ? "medium" : "low";

  // Step 3: Check cache
  const cached = await getCachedMatches(user_id, professional_type);
  if (cached) {
    console.log("Returning cached matches");
    return cached.slice(0, limit);
  }

  // Step 4: Query professionals within radius
  let query = supabase
    .from("professional_packages")
    .select(
      `
      id,
      professional_id,
      name,
      avatar,
      location_geo,
      price,
      rating,
      review_count,
      specialties,
      available_slots
    `
    )
    .gt("rating", filters.min_rating || 0)
    .lt("price", filters.max_price || 999999);

  // Add professional type filter if specified
  if (professional_type) {
    query = query.contains("specialties", [professional_type]);
  }

  const { data: professionals, error: proError } = await query.limit(100);

  if (proError) {
    throw new Error(`Error querying professionals: ${proError.message}`);
  }

  if (!professionals || professionals.length === 0) {
    return [];
  }

  // Step 5: Score each professional
  const scoredProfessionals: (MatchResult & { _score: number })[] = [];

  for (const pro of professionals) {
    try {
      // Calculate distance using PostGIS (ST_Distance returns meters)
      const { data: distanceResult, error: distError } = await supabase.rpc(
        "st_distance",
        {
          point_a: userLocation,
          point_b: pro.location_geo,
        }
      );

      if (distError || distanceResult === undefined) {
        console.warn(
          `Could not calculate distance for professional ${pro.id}`
        );
        continue;
      }

      const distanceKm = distanceResult / 1000; // Convert meters to km

      // Skip if outside radius
      if (distanceKm > userPreferredRadius) {
        continue;
      }

      // Get next available slot
      const availableSlots = pro.available_slots || {};
      const nextSlot =
        Object.values(availableSlots).find(
          (slot: any) => new Date(slot) > new Date()
        ) || null;

      // Calculate all 5 signals
      const proximitySignal = calculateProximityScore(
        distanceKm,
        userPreferredRadius,
        userLocationQuality
      );
      const goalSignal = calculateGoalAlignmentScore(
        userGoals,
        pro.specialties || []
      );
      const budgetSignal = calculateBudgetFitScore(
        pro.price,
        userBudgetMin,
        userBudgetMax
      );
      const ratingSignal = calculateRatingScore(pro.rating || 0, pro.review_count || 0);
      const availabilitySignal = calculateAvailabilityScore(
        availableSlots,
        nextSlot
      );

      // Calculate composite score
      const overallScore =
        proximitySignal.score * proximitySignal.weight +
        goalSignal.score * goalSignal.weight +
        budgetSignal.score * budgetSignal.weight +
        ratingSignal.score * ratingSignal.weight +
        availabilitySignal.score * availabilitySignal.weight;

      const result: MatchResult & { _score: number } = {
        professional_id: pro.id,
        name: pro.name,
        avatar: pro.avatar,
        location: {
          lat: pro.location_geo?.coordinates[1] || 0,
          lng: pro.location_geo?.coordinates[0] || 0,
        },
        distance_km: distanceKm,
        price: pro.price,
        rating: pro.rating || 0,
        review_count: pro.review_count || 0,
        specialties: pro.specialties || [],
        available_slot: nextSlot ? new Date(nextSlot as string).toLocaleString() : null,
        overall_score: Math.round(overallScore * 100) / 100,
        signal_breakdown: {
          proximity: proximitySignal,
          goal_alignment: goalSignal,
          budget_fit: budgetSignal,
          rating: ratingSignal,
          availability: availabilitySignal,
        },
        matched_at: new Date().toISOString(),
        _score: overallScore,
      };

      // Log signals to audit trail
      await logSignalCalculation(user_id, pro.id, "proximity", proximitySignal.score, {
        distance_km: distanceKm,
        preferred_radius: userPreferredRadius,
      });
      await logSignalCalculation(user_id, pro.id, "goal_alignment", goalSignal.score, {
        user_goals: userGoals,
        professional_specialties: pro.specialties,
      });
      await logSignalCalculation(user_id, pro.id, "budget_fit", budgetSignal.score, {
        professional_price: pro.price,
        user_budget_min: userBudgetMin,
        user_budget_max: userBudgetMax,
      });
      await logSignalCalculation(user_id, pro.id, "rating", ratingSignal.score, {
        rating: pro.rating,
        review_count: pro.review_count,
      });
      await logSignalCalculation(user_id, pro.id, "availability", availabilitySignal.score, {
        next_available_slot: nextSlot,
      });

      scoredProfessionals.push(result);
    } catch (error) {
      console.error(`Error scoring professional ${pro.id}:`, error);
      continue;
    }
  }

  // Step 6: Sort by score (descending) and apply limit
  const results = scoredProfessionals
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);

  // Step 7: Update cache
  await updateMatchCache(user_id, professional_type, results, userActivityLevel);

  // Step 8: Log overall result
  await logMatchResult(user_id, results);

  return results;
}

// ===== HTTP HANDLER =====

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: MatchRequest = await req.json();

    // Validate required fields
    if (!body.user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call matching engine
    const results = await matchProfessionals(body);

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        count: results.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Match algorithm error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Deno Deploy compatibility
export default serve;
