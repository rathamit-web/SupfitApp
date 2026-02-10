/**
 * RLS SECURITY MATRIX - Field Access Control
 * Row-Level Security policies and field visibility
 * 
 * Issue #5 Fix: RLS Enforcement Not Documented
 * 
 * Defines which fields are visible to different user roles
 * enforced at the Supabase RLS policy level.
 * 
 * Date: 2026-02-09
 */

// ═══════════════════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export enum UserRole {
  GUEST = 'guest',                  // Not authenticated
  CLIENT = 'client',                // Regular user (seeking coaches)
  PROFESSIONAL = 'professional',    // Coach/trainer
  ADMIN = 'admin',                  // System administrator
}

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL_PACKAGES TABLE
// ═══════════════════════════════════════════════════════════════

export const PROFESSIONAL_PACKAGES_FIELD_ACCESS = {
  table: 'professional_packages',
  description: 'Coach profiles and public information',

  fields: {
    id: {
      type: 'UUID',
      public: true,
      description: 'Primary key',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    owner_user_id: {
      type: 'UUID',
      public: false,
      description: 'FK to auth.users - WHO OWNS THIS PROFILE',
      note: 'Only coach owning profile can see their own ID; never expose to other users',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
    },

    name: {
      type: 'TEXT',
      public: true,
      description: 'Coach name',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    description: {
      type: 'TEXT',
      public: true,
      description: 'Coach bio/description',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    specialties: {
      type: 'TEXT[]',
      public: true,
      description: 'Array of specialty categories (weight_loss, muscle_gain, etc)',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    mode: {
      type: 'TEXT[]',
      public: true,
      description: 'Service modes: ["online", "in_person", "hybrid"]',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    price: {
      type: 'NUMERIC',
      public: true,
      description: 'Base package price',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    rating: {
      type: 'NUMERIC(2,1)',
      public: true,
      description: 'Average rating from reviews (0-5)',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    review_count: {
      type: 'INTEGER',
      public: true,
      description: 'Number of approved reviews',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    photo_url: {
      type: 'TEXT (URL)',
      public: true,
      description: 'Coach profile photo URL',
      access: { [UserRole.GUEST]: true, [UserRole.CLIENT]: true, [UserRole.PROFESSIONAL]: true, [UserRole.ADMIN]: true },
    },

    status: {
      type: 'ENUM (active, inactive, suspended)',
      public: false,
      description: 'Profile status - filtering at query level',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'Only return items where status = "active" in RLS policy',
    },

    visibility: {
      type: 'ENUM (public, private, hidden)',
      public: false,
      description: 'Profile visibility setting',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'Only return items where visibility = "public" in RLS policy',
    },

    email: {
      type: 'TEXT (EMAIL)',
      public: false,
      sensitive: true,
      description: 'Coach email address - DO NOT EXPOSE',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'NEVER include in REST queries or RPC results. Only fetch via authenticated endpoint if coach logs in.',
    },

    phone: {
      type: 'TEXT (PHONE)',
      public: false,
      sensitive: true,
      description: 'Coach phone number - DO NOT EXPOSE',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'NEVER include in search RPC. Only coach owns can see their own.',
    },

    private_notes: {
      type: 'TEXT',
      public: false,
      sensitive: true,
      description: 'Internal notes about coach (e.g., VIP, preferred, etc)',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'NEVER expose. Only coach owner can see their own notes.',
    },

    response_rate: {
      type: 'NUMERIC(3,1)',
      public: false,
      description: 'Coach response rate % (70-100)',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'Coach visibility only (own profile). Not exposed in search.',
    },

    response_time_avg_hours: {
      type: 'NUMERIC',
      public: false,
      description: 'Average response time in hours',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'Coach visibility only. Not exposed to clients.',
    },

    created_at: {
      type: 'TIMESTAMP',
      public: false,
      description: 'Profile creation date',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
      note: 'Metadata only. Can be useful for sorting but not user-facing.',
    },

    updated_at: {
      type: 'TIMESTAMP',
      public: false,
      description: 'Profile last updated timestamp',
      access: { [UserRole.GUEST]: false, [UserRole.CLIENT]: false, [UserRole.PROFESSIONAL]: 'own_only', [UserRole.ADMIN]: true },
    },
  } as const,

  // RLS Policies required:
  rls_policies: [
    {
      name: 'professional_packages_select_public',
      description: 'Clients can see active, public coach profiles',
      effect: `
        SELECT * FROM professional_packages
        WHERE visibility = 'public' AND status = 'active'
      `,
      for: ['SELECT'],
      to: [UserRole.CLIENT, UserRole.GUEST],
    },
    {
      name: 'professional_packages_select_own',
      description: 'Coaches can see their own profile (including private fields)',
      effect: `
        SELECT * FROM professional_packages
        WHERE owner_user_id = auth.uid()
      `,
      for: ['SELECT'],
      to: [UserRole.PROFESSIONAL],
    },
    {
      name: 'professional_packages_update_own',
      description: 'Coaches can update only their own profile',
      effect: `
        UPDATE professional_packages
        SET ... WHERE owner_user_id = auth.uid()
      `,
      for: ['UPDATE'],
      to: [UserRole.PROFESSIONAL],
    },
    {
      name: 'professional_packages_admin_all',
      description: 'Admins can see and manage all profiles',
      effect: `SELECT * & UPDATE * & DELETE * FROM professional_packages`,
      for: ['SELECT', 'UPDATE', 'DELETE'],
      to: [UserRole.ADMIN],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL_REVIEWS TABLE
// ═══════════════════════════════════════════════════════════════

export const PROFESSIONAL_REVIEWS_FIELD_ACCESS = {
  table: 'professional_reviews',
  description: 'Client reviews of coaches (moderated)',

  public_select_fields: [
    'id',
    'professional_id',
    'rating',
    'title',
    'content',
    'author_name', // Display name only, not user_id
    'helpful_count',
    'unhelpful_count',
    'created_at',
    'status', // Only show approved
  ],

  hidden_fields: [
    'user_id', // Internal reference
    'reviewer_user_id', // Never expose
    'response', // Can be shown separately after review_id
    'response_by', // Never expose
    'moderation_notes', // Admin only
    'moderation_reason', // Admin only
  ],

  rls_policies: [
    {
      name: 'professional_reviews_select_approved',
      description: 'Everyone sees only approved reviews',
      effect: `WHERE status = 'approved'`,
      to: 'all',
    },
    {
      name: 'professional_reviews_insert_client',
      description: 'Clients can write reviews (moderated before display)',
      to: [UserRole.CLIENT],
    },
    {
      name: 'professional_reviews_update_own',
      description: 'Clients can only update their own reviews',
      to: [UserRole.CLIENT],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL_LANGUAGES TABLE
// ═══════════════════════════════════════════════════════════════

export const PROFESSIONAL_LANGUAGES_FIELD_ACCESS = {
  table: 'professional_languages',
  description: 'Languages supported by coaches',

  public_select_fields: [
    'id',
    'professional_id',
    'language_code', // ISO 639-1 (en, es, fr, etc)
    'language_name', // Friendly name
    'fluency', // beginner, intermediate, fluent
  ],

  hidden_fields: [
    'owner_user_id', // Not needed in query results
  ],

  rls_policies: [
    {
      name: 'professional_languages_select_on_active_profiles',
      description: 'See languages of active, public coaches',
      effect: `WHERE professional_id IN (
        SELECT id FROM professional_packages 
        WHERE status = 'active' AND visibility = 'public'
      )`,
      to: 'all',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SUMMARY: WHAT TO EXPOSE IN RPC
// ═══════════════════════════════════════════════════════════════

export const RPC_FIELD_WHITELIST = {
  'search_professionals_by_goals': [
    'professional_id',    // UUID: use this for booking (NOT owner_user_id)
    'name',               // TEXT: coach name (public)
    'description',        // TEXT: coach bio (public)
    'price',              // NUMERIC: base package price (public)
    'rating',             // NUMERIC: average review rating (public)
    'review_count',       // INT: number of reviews (public)
    'specialties',        // TEXT[]: expertise areas (public)
    'mode',               // TEXT[]: online/in_person/hybrid (public)
    'photo_url',          // TEXT: profile photo URL (public)
    'distance_km',        // NUMERIC: computed distance from user (public)
    'match_score',        // INT: multi-factor relevance score (computed)
    // ═════════════════════════════════════════════════════════════
    // NEVER INCLUDE (SENSITIVE - SECURITY RISK):
    // ═════════════════════════════════════════════════════════════
    // - owner_user_id     ❌ DATABASE USER RELATIONSHIP (exposes DB structure)
    // - email             ❌ PII (privacy violation)
    // - phone             ❌ PII (privacy violation)
    // - private_notes     ❌ INTERNAL DATA (not for clients)
    // - available_slots   ❌ SCHEDULE DATA (availability exploitation risk)
    // - response_rate     ❌ INTERNAL METRIC (not for clients)
    // - response_time_avg_hours ❌ INTERNAL METRIC
    // - created_at, updated_at ❌ INTERNAL TIMESTAMPS
    // - moderation fields ❌ INTERNAL ADMIN ONLY
  ] as const,

  'get_professional_detail': [
    'professional_id',
    'name',
    'description',
    'specialties',
    'mode',
    'years_experience',   // If applicable
    'price',
    'rating',
    'review_count',
    'photo_url',
    'certifications',     // If applicable
    // NOT: email, phone, private notes
  ] as const,
};

// ═══════════════════════════════════════════════════════════════
// SQL TEMPLATE: Safe RPC with field filtering
// ═══════════════════════════════════════════════════════════════

export const RPC_SAFE_QUERY_TEMPLATE = `
CREATE OR REPLACE FUNCTION public.search_professionals_by_goals(
  p_user_id UUID,
  p_goal_categories TEXT[],
  p_preferred_mode TEXT[] DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_radius_km NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  ───────────────────────────────────────────────────────────────
  FIELD WHITELIST ONLY - RLS-compliant, no PII or sensitive data
  ───────────────────────────────────────────────────────────────
  professional_id UUID,        -- Use this for booking (not owner_user_id)
  name TEXT,
  description TEXT,
  price NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  specialties TEXT[],
  mode TEXT[],
  photo_url TEXT,
  distance_km NUMERIC,
  match_score INTEGER
  ───────────────────────────────────────────────────────────────
  NEVER RETURN (sensitive fields - security violation):
  - owner_user_id (database user relationship)
  - email, phone, private_notes (PII)
  - response_rate, response_time_avg_hours (internal metrics)
  - available_slots (schedule/availability data)
  ───────────────────────────────────────────────────────────────
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pp.name,
    pp.description,
    pp.price,
    pp.rating,
    pp.review_count,
    pp.specialties,
    pp.mode,
    pp.photo_url,
    ROUND(ST_Distance(pp.location_geo, up.location_geo) / 1000.0)::NUMERIC,
    (score calculation...)::INTEGER
  FROM professional_packages pp
  JOIN user_profiles up ON up.id = p_user_id
  WHERE 1=1
    -- Filter by status (RLS layer will also filter this)
    AND pp.status = 'active'
    AND pp.visibility = 'public'
    -- Search filters
    AND (p_goal_categories IS NULL OR pp.specialties && p_goal_categories)
    AND (p_preferred_mode IS NULL OR pp.mode && p_preferred_mode)
    AND (p_min_rating IS NULL OR pp.rating >= p_min_rating)
    AND (p_max_price IS NULL OR pp.price <= p_max_price)
    AND (p_radius_km IS NULL OR ST_Distance(pp.location_geo, up.location_geo) / 1000.0 <= p_radius_km)
  ORDER BY score DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// ═══════════════════════════════════════════════════════════════
// AUDIT CHECKLIST: Verify Security
// ═══════════════════════════════════════════════════════════════

export const SECURITY_AUDIT_CHECKLIST = {
  during_development: [
    '□ RPC SELECT explicitly lists safe fields (whitelist, not SELECT *)',
    '□ No email, phone, private_notes, payment info in RPC results',
    '□ RLS policies check status="active" AND visibility="public"',
    '□ Route params pass ID only, no sensitive data',
    '□ Components fetch sensitive data only via authenticated endpoints',
  ],

  pre_deployment: [
    '□ Query Supabase prod as guest user → verify no PII visible',
    '□ Query as client user → verify no coach private fields visible',
    '□ Query as coach → verify see own private fields only',
    '□ Query as admin → verify see all fields',
    '□ Check logs for any accidental PII exposure',
    '□ Run Supabase security audit',
  ],

  post_deployment: [
    '□ Monitor error logs for query rejections',
    '□ Track unauthorized access attempts',
    '□ Review field access patterns in analytics',
    '□ Schedule monthly security audit',
  ],
};
