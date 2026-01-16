import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import WorkoutPlansScreen from '../screens/WorkoutPlansScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopWidth: 1,
          borderTopColor: '#334155',
          height: 60 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="PlansTab"
        component={WorkoutPlansScreen}
        options={{
          tabBarLabel: 'Plany',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={WorkoutHistoryScreen}
        options={{
          tabBarLabel: 'Historia',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Postępy',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>📈</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;