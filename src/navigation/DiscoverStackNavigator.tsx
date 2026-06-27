import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DiscoverStackParamList } from '../types';
import DiscoveryScreen from '../screens/discovery/DiscoveryScreen';
import ProfileDetailScreen from '../screens/discovery/ProfileDetailScreen';

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Discovery" component={DiscoveryScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
    </Stack.Navigator>
  );
}
