import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/appStore';

// Screens
import SplashScreen                  from '../screens/SplashScreen';
import OnboardingScreen              from '../screens/OnboardingScreen';
import GenderSelectionScreen         from '../screens/GenderSelectionScreen';
import AuthScreen                    from '../screens/AuthScreen';
import LoginScreen                   from '../screens/LoginScreen';
import RoleSelectionScreen           from '../screens/RoleSelectionScreen';
import PassengerRegistrationScreen   from '../screens/PassengerRegistrationScreen';
import CarpoolerRegistrationScreen   from '../screens/CarpoolerRegistrationScreen';
import BiometricVerificationScreen   from '../screens/BiometricVerificationScreen';
import HomeScreen                    from '../screens/HomeScreen';
import CirclesScreen                 from '../screens/CirclesScreen';
import ScheduleRideScreen            from '../screens/ScheduleRideScreen';
import RideInProgressScreen          from '../screens/RideInProgressScreen';
import VouchScreen                   from '../screens/VouchScreen';
import MyRidesScreen                 from '../screens/MyRidesScreen';
import CarpoolerDashboardScreen      from '../screens/CarpoolerDashboardScreen';
import EarningsScreen                from '../screens/EarningsScreen';

// ─── Stack param lists ────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  GenderSelection: undefined;
  Auth: undefined;
  Login: undefined;
  RoleSelection: undefined;
  PassengerRegistration: undefined;
  CarpoolerRegistration: undefined;
  BiometricVerification: undefined;
  MainTabs: undefined;
  RideInProgress: undefined;
  ScheduleRide: undefined;
};

// ─── Tab configs ──────────────────────────────────────────────────────────────
const PASSENGER_TABS: Record<string, { icon: string; activeIcon: string; label: string }> = {
  Home:     { icon: 'home-outline',     activeIcon: 'home',     label: 'Home' },
  MyRides:  { icon: 'car-outline',      activeIcon: 'car',      label: 'My Rides' },
  Circles:  { icon: 'people-outline',   activeIcon: 'people',   label: 'Circles' },
  Vouch:    { icon: 'heart-outline',    activeIcon: 'heart',    label: 'Vouch' },
};

const CARPOOLER_TABS: Record<string, { icon: string; activeIcon: string; label: string }> = {
  Dashboard: { icon: 'grid-outline',    activeIcon: 'grid',     label: 'Dashboard' },
  MyRides:   { icon: 'car-outline',     activeIcon: 'car',      label: 'My Rides' },
  Circles:   { icon: 'people-outline',  activeIcon: 'people',   label: 'Circles' },
  Earnings:  { icon: 'cash-outline',    activeIcon: 'cash',     label: 'Earnings' },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator();

// ─── Tab icon component ───────────────────────────────────────────────────────
function TabIcon({
  routeName, focused, tabConfig,
}: {
  routeName: string;
  focused: boolean;
  tabConfig: Record<string, { icon: string; activeIcon: string; label: string }>;
}) {
  const C = useTheme();
  const cfg = tabConfig[routeName];
  if (!cfg) return null;
  return (
    <View style={[styles.tabIconWrap, focused && { backgroundColor: C.primaryGlow, borderRadius: 17 }]}>
      <Ionicons
        name={(focused ? cfg.activeIcon : cfg.icon) as any}
        size={focused ? 22 : 21}
        color={focused ? C.primary : C.textMuted}
      />
    </View>
  );
}

// ─── Passenger tabs ───────────────────────────────────────────────────────────
function PassengerTabs() {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: C.cardBackground, borderTopColor: C.border, shadowColor: C.primary, paddingBottom: Math.max(insets.bottom, 8), height: 56 + Math.max(insets.bottom, 8) }],
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} tabConfig={PASSENGER_TABS} />
        ),
        tabBarLabel: ({ focused, color }) => (
          <Text style={[styles.tabLabel, { color }]}>
            {PASSENGER_TABS[route.name]?.label ?? route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="MyRides" component={MyRidesScreen} />
      <Tab.Screen name="Circles" component={CirclesScreen} />
      <Tab.Screen name="Vouch"   component={VouchScreen} />
    </Tab.Navigator>
  );
}

// ─── Carpooler tabs ───────────────────────────────────────────────────────────
function CarpoolerTabs() {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: C.cardBackground, borderTopColor: C.border, shadowColor: C.primary, paddingBottom: Math.max(insets.bottom, 8), height: 56 + Math.max(insets.bottom, 8) }],
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} tabConfig={CARPOOLER_TABS} />
        ),
        tabBarLabel: ({ focused, color }) => (
          <Text style={[styles.tabLabel, { color }]}>
            {CARPOOLER_TABS[route.name]?.label ?? route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={CarpoolerDashboardScreen} />
      <Tab.Screen name="MyRides"   component={MyRidesScreen} />
      <Tab.Screen name="Circles"   component={CirclesScreen} />
      <Tab.Screen name="Earnings"  component={EarningsScreen} />
    </Tab.Navigator>
  );
}

// ─── MainTabs — picks the correct tab set based on user role ─────────────────
function MainTabs() {
  const { state } = useAppStore();
  if (state.user?.role === 'carpooler') return <CarpoolerTabs />;
  return <PassengerTabs />;
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const C = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash"           component={SplashScreen} />
        <Stack.Screen name="Onboarding"       component={OnboardingScreen} />
        <Stack.Screen name="GenderSelection"  component={GenderSelectionScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Auth"             component={AuthScreen} />
        <Stack.Screen name="Login"      component={LoginScreen}  options={{ animation: 'slide_from_right' }} />

        <Stack.Screen name="RoleSelection"         component={RoleSelectionScreen}        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PassengerRegistration"  component={PassengerRegistrationScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CarpoolerRegistration"  component={CarpoolerRegistrationScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="BiometricVerification"  component={BiometricVerificationScreen} />

        <Stack.Screen name="MainTabs"       component={MainTabs}  options={{ gestureEnabled: false }} />
        <Stack.Screen name="RideInProgress" component={RideInProgressScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ScheduleRide"   component={ScheduleRideScreen}   options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 24,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  tabItem: { paddingTop: 4 },
  tabIconWrap: {
    width: 46, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconWrapActive: { backgroundColor: Colors.primaryGlow },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
