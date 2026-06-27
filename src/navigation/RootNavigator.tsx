import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SplashScreen from '../screens/auth/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotificationStore } from '../store/notificationStore';

const Stack = createNativeStackNavigator();

function MainNavigatorWrapper() {
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  useEffect(() => { fetchUnreadCount(); }, []);
  useWebSocket();
  return <MainTabNavigator />;
}

export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : !profileComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigatorWrapper} />
      )}
    </Stack.Navigator>
  );
}
