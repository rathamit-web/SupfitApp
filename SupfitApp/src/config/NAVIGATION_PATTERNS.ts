/**
 * NAVIGATION PATTERNS - Supfit Enterprise Architecture
 * 
 * Canonical rules for when to use Screens vs Modals
 * Issue #2 Fix: Modal vs Screen Inconsistency
 * 
 * RULE: Screens = Full-page navigation (go.navigate)
 *       Modals = Secondary interactions (useState)
 * 
 * Date: 2026-02-09
 */

export const NAVIGATION_PATTERNS = {
  // ═══════════════════════════════════════════════════════════════
  // PRIMARY SCREENS (Full-page navigation, nav.navigate() only)
  // ═══════════════════════════════════════════════════════════════
  PRIMARY_SCREENS: [
    'SelectCoach',              // Entry point, onboarding
    'FindCoaches',              // Professional directory (CANONICAL path from SelectCoach)
    'SearchResults',            // Ranked search results from RPC
    'ProfessionalDetail',       // Full professional profile
    'Booking',                  // Booking session screen
    'Invoice',                  // Payment/invoice screen
    'Home',                     // Main dashboard
    'Profile',                  // User profile settings
  ] as const,

  // ═══════════════════════════════════════════════════════════════
  // SECONDARY INTERACTIONS (Modals/Sheets, useState + <Modal> only)
  // ═══════════════════════════════════════════════════════════════
  MODAL_INTERACTIONS: [
    'WriteReview',              // Modal over ProfessionalDetail
    'BookSession',              // Bottom sheet over ProfessionalDetail
    'ConfirmPurchase',          // Modal over Booking screen
    'FilterOptions',            // Bottom sheet over FindCoaches
    'LocationPrompt',           // Modal when location not set
    'ConfirmCancellation',      // Modal confirmation
    'ShareProfile',             // Modal over ProfessionalDetail
    'ReportProfessional',       // Modal for abuse reporting
  ] as const,

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION FLOW DIAGRAM
  // ═══════════════════════════════════════════════════════════════
  CANONICAL_FLOW: `
    SelectCoachNative
        ↓ navigate('FindCoaches', { source: 'SelectCoach' })
    FindCoachesNative
        ├─ [Modals]:
        │  └─ FilterOptions (setState)
        ├─ [Search/Apply filters internally]
        └─ navigate('SearchResults', { selectedGoals, filters })
            ↓
    SearchResultsNative
        ├─ [Modals]:
        │  └─ None typically
        └─ navigate('ProfessionalDetail', { professionalId })
            ↓
    ProfessionalDetailNative
        ├─ [Modals]:
        │  ├─ WriteReview (setState)
        │  ├─ BookSession (setState)
        │  └─ ShareProfile (setState)
        └─ navigate('Booking', { packageId })
  `,

  // ═══════════════════════════════════════════════════════════════
  // RULES FOR DEVELOPERS
  // ═══════════════════════════════════════════════════════════════

  RULES: {
    PRIMARY_NAVIGATION: `
1. Use navigation.navigate() for full-page screens
2. Each screen flows to next screen naturally
3. Back button always returns to previous screen
4. Route params contain only IDs and search state
5. Don't pass entire objects (use IDs, fetch in component)
    `,

    MODAL_INTERACTIONS: `
1. Use useState(boolean) to control visibility
2. Render as <Modal> component, NOT navigation.navigate()
3. Modal appears OVER current screen (not replacing it)
4. Back button/dismiss closes modal, stays on screen
5. Modals are secondary (not affecting navigation stack)
    `,

    CANONICAL_ENTRY_POINT: `
1. SelectCoachNative → ONLY route to FindCoaches
2. NO SearchCriteria intermediate screen
3. Filters applied INSIDE FindCoaches (via FilterSheet modal)
4. Source tracking: { source: 'SelectCoach' } for analytics
    `,

    TYPE_SAFETY: `
1. Route params validated with Zod before navigation
2. Never pass PII (email, phone, notes) in route
3. Pass IDs only, fetch sensitive data in-component
4. Versioned DTOs for future breaking changes
    `,
  } as const,

  // ═══════════════════════════════════════════════════════════════
  // WHEN PATTERNS APPLY
  // ═══════════════════════════════════════════════════════════════

  DECISION_TREE: {
    'Does user need to see full new screen?': {
      YES: '→ Use Screen (navigation.navigate)',
      NO: 'Go to next question',
    },
    'Does modal appear OVER current screen?': {
      YES: '→ Use Modal (useState)',
      NO: 'Use screen instead',
    },
    'Is it secondary interaction (write, select, confirm)?': {
      YES: '→ Use Modal',
      NO: 'Use screen',
    },
  } as const,

  // ═══════════════════════════════════════════════════════════════
  // EXAMPLES
  // ═══════════════════════════════════════════════════════════════

  EXAMPLES: {
    CORRECT_SCREEN: {
      description: 'SearchResults should be a screen (not modal)',
      code: `// ✅ CORRECT
navigation.navigate('SearchResults', { 
  selectedGoals, 
  filters 
});`,
    },

    CORRECT_MODAL: {
      description: 'Write Review should be a modal (not screen)',
      code: `// ✅ CORRECT
const [reviewModalVisible, setReviewModalVisible] = useState(false);

<Modal 
  visible={reviewModalVisible}
  onDismiss={() => setReviewModalVisible(false)}
>
  <WriteReviewForm />
</Modal>`,
    },

    WRONG_MODAL_AS_SCREEN: {
      description: 'DON\'T use navigate for secondary interactions',
      code: `// ❌ WRONG - WriteReview is secondary!
navigation.navigate('WriteReview', { professionalId });

// Should be:
<Modal visible={reviewModalVisible}>
  <WriteReviewForm />
</Modal>`,
    },

    WRONG_SCREEN_AS_MODAL: {
      description: 'DON\'T use useState for primary navigation',
      code: `// ❌ WRONG - SearchResults should be full screen!
const [showSearchResults, setShowSearchResults] = useState(false);

// Should be:
navigation.navigate('SearchResults', { selectedGoals });`,
    },
  } as const,

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS: Track navigation source
  // ═══════════════════════════════════════════════════════════════

  ANALYTICS: {
    TRACK_SOURCE: `
When navigating, include source for analytics:

navigation.navigate('FindCoaches', {
  source: 'SelectCoach',  // Where we came from
  timestamp: Date.now(),
  userId: currentUser.id,
});

Router logs this for:
- Understanding user journey
- Detecting abandoned flows
- Optimizing UX based on entry points
    `,
  } as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════

export type PrimaryScreen = typeof NAVIGATION_PATTERNS.PRIMARY_SCREENS[number];

// ============================================================================
// MODAL INTERACTIONS (Secondary overlays)
// ============================================================================
// These use setState + <Modal>, NOT navigation.navigate()
// User: useState() + conditional render

export const MODAL_INTERACTIONS = {
  WriteReview: {
    description: 'Write review modal over ProfessionalDetail',
    trigger: 'useState',
    parent: 'ProfessionalDetail',
  },
  BookSession: {
    description: 'Book session bottom sheet over ProfessionalDetail',
    trigger: 'useState',
    parent: 'ProfessionalDetail',
  },
  ConfirmPurchase: {
    description: 'Confirm purchase modal over Booking',
    trigger: 'useState',
    parent: 'Booking',
  },
  FilterOptions: {
    description: 'Filter bottom sheet over FindCoaches',
    trigger: 'useState',
    parent: 'FindCoaches',
  },
  LocationPrompt: {
    description: 'Location permission banner over FindCoaches',
    trigger: 'useState',
    parent: 'FindCoaches',
  },
  SubscribeModal: {
    description: 'Subscribe confirmation over SelectCoach',
    trigger: 'useState',
    parent: 'SelectCoach',
  },
} as const;

export type ModalInteraction = keyof typeof MODAL_INTERACTIONS;

// ============================================================================
// CANONICAL NAVIGATION PATHS
// ============================================================================

export const CANONICAL_PATHS = {
  /**
   * Entry point → Find professionals
   * SINGLE PATH: SelectCoach → FindCoaches only
   * No intermediate SearchCriteria
   */
  findProfessionals: {
    from: 'SelectCoach' as const,
    to: 'FindCoaches' as const,
    params: {
      source: 'SelectCoach',              // Track origin
      autoOpenFilters: true as const,     // Optional: guide user
    },
  },

  /**
   * Browse → Search results
   * User applies filters in FindCoaches screen
   * Explicit search navigation
   */
  searchResults: {
    from: 'FindCoaches' as const,
    to: 'SearchResults' as const,
    params: {
      selectedGoals: [] as string[],
      filters: {
        preferredMode: [] as string[],
        minRating: 0,
        maxPrice: 10000,
        radiusKm: 50,
      },
    },
  },

  /**
   * Results → Profile detail
   * Pass professional ID + safe fields from card
   * NO PII in route params
   */
  professionalDetail: {
    from: 'SearchResults' as const,
    to: 'ProfessionalDetail' as const,
    params: {
      professionalId: 'uuid' as string,
      // Safe fields only (no email, phone, notes)
      professional: {
        professional_id: 'uuid' as string,
        name: 'John Doe' as string,
        rating: 4.5 as number,
        price: 60 as number,
        specialties: [] as string[],
        distance_km: 5 as number,
        match_score: 85 as number,
      },
    },
  },
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Screens must NOT be opened via:
 * - useState (use navigation.navigate instead)
 * - this.state manipulation
 * - useRef
 */
export const SCREEN_VIOLATIONS = {
  PRIMARY_SCREENS,
  mustNotUse: ['setState', 'useRef', 'Modal'],
} as const;

/**
 * Modals must NOT use:
 * - navigation.navigate()
 * - Full-page routes
 * - Back stack manipulation
 */
export const MODAL_VIOLATIONS = {
  MODAL_INTERACTIONS,
  mustNotUse: ['navigation.navigate', 'Stack.Screen', 'back stack'],
} as const;

// ============================================================================
// FUTURE: ENFORCE WITH ESLINT
// ============================================================================

/**
 * ESLint rule configuration (to be added to eslint.config.js)
 *
 * Goal: Catch violations at development time
 *
 * {
 *   rules: {
 *     'no-ambiguous-navigation': [
 *       'error',
 *       {
 *         forbiddenScreens: {
 *           'SelectCoach': ['setState', 'useRef'],
 *           'FindCoaches': ['setState', 'useRef'],
 *           'SearchResults': ['setState', 'useRef'],
 *           'ProfessionalDetail': ['setState', 'useRef'],
 *         },
 *         forbiddenModals: {
 *           'WriteReview': ['navigation.navigate'],
 *           'BookSession': ['navigation.navigate'],
 *           'FilterOptions': ['navigation.navigate'],
 *         },
 *       }
 *     ],
 *   }
 * }
 */

// ============================================================================
// RUNTIME VALIDATION
// ============================================================================

/**
 * Validate screen name at runtime
 * Use this in navigation handlers to catch typos
 */
export const validateScreenName = (screenName: string): screenName is PrimaryScreen => {
  if (!PRIMARY_SCREENS.includes(screenName as PrimaryScreen)) {
    console.error(
      `❌ Invalid screen: "${screenName}"\n` +
      `Allowed screens: ${PRIMARY_SCREENS.join(', ')}\n` +
      `See NAVIGATION_PATTERNS.ts for allowed routes.`
    );
    return false;
  }
  return true;
};

/**
 * Check if a screen should be modal instead
 */
export const isModalsNotScreen = (screenName: string): screenName is ModalInteraction => {
  return screenName in MODAL_INTERACTIONS;
};

/**
 * Get canonical path if available
 */
export const getCanonicalPath = (
  from: PrimaryScreen,
  to: PrimaryScreen
) => {
  const paths = Object.values(CANONICAL_PATHS);
  return paths.find(p => p.from === from && p.to === to);
};

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * HOW TO USE NAVIGATION_PATTERNS
 *
 * 1. NAVIGATING TO A SCREEN:
 *    ```tsx
 *    // ✅ CORRECT
 *    navigation.navigate('FindCoaches', {
 *      source: 'SelectCoach',
 *      autoOpenFilters: true,
 *    });
 *
 *    // ❌ WRONG (ProfessionalDetail is a screen, not modal)
 *    const [detailVisible, setDetailVisible] = useState(false);
 *    <Modal visible={detailVisible}>...</Modal>
 *    ```
 *
 * 2. OPENING A MODAL:
 *    ```tsx
 *    // ✅ CORRECT
 *    const [reviewModalVisible, setReviewModalVisible] = useState(false);
 *    <Modal visible={reviewModalVisible} onDismiss={() => setReviewModalVisible(false)}>
 *      <WriteReviewForm />
 *    </Modal>
 *
 *    // ❌ WRONG (WriteReview is modal, not screen)
 *    navigation.navigate('WriteReview', { professionalId });
 *    ```
 *
 * 3. VALIDATING NEW CODE:
 *    ```tsx
 *    // Before navigating, validate
 *    if (validateScreenName('FindCoaches')) {
 *      navigation.navigate('FindCoaches');
 *    }
 *    ```
 *
 * 4. CHECK CANONICAL PATHS:
 *    ```tsx
 *    const path = getCanonicalPath('SelectCoach', 'FindCoaches');
 *    // Returns typed params for safe navigation
 *    ```
 */

export default {
  PRIMARY_SCREENS,
  MODAL_INTERACTIONS,
  CANONICAL_PATHS,
  validateScreenName,
  isModalsNotScreen,
  getCanonicalPath,
};
