import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TabNavigator from './navigation/TabNavigator';
import WorkoutEditorScreen from './screens/WorkoutEditorScreen';
import WorkoutPlanEditorScreen from './screens/WorkoutPlanEditorScreen';
import WorkoutPlanDetailsScreen from './screens/WorkoutPlanDetailsScreen';
import WorkoutDetailsScreen from './screens/WorkoutDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="WorkoutEditor" component={WorkoutEditorScreen} />
        <Stack.Screen name="WorkoutPlanEditor" component={WorkoutPlanEditorScreen} />
        <Stack.Screen name="WorkoutPlanDetails" component={WorkoutPlanDetailsScreen} />
        <Stack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}