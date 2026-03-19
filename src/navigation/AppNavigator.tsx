import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BiometricVerificationScreen from '../screens/BiometricVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import CirclesScreen from '../screens/CirclesScreen';
import ScheduleRideScreen from '../screens/ScheduleRideScreen';
import RideInProgressScreen from '../screens/RideInProgressScreen';
import VouchScreen from '../screens/VouchScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  BiometricVerification: undefined;
  MainTabs: undefined;
  RideInProgress: undefined;
  ScheduleRide: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Circles: undefined;
  Schedule: undefined;
  Vouch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Circles':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'car' : 'car-outline';
              break;
            case 'Vouch':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return (
            <View style={styles.tabIconContainer}>
              {focused && <View style={styles.tabActiveIndicator} />}
              <Ionicons name={iconName as any} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Circles" component={CirclesScreen} options={{ title: 'Circles' }} />
      <Tab.Screen name="Schedule" component={ScheduleRideScreen} options={{ title: 'Schedule' }} />
      <Tab.Screen name="Vouch" component={VouchScreen} options={{ title: 'Vouch' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="BiometricVerification" component={BiometricVerificationScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="RideInProgress"
          component={RideInProgressScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ScheduleRide"
          component={ScheduleRideScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cardBackground,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
});
