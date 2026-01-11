import { createStackNavigator } from '@react-navigation/stack';
import Landing from '../screens/Landing';
import Auth from '../screens/Auth';
import CreateProfileStep1 from '../screens/CreateProfileStep1';
import CreateProfileStep2 from '../screens/CreateProfileStep2';
import CreateProfileStep3 from '../screens/CreateProfileStep3';
import IndividualUserHome from '../screens/IndividualUserHome';
import CoachHomeNative from '../screens/CoachHomeNative';
import SelectGymNative from '../screens/SelectGymNative';
import SelectCoachNative from '../screens/SelectCoachNative';
import SelectDieticianNative from '../screens/SelectDieticianNative';
import PlanNative from '../screens/PlanNative';
import UserSettingsNative from '../screens/UserSettingsNative';
import MyTargetsNative from '../screens/MyTargetsNative';
import HealthDashboard from '../screens/HealthDashboard';
import RevenueTrackerNative from '../screens/RevenueTrackerNative';
import ClientDetailNative from '../screens/ClientDetailNative';
import SupplementRecommendationNative from '../screens/SupplementRecommendationNative';
import WorkoutPlanNative from '../screens/WorkoutPlanNative';
import DietPlanNative from '../screens/DietPlanNative';
import ScheduleSessionNative from '../screens/ScheduleSessionNative';
import TestimonialsNative from '../screens/TestimonialsNative';

// Navigation param list for type safety
export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  IndividualHome: undefined;
  CoachHome: undefined;
  CreateProfileStep1: undefined;
  CreateProfileStep2: undefined;
  CreateProfileStep3: undefined;
  SelectGymNative: undefined;
  SelectCoachNative: undefined;
  SelectDieticianNative: undefined;
  PlanNative: undefined;
  UserSettingsNative: undefined;
  MyTargetsNative: undefined;
  HealthDashboard: undefined;
  RevenueTracker: undefined;
  ClientDetail: { clientId?: number } | undefined;
  SupplementRecommendationNative: { clientId?: number } | undefined;
  WorkoutPlanNative: { clientId?: number } | undefined;
  DietPlanNative: { clientId?: number } | undefined;
  ScheduleSession: { clientId?: number } | undefined;
  Testimonials: undefined;
};

const Stack = createStackNavigator();


export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Landing">
      <Stack.Screen
        name="Landing"
        component={Landing}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={Auth}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IndividualHome"
        component={IndividualUserHome}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CoachHome"
        component={CoachHomeNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProfileStep1"
        component={CreateProfileStep1}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProfileStep2"
        component={CreateProfileStep2}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProfileStep3"
        component={CreateProfileStep3}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelectGymNative"
        component={SelectGymNative}
        options={{ headerShown: true, title: 'Select Gym' }}
      />
      <Stack.Screen
        name="SelectCoachNative"
        component={SelectCoachNative}
        options={{ headerShown: true, title: 'Select Coach' }}
      />
      <Stack.Screen
        name="SelectDieticianNative"
        component={SelectDieticianNative}
        options={{ headerShown: true, title: 'Select Dietician' }}
      />
      <Stack.Screen
        name="PlanNative"
        component={PlanNative}
        options={{ headerShown: true, title: 'My Plan' }}
      />
      <Stack.Screen
        name="UserSettingsNative"
        component={UserSettingsNative}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="MyTargetsNative"
        component={MyTargetsNative}
        options={{ headerShown: true, title: 'My Targets' }}
      />
      <Stack.Screen
        name="HealthDashboard"
        component={HealthDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RevenueTracker"
        component={RevenueTrackerNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupplementRecommendationNative"
        component={SupplementRecommendationNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutPlanNative"
        component={WorkoutPlanNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DietPlanNative"
        component={DietPlanNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScheduleSession"
        component={ScheduleSessionNative}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Testimonials"
        component={TestimonialsNative}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
