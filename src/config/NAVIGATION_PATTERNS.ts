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
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════

export type PrimaryScreen = typeof NAVIGATION_PATTERNS.PRIMARY_SCREENS[number];
export type ModalInteraction = typeof NAVIGATION_PATTERNS.MODAL_INTERACTIONS[number];

export const isPrimaryScreen = (screen: string): screen is PrimaryScreen => {
  return NAVIGATION_PATTERNS.PRIMARY_SCREENS.includes(screen as PrimaryScreen);
};

export const isModalInteraction = (modal: string): modal is ModalInteraction => {
  return NAVIGATION_PATTERNS.MODAL_INTERACTIONS.includes(modal as ModalInteraction);
};
