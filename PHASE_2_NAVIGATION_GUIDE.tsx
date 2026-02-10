/**
 * Navigation Integration Guide for Phase 2
 * Add these routes to your router configuration
 */

// ============================================
// IMPORT STATEMENTS (add to your router file)
// ============================================

import { FindCoachesNative } from '@/screens/FindCoachesNative';
import { ProfessionalProfileNative } from '@/screens/ProfessionalProfileNative';

// ============================================
// ROUTE DEFINITIONS (add to your Stack Navigator)
// ============================================

// Option 1: Using Expo Router (app directory)
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <Stack>
      {/* Existing routes... */}
      
      {/* Phase 2: Professional Directory */}
      <Stack.Screen 
        name="FindCoaches"
        component={FindCoachesNative}
        options={{
          title: 'Find Professionals',
          headerShown: false,  // Handled by screen
          animationEnabled: true,
        }}
      />

      <Stack.Screen 
        name="ProfessionalProfile"
        component={ProfessionalProfileNative}
        options={{
          title: 'Professional Profile',
          headerShown: false,  // Handled by screen
          animationEnabled: true,
        }}
      />

      {/* Phase 3: Checkout (placeholder) */}
      {/* <Stack.Screen 
        name="CheckoutNative"
        component={CheckoutNative}
        options={{
          title: 'Checkout',
          headerShown: false,
        }}
      /> */}
    </Stack>
  );
}

// ============================================
// FOOTER NAVIGATION UPDATE
// ============================================

// If using custom FooterNav component, add:

import { ScrollView, Briefcase } from 'lucide-react-native';

export const FooterNav = ({ navigation }) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Index')}
        style={styles.navItem}
      >
        <Home size={24} />
        <Text>Home</Text>
      </TouchableOpacity>

      {/* NEW: Find Coaches Tab */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('FindCoaches')}
        style={styles.navItem}
      >
        <Briefcase size={24} />
        <Text>Find Pros</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Messages')}
        style={styles.navItem}
      >
        <MessageSquare size={24} />
        <Text>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Profile')}
        style={styles.navItem}
      >
        <User size={24} />
        <Text>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// NAVIGATION PARAM TYPES (add to your types)
// ============================================

declare global {
  namespace RootStackParamList {
    FindCoaches: undefined;
    ProfessionalProfile: {
      professionalId: string;
    };
    CheckoutNative: {
      packageId: string;
      packageName: string;
      price: number;
      professionalId: string;
    };
  }
}

// ============================================
// QUICK START: FULL EXAMPLE
// ============================================

// Step 1: Add imports at top of router file
// ✓ Already shown above

// Step 2: Add the two routes to your Stack Navigator
// ✓ Already shown above

// Step 3: Update FooterNav with new tab
// ✓ Already shown above

// Step 4: Build and test
// npm run dev

// Step 5: Test navigation
// Tap "Find Pros" tab → FindCoachesNative loads
// Tap professional card → Navigate to ProfessionalProfile
// Tap "Back" → Return to list

// ============================================
// EXAMPLE: PROGRAMMATIC NAVIGATION
// ============================================

// From anywhere in the app, navigate to:

// 1. Find Coaches screen (no params)
navigation.navigate('FindCoaches');

// 2. Professional profile (requires professionalId)
navigation.navigate('ProfessionalProfile', {
  professionalId: 'uuid-here'
});

// 3. From ProfessionalProfile to Checkout (Phase 3)
navigation.navigate('CheckoutNative', {
  packageId: 'package-uuid',
  packageName: 'Basic Plan',
  price: 2999,
  professionalId: 'pro-uuid'
});

// 4. Goback one screen
navigation.goBack();

// ============================================
// STYLING CUSTOMIZATION
// ============================================

// All components use these color variables (can be customized):

// Primary accent (button, highlight)
const PRIMARY_COLOR = '#FF6B6B';

// Secondary accent (badges, borders)
const SECONDARY_COLOR = '#4ECDC4';

// Dark text
const TEXT_DARK = '#2C3E50';

// Light text (secondary)
const TEXT_LIGHT = '#7F8C8D';

// Borders
const BORDER_COLOR = '#E0E0E0';

// Background
const BACKGROUND = '#F8F9FA';

// To customize, replace these in component files or create global theme

// ============================================
// TESTING CHECKLIST
// ============================================

// After integration, verify:

// [ ] App builds without errors
//     npm run dev

// [ ] "Find Professionals" tab appears in footer

// [ ] Tap tab → FindCoachesNative screen loads
//     Shows search bar, filter button, professionals list

// [ ] Can search professionals by keyword
//     Type "weight" → filters results

// [ ] Can apply filters
//     Tap filter icon → modal appears

// [ ] Can sort results
//     Tap sort dropdown → order changes

// [ ] Tap professional card → navigates to profile screen
//     Shows full profile, reviews, packages

// [ ] From profile, tap "Write Review" → modal appears
//     Can enter star rating, title, content

// [ ] Reviews display with proper formatting
//     Shows stars, reviewer name, date

// [ ] "Book a Session" button visible on profile
//     (Checkout not yet implemented, will add Phase 3)

// [ ] All screens have proper loading states
//     (Test by throttling network in DevTools)

// [ ] All screens have error states
//     (Test by using invalid IDs)

// [ ] Back navigation works everywhere
//     Can go back from profile → list

// [ ] No TypeScript errors
//     npm run lint

// ============================================
// DATABASE DEPLOYMENT REMINDER
// ============================================

// IMPORTANT: Before running app, you MUST deploy the database migration!

// 1. Go to Supabase Dashboard
// 2. SQL Editor
// 3. Paste content of: supabase/migrations/20260209000000_phase_2_foundation.sql
// 4. Click "Run"
// 5. Verify no errors

// Without this migration, searches will fail with "function not found" error

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

// Ensure these are set in .env or .env.local:

// EXPO_PUBLIC_SUPABASE_URL=your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// EXPO_PUBLIC_RAZORPAY_KEY=your-razorpay-key (Phase 3)

// ============================================
// PERFORMANCE TIPS
// ============================================

// To optimize Phase 2 performance:

// 1. Add image caching
//    - Use expo-image with source cache
//    - Implement lazy image loading

// 2. Optimize search
//    - Debounce search input (300ms)
//    - Limit to 50 professionals per page
//    - Implement infinite scroll

// 3. Profile performance
//    - Lazy load reviews (show first 5, then paginate)
//    - Use image CDN for avatar (Cloudinary)
//    - Memoize components (React.memo on cards)

// 4. Database
//    - Ensure indices exist (run migration)
//    - Monitor RLS policy performance
//    - Use EXPLAIN ANALYZE for slow queries

// ============================================
// USEFUL RESOURCES
// ============================================

// Types:          src/types/phase2.ts
// Hooks:          src/hooks/phase2.ts
// Components:     src/components/
// Screens:        src/screens/
// Migration:      supabase/migrations/20260209000000_phase_2_foundation.sql
// Docs:           PHASE_2_COMPLETE.md
// This file:      Navigation Integration Guide (you're reading it!)
