# AI Workout Plan Generator - Implementation Guide

## Overview
The AI Workout Plan Generator is a comprehensive feature that creates personalized workout plans based on user health data, fitness goals, and preferences. The implementation follows industry best practices for React Native/Expo apps with Supabase backend.

## Features Implemented

### 1. User Health Data Collection
- Fetches BMI, weight, height, and body composition from `user_details` table
- Retrieves medical history including chronic conditions, medications, allergies, and injuries
- Automatically calculates BMI if weight and height are available
- Pre-fills preference form with stored medical data

### 2. Preference Collection Modal
Users can customize their workout plan by selecting:
- **Days per Week**: 3, 4, 5, or 6 days
- **Workout Style**: Strength Training, Cardio, HIIT, CrossFit, Bodybuilding, Powerlifting, Calisthenics, Functional Training
- **Session Duration**: 30, 45, 60, or 90 minutes
- **Fitness Goal**: Weight Loss, Muscle Gain, Endurance, Flexibility, General Fitness, Athletic Performance
- **Experience Level**: Beginner, Intermediate, Advanced
- **Available Equipment**: Dumbbells, Barbell, Resistance Bands, Pull-up Bar, Kettlebells, Machines, Bodyweight Only, Full Gym Access
- **Current Medications** (optional text input)
- **Medical Conditions** (optional text input)

### 3. AI Plan Generation Algorithm
The algorithm creates a weekly workout plan with:
- **Muscle Group Rotation**: Intelligently distributes muscle groups across training days
  - Strength Training: Chest & Triceps, Back & Biceps, Legs & Core, Shoulders & Arms
  - Cardio: Cardio Endurance focus
  - Mixed: Combination of strength and cardio
- **Exercise Selection**: Filters exercises based on:
  - Selected equipment
  - Experience level (Beginner: 4 exercises, Intermediate/Advanced: 5+ exercises)
  - Workout style preference
- **Exercise Database**: Comprehensive library with:
  - Sets, reps, duration
  - Calorie burn estimates
  - Rest periods
  - Form tips
- **Daily Workout Structure**:
  - Warmup routine (5-10 min dynamic stretching and light cardio)
  - Main exercises with detailed instructions
  - Cooldown routine (5-10 min static stretching and foam rolling)
  - Total duration and calorie burn per day

### 4. Personalized Recommendations
Health-based recommendations generated based on:
- **BMI > 30**: Low-impact cardio suggestions for joint protection
- **Hypertension**: Heart rate monitoring, breathing exercises
- **Diabetes**: Blood sugar monitoring, fast-acting carbs availability
- **Beginner Level**: Form focus, gradual intensity progression
- **Weight Loss Goal**: Caloric deficit guidance, cardio + strength combo
- **Muscle Gain Goal**: Protein intake, progressive overload, compound movements
- **Universal**: Hydration (3-4L daily), sleep quality (7-9 hours)

### 5. Plan View Modal
Displays the complete generated plan with:
- **Weekly Summary Card**:
  - Total weekly calorie burn
  - Number of training days
  - Session duration
- **Day-by-Day Breakdown**:
  - Day name and muscle group focus
  - Duration and calorie burn per day
  - Warmup section with instructions
  - Exercise cards with:
    - Exercise name
    - Sets × Reps
    - Rest period
    - Form tips (with 💡 icon)
    - Calorie burn estimate
  - Cooldown section with instructions
- **Personalized Recommendations List**:
  - Bulleted list with health-based guidance
  - Nutrition tips
  - Recovery advice
- **Action Buttons**:
  - "Regenerate with Changes": Returns to preference modal
  - "Accept & Save Plan": Saves to Supabase and shows success alert

### 6. Supabase Integration
- **Table**: `workout_programs`
- **Columns**:
  - `id`: UUID primary key
  - `user_id`: Foreign key to auth.users
  - `program_name`: Plan name (e.g., "Muscle Gain - Strength Training Plan")
  - `plan_type`: 'ai_generated' or 'coach_assigned'
  - `plan_data`: JSONB containing full plan details
  - `is_active`: Boolean for active plan status
  - `created_at`: Timestamp
  - `updated_at`: Timestamp (auto-updated via trigger)
- **Row Level Security (RLS)**: Users can only access their own workout programs
- **Indexes**: Optimized for user_id and is_active queries

## File Structure

### Modified Files
1. **SupfitApp/src/screens/PlanNative.tsx**
   - Added all type definitions (WorkoutPreferences, UserHealthData, Exercise, etc.)
   - Added constants for workout options
   - Added state management for modals and plan data
   - Implemented core functions:
     - `fetchUserHealthData()`: Fetch and calculate user health metrics
     - `generateAIWorkoutPlan()`: Main AI generation logic
     - `generateExercisesForDay()`: Exercise selection algorithm
     - `generateRecommendations()`: Health-based recommendations
     - `savePlanToSupabase()`: Persist plan to database
     - `handleRegenerateWithChanges()`: Modal navigation
   - Added modal render functions:
     - `renderPreferencesModal()`: User input form
     - `renderGeneratedPlanModal()`: Plan display
   - Added comprehensive modal styles (modalStyles, planModalStyles)

### New Files
1. **SupfitApp/database/migrations/create_workout_programs_table.sql**
   - SQL migration script for creating the workout_programs table
   - Includes RLS policies and triggers

## Database Setup Instructions

### Step 1: Run the SQL Migration
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Open `create_workout_programs_table.sql`
4. Execute the entire script
5. Verify table creation in Table Editor

### Step 2: Verify RLS Policies
Ensure the following policies are active:
- Users can view their own workout programs (SELECT)
- Users can insert their own workout programs (INSERT)
- Users can update their own workout programs (UPDATE)
- Users can delete their own workout programs (DELETE)

### Step 3: Test Database Connection
```typescript
// Test query in Supabase SQL Editor
SELECT * FROM workout_programs WHERE user_id = 'your-test-user-id';
```

## Usage Flow

### User Journey
1. User navigates to PlanNative screen
2. User selects "AI" plan option
3. User clicks "Generate AI Plan" button
4. Preferences modal opens:
   - System displays user's health profile (BMI, weight, height)
   - User fills in medical information (optional)
   - User selects workout preferences
   - User clicks "Generate Plan"
5. System generates plan (2-second loading animation)
6. Generated plan modal opens:
   - User reviews weekly plan
   - User reads personalized recommendations
   - User can either:
     - Click "Regenerate with Changes" to adjust preferences
     - Click "Accept & Save Plan" to persist to Supabase
7. Success alert confirms plan is saved
8. Modal closes, user returns to PlanNative screen

## Technical Implementation Details

### State Management
```typescript
// Modal visibility
const [showPreferencesModal, setShowPreferencesModal] = useState(false);
const [showGeneratedPlanModal, setShowGeneratedPlanModal] = useState(false);

// Loading states
const [isGenerating, setIsGenerating] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Data states
const [userHealthData, setUserHealthData] = useState<UserHealthData>({...});
const [preferences, setPreferences] = useState<WorkoutPreferences>({...});
const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null);
```

### Exercise Database Structure
```typescript
const exerciseDatabase: ExerciseDB = {
  'Chest & Triceps': [
    {
      name: 'Barbell Bench Press',
      sets: '4',
      reps: '8-10',
      duration: '15 mins',
      caloriesBurn: 180,
      restPeriod: '90s',
      tips: 'Keep core tight, lower to chest'
    },
    // ... more exercises
  ],
  // ... more muscle groups
};
```

### Supabase Query Example
```typescript
const { error } = await supabase
  .from('workout_programs')
  .insert({
    user_id,
    program_name: generatedPlan.planName,
    plan_type: 'ai_generated',
    plan_data: generatedPlan,
    is_active: true,
    created_at: new Date().toISOString()
  });
```

## Styling Guidelines

### Modal Design
- **Overlay**: Semi-transparent black (rgba(0, 0, 0, 0.5))
- **Content**: White background, rounded top corners (24px)
- **Max Height**: 90% of screen for preferences, full-screen for plan view
- **Padding**: 24px consistent padding

### Color Scheme
- **Primary Action**: #ff3c20 (Supfit brand red)
- **Secondary Action**: White with border
- **Accent Purple**: #8b5cf6 (for icons and highlights)
- **Text Primary**: #1d1d1f
- **Text Secondary**: #6e6e73
- **Background Tints**: rgba() with low opacity for subtle backgrounds

### Typography
- **Modal Title**: 24-26px, weight 700
- **Section Title**: 18-20px, weight 700
- **Body Text**: 14-15px, weight 500
- **Small Text**: 12-13px, weight 500

## Error Handling

### Network Errors
- Try-catch blocks around all async operations
- Alert dialogs for user-facing errors
- Console.error for debugging

### Validation
- Equipment array can be empty (defaults to bodyweight exercises)
- Medical fields are optional
- BMI calculation only if both weight and height exist

### Edge Cases
- No user logged in: Alert to log in
- Database insert fails: Error alert with retry suggestion
- Health data unavailable: Show empty form, allow manual entry

## Performance Considerations

### Optimization Techniques
- 2-second artificial delay simulates AI processing (can be replaced with actual API call)
- Lazy loading of exercise database (only selected muscle groups)
- JSONB column in Supabase for flexible plan storage
- Indexes on user_id and is_active for fast queries

### Future Enhancements
- Replace mock AI with real ML model API
- Add plan history view
- Enable plan editing after creation
- Add progress tracking integration
- Social sharing of workout plans
- Coach review/approval workflow for AI plans

## Testing Checklist

### Manual Testing Steps
1. ✅ Modal opens when "Generate AI Plan" is clicked
2. ✅ Health data displays correctly (BMI, weight, height)
3. ✅ All preference selectors work (chips are selectable)
4. ✅ Multi-select equipment works correctly
5. ✅ "Generate Plan" button shows loading state
6. ✅ Generated plan modal displays complete data
7. ✅ All days show correct exercises
8. ✅ Recommendations list is populated
9. ✅ "Regenerate" returns to preferences modal
10. ✅ "Accept & Save" saves to Supabase successfully
11. ✅ Success alert appears after save
12. ✅ Modal closes after save
13. ✅ Plan persists in Supabase (verify in Table Editor)
14. ✅ RLS policies work (user can only see their own plans)

### Edge Case Testing
1. No health data in user_details table
2. Missing weight or height (no BMI calculation)
3. No equipment selected
4. Network failure during save
5. User not logged in
6. Rapid button clicks (prevent duplicate saves)

## Security Considerations

### RLS Policies
- All workout_programs queries filtered by auth.uid()
- No cross-user data access possible
- Insert/Update/Delete restricted to record owner

### Data Validation
- plan_type CHECK constraint: only 'ai_generated' or 'coach_assigned'
- user_id foreign key ensures referential integrity
- JSONB validation at application level

### API Safety
- All Supabase calls wrapped in try-catch
- User authentication verified before database operations
- No sensitive data exposed in error messages

## Maintenance & Updates

### Adding New Exercises
1. Locate `generateExercisesForDay()` function
2. Add exercises to `exerciseDatabase` object
3. Follow existing structure (name, sets, reps, duration, caloriesBurn, restPeriod, tips)

### Adding New Workout Styles
1. Update `WORKOUT_STYLES` constant
2. Add style to muscle group mapping in `generateAIWorkoutPlan()`
3. Add corresponding exercises to `exerciseDatabase`

### Modifying Recommendations
1. Locate `generateRecommendations()` function
2. Add new conditions based on health data or preferences
3. Push recommendation strings to the array

## Troubleshooting

### Common Issues

**Issue**: Modal doesn't open
- **Solution**: Check state initialization, ensure button onPress is connected

**Issue**: Health data not displaying
- **Solution**: Verify user_details table has data, check fetchUserHealthData()

**Issue**: Save fails silently
- **Solution**: Check console for errors, verify Supabase table exists and RLS policies are correct

**Issue**: Exercises don't match equipment
- **Solution**: Verify equipment array is passed correctly to generateExercisesForDay()

**Issue**: BMI shows as null
- **Solution**: Ensure weight and height are stored as numbers, not strings

## Support & Documentation

### Additional Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)

### Contact
For implementation questions or issues, refer to:
- Project README.md
- AGENTS.md for AI agent guidance
- TODO.md for pending features

---

**Last Updated**: December 31, 2024
**Version**: 1.0.0
**Status**: Fully Implemented ✅
