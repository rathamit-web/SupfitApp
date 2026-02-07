# Navigation Integration: Adding Search UI Routes

## Overview

The search UI requires 3 new routes in your navigation stack. This guide shows exactly where to add them for seamless integration with existing Phase 3 navigation.

---

## Current Navigation Structure

Your app likely has a structure like this:

```typescript
// routes/RootNavigator.tsx or similar
<NativeStack.Navigator>
  {isLoggedIn ? (
    <>
      <NativeStack.Screen name="MainHome" component={MainHomeScreen} />
      <NativeStack.Screen name="IndividualUserHome" component={IndividualUserHome} />
      
      {/* Subscription Management Screens */}
      <NativeStack.Screen name="CoachSubscription" component={CoachSubscriptionNative} />
      <NativeStack.Screen name="DietitianSubscription" component={DietitianSubscriptionNative} />
      <NativeStack.Screen name="GymSubscription" component={GymSubscriptionNative} />
      
      {/* Other screens... */}
    </>
  ) : (
    <NativeStack.Screen name="Login" component={LoginScreen} />
  )}
</NativeStack.Navigator>
```

---

## Step 1: Add Import Statements

**File**: Your main navigation file (e.g., `src/navigation/RootNavigator.tsx`)

```typescript
// At the top with other imports, add:

import SearchCriteriaNative from '@/screens/SearchCriteriaNative';
import SearchResultsNative from '@/screens/SearchResultsNative';
import ProfessionalDetailNative from '@/screens/ProfessionalDetailNative';

// These components are in the same location as your other screens
// If screens are in a different folder, adjust the import path
```

---

## Step 2: Add Routes to Navigation Stack

**Location**: Inside the `isLoggedIn` conditional block of your NativeStack.Navigator

```typescript
<NativeStack.Navigator>
  {isLoggedIn ? (
    <>
      <NativeStack.Screen name="MainHome" component={MainHomeScreen} />
      <NativeStack.Screen name="IndividualUserHome" component={IndividualUserHome} />
      
      {/* Existing Subscription Management Screens */}
      <NativeStack.Screen name="CoachSubscription" component={CoachSubscriptionNative} />
      <NativeStack.Screen name="DietitianSubscription" component={DietitianSubscriptionNative} />
      <NativeStack.Screen name="GymSubscription" component={GymSubscriptionNative} />
      
      {/* ✨ NEW: Professional Search UI Screens ✨ */}
      <NativeStack.Screen
        name="SearchCriteria"
        component={SearchCriteriaNative}
        options={{
          headerShown: false,           // No header bar
          cardStyle: { 
            backgroundColor: '#FFF' 
          },
        }}
      />
      
      <NativeStack.Screen
        name="SearchResults"
        component={SearchResultsNative}
        options={{
          headerShown: false,
          cardStyle: { 
            backgroundColor: '#F5F5F5' 
          },
        }}
      />
      
      <NativeStack.Screen
        name="ProfessionalDetail"
        component={ProfessionalDetailNative}
        options={{
          headerShown: false,
          cardStyle: { 
            backgroundColor: '#FFF' 
          },
        }}
      />
      
      {/* Other screens... */}
    </>
  ) : (
    <NativeStack.Screen name="Login" component={LoginScreen} />
  )}
</NativeStack.Navigator>
```

---

## Step 3: Add Search Button to Home Screen

**File**: `SupfitApp/src/screens/IndividualUserHome.tsx`

**Location**: After your subscriptions section, add this button:

```typescript
// Add this imports at the top if not already present:
import { TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// In your component's render method, add this section
// (Usually after the subscriptions cards and before diet/nutrition section):

<View style={styles.sectionWrap}>
  <Text style={styles.sectionTitle}>Discover Professionals</Text>
  
  <TouchableOpacity
    style={styles.searchProfessionalButton}
    onPress={() => {
      // Navigate to search criteria screen
      navigation?.navigate('SearchCriteria');
    }}
    activeOpacity={0.9}
  >
    <MaterialIcons name="search" size={24} color="#FFF" />
    
    <View style={{ flex: 1 }}>
      <Text style={styles.searchProfessionalTitle}>
        Search by Goal
      </Text>
      <Text style={styles.searchProfessionalSubtitle}>
        Find the perfect professional for you
      </Text>
    </View>
    
    <MaterialIcons name="chevron-right" size={24} color="#FFF" />
  </TouchableOpacity>
</View>
```

---

## Step 4: Add Styles

**File**: `SupfitApp/src/screens/IndividualUserHome.tsx`

**Location**: In the `StyleSheet.create()` section at the bottom, add:

```typescript
const styles = StyleSheet.create({
  // ... existing styles ...
  
  sectionWrap: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  
  searchProfessionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',  // Supfit primary orange
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
    
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    
    // Elevation (Android)
    elevation: 5,
  },
  
  searchProfessionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  
  searchProfessionalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
});
```

---

## Step 5: Navigation Type Definitions

**Optional but Recommended**: Add type safety to your navigation

### Option A: If Using TypeScript/Native Navigation Typing

```typescript
// types/navigation.ts or in your RootNavigator.tsx

export type SearchStackParamList = {
  SearchCriteria: undefined;
  SearchResults: {
    selectedGoals: GoalCategory[];
    filters: SearchFiltersState;
  };
  ProfessionalDetail: {
    professionalId: string;
    professional?: Professional;
    matchScore?: number;
  };
};

// In your component, use:
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, 'SearchCriteria'>;
const navigation = useNavigation<NavigationProp>();

// Now navigation.navigate() will have autocomplete!
```

### Option B: If Not Using TypeScript

No changes needed. The `navigation?.navigate('SearchCriteria')` call will work as-is.

---

## Step 6: Navigation Flow in Components

### From Home Screen → SearchCriteria

```typescript
// In IndividualUserHome.tsx (already added above)
onPress={() => {
  navigation?.navigate('SearchCriteria');
}}
```

### From SearchCriteria → SearchResults

```typescript
// In SearchCriteriaNative.tsx (already in the screen)
// When user taps Search button:
const handleSearch = async () => {
  // ... validation and database insert ...
  
  // Navigate to results with selected criteria
  navigation?.navigate('SearchResults', {
    selectedGoals: selectedGoals,
    filters: filters,
  });
};
```

### From SearchResults → ProfessionalDetail

```typescript
// In SearchResultsNative.tsx (already in the screen)
// When user taps a professional card:
const handleProfessionalPress = (professional: Professional) => {
  navigation?.navigate('ProfessionalDetail', {
    professionalId: professional.id,
    professional: professional,  // Optional: pass full data
    matchScore: professional.matchScore,
  });
};
```

### From ProfessionalDetail → Back

```typescript
// In ProfessionalDetailNative.tsx (already in the screen)
// After successful subscription:
const handleSubscribeSuccess = () => {
  // Toast notification
  Toast.show({
    type: 'success',
    text1: 'Subscription Created!',
  });
  
  // Navigate back to home (can navigate to MySubscriptions instead)
  navigation?.navigate('IndividualUserHome');
};
```

---

## Complete Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN                               │
│            (IndividualUserHome.tsx)                             │
│                                                                 │
│  [TODAY'S TOP MATCH - Phase 3]                                 │
│  [DISCOVER PROFESSIONALS - Search Btn] ← Added in Step 3 ←     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ onPress={() => navigate('SearchCriteria')}
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SEARCH CRITERIA SCREEN                        │
│              (SearchCriteriaNative.tsx)                         │
│                                                                 │
│  16 Goal Categories (2-column grid)                            │
│  Filter Panel (optional)                                        │
│  [← Back]  [Search] (enabled when ≥1 goal selected)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ onPress={() => navigate('SearchResults', {...})}
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SEARCH RESULTS SCREEN                         │
│              (SearchResultsNative.tsx)                          │
│                                                                 │
│  [← Back] [Search again]                                       │
│                                                                 │
│  Professional Card 1 (Rajesh)       🟢 85% [See Profile]      │
│  Professional Card 2 (Priya)        🟠 72% [See Profile]      │
│  Professional Card 3 (Amit)         🟠 68% [See Profile]      │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ onPress on card → navigate('ProfessionalDetail', {...})
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROFESSIONAL DETAIL SCREEN                     │
│            (ProfessionalDetailNative.tsx)                       │
│                                                                 │
│  [← Back]                                                       │
│                                                                 │
│  [Hero Image] (with 🟢 85% match score overlay)                │
│  Rajesh Kumar                                                   │
│  ⭐ 4.8 (142 reviews) • 2.3 km away                             │
│                                                                 │
│  Description, specialties...                                   │
│                                                                 │
│  [Package 1] ₹2,999/month [Select Package]                    │
│  [Package 2] ₹4,999/month [Select Package]                    │
│                                                                 │
│                                                                 │
│  [Subscribe Modal]                                              │
│  ├─ Package details                                            │
│  ├─ Features list                                              │
│  └─ [Cancel] [Subscribe]                                       │
│       └─ Creates subscription_record                           │
│       └─ Shows toast                                           │
│       └─ navigate('IndividualUserHome')                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Navigation Routes

### Test 1: All Screens Accessible

```typescript
// In your test or debugging console:

// From home, can navigate to search?
navigation?.navigate('SearchCriteria');
// ✓ SearchCriteria screen should appear

// From search, can go back?
navigation?.goBack();
// ✓ Should return to home

// Can navigate directly to results? (for testing)
navigation?.navigate('SearchResults', {
  selectedGoals: ['weight_loss', 'cardio'],
  filters: { timing: ['morning'], mode: ['online'] },
});
// ✓ Results screen should appear
```

### Test 2: Back Button Works

```
SearchCriteria ← [Back] → Home ✓
SearchResults ← [Back] → SearchCriteria ✓
ProfessionalDetail ← [Back] → SearchResults ✓
```

### Test 3: Deep Linking (Advanced)

```typescript
// Optionally support deep links like:
// supfit://search/criteria
// supfit://search/results?goals=weight_loss,cardio
// supfit://professional/123

// Configure in your linking config:
const linking = {
  prefixes: ['supfit://'],
  config: {
    screens: {
      SearchCriteria: 'search/criteria',
      SearchResults: 'search/results',
      ProfessionalDetail: 'professional/:id',
    },
  },
};
```

---

## Common Issues & Solutions

### Issue 1: "SearchCriteria is not a registered navigation screen"

**Cause**: Component not imported or route not added

**Solution**:
1. Check import statement exists at top of navigation file
2. Verify route syntax is correct
3. Rebuild app: `npm run dev` or `eas build`

```typescript
// ✅ Correct
import SearchCriteriaNative from '@/screens/SearchCriteriaNative';

<NativeStack.Screen
  name="SearchCriteria"
  component={SearchCriteriaNative}
/>
```

### Issue 2: Navigation History Creates Large Back Stack

**Cause**: Normal behavior, but can be optimized

**Solution**: Use `replace` instead of `navigate` if user shouldn't be able to go back

```typescript
// Go forward but replace in stack
navigation?.replace('SearchResults', params);

// Or reset entire stack
navigation?.reset({
  index: 0,
  routes: [{ name: 'SearchResults', params }],
});
```

### Issue 3: Button Not Appearing on Home Screen

**Cause**: Styling issue or view hierarchy

**Solution**:
1. Verify styles are applied correctly
2. Check if button is inside a scrolling container (may be cut off)
3. Verify flex/layout is correct

```typescript
// Debug: Add visible background to verify position
searchProfessionalButton: {
  backgroundColor: '#FF6B35',
  // backgroundColor: 'red',  // Temporary for debug
}
```

### Issue 4: Navigation Params Not Passed Correctly

**Cause**: Params modified or lost in route

**Solution**: Log params to verify

```typescript
// In SearchResults screen:
useEffect(() => {
  console.log('Route params:', route.params);
  // Should show: { selectedGoals: [...], filters: {...} }
}, [route.params]);
```

### Issue 5: Android Back Button Not Working

**Cause**: Back handler not configured

**Solution**: Already handled by React Navigation. If issues persist:

```typescript
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const MyScreen = () => {
  const navigation = useNavigation();
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Can prevent back if needed
    });
    
    return unsubscribe;
  }, [navigation]);
};
```

---

## Integration Checklist

- [ ] **Imports**: Added 3 screen imports to navigation file
- [ ] **Routes**: Added SearchCriteria, SearchResults, ProfessionalDetail to stack
- [ ] **Home Button**: Added Search button in IndividualUserHome.tsx
- [ ] **Styles**: Added button styles to StyleSheet
- [ ] **Navigation Props**: Component passed `navigation` prop (automatic via React Navigation)
- [ ] **Test Manually**:
  - [ ] Can open app
  - [ ] Can see Search button on home
  - [ ] Can tap button, navigate to SearchCriteria
  - [ ] Can tap Search, navigate to SearchResults
  - [ ] Can tap professional card, navigate to ProfessionalDetail
  - [ ] Can subscribe and return to home
  - [ ] Back buttons work at each level
- [ ] **No Console Errors**: All navigation working
- [ ] **Phase 3 Still Works**: Home screen recommendations still showing

---

## Navigation Type Safety (TypeScript)

### RootStackParamList Type Definition

```typescript
// types/navigation.ts

import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MainHome: undefined;
  IndividualUserHome: undefined;
  CoachSubscription: undefined;
  DietitianSubscription: undefined;
  GymSubscription: undefined;
  
  // Search UI screens
  SearchCriteria: undefined;
  SearchResults: {
    selectedGoals: GoalCategory[];
    filters: SearchFiltersState;
  };
  ProfessionalDetail: {
    professionalId: string;
    professional?: Professional;
    matchScore?: number;
  };
};

// Use in components:
export type SearchCriteriaScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SearchCriteria'
>;

// In component:
const SearchCriteriaNative: React.FC<SearchCriteriaScreenProps> = ({ navigation, route }) => {
  // navigation.navigate() now has autocomplete!
  // route.params has type checking!
};
```

---

## Summary

✅ **3 New Routes**: SearchCriteria, SearchResults, ProfessionalDetail
✅ **Search Button**: Added to IndividualUserHome
✅ **Navigation Flow**: Home → Criteria → Results → Detail → Subscribe
✅ **Back Navigation**: Fully functional at each screen
✅ **Type Safety**: Optional TypeScript setup provided
✅ **Phase 3 Untouched**: Existing navigation unchanged

**Status**: 🚀 **NAVIGATION INTEGRATION READY**
