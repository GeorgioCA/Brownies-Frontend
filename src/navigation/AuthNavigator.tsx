import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFF8F0' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
