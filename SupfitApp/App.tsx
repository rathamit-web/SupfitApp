
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { UserRoleProvider } from './src/context/UserRoleContext';

export default function App() {
  return (
    <UserRoleProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </UserRoleProvider>
  );
}
