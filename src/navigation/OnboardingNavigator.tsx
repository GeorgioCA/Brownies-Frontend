import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFF8F0' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
