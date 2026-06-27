import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, View } from 'react-native';
import type { MainTabParamList } from '../types';
import { DiscoverStackNavigator } from './DiscoverStackNavigator';
import { ChatsStackNavigator } from './ChatsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useNotificationStore } from '../store/notificationStore';
import { colors, fontSize, fontWeight, shadow } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({
  icon,
  label,
  focused,
  badge,
}: {
  icon: string;
  label: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export function MainTabNavigator() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
      screenListeners={{
        tabPress: () => {},
      }}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💝" label="Discover" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" label="Chats" focused={focused} badge={unreadCount} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 65,
    paddingTop: 8,
    paddingBottom: 8,
    ...shadow.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconFocused: {},
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -10,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
});
