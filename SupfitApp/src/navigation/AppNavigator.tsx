
import HealthDashboard from '../screens/HealthDashboard';

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import Landing from '../screens/Landing';
import Auth from '../screens/Auth';
import CreateProfileStep1 from '../screens/CreateProfileStep1';
import CreateProfileStep2 from '../screens/CreateProfileStep2';
import CreateProfileStep3 from '../screens/CreateProfileStep3';
import IndividualUserHome from '../screens/IndividualUserHome';
import SelectGymNative from '../screens/SelectGymNative';
import SelectCoachNative from '../screens/SelectCoachNative';
import SelectDieticianNative from '../screens/SelectDieticianNative';
import PlanNative from '../screens/PlanNative';

import UserSettingsNative from '../screens/UserSettingsNative';
import MyTargetsNative from '../screens/MyTargetsNative';

const Stack = createStackNavigator();

// Remove placeholder IndividualHome
function CoachHome() {
  return <Text>Coach Home</Text>;
}


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
        component={CoachHome}
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
    </Stack.Navigator>
  );
}
