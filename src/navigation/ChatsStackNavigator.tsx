import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../types';
import ChatListScreen from '../screens/matches/ChatListScreen';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export function ChatsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </Stack.Navigator>
  );
}
