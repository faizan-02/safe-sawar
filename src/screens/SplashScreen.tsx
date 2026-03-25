import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SplashScreen({ navigation }: Props) {
  const { state } = useAppStore();
  const [minTimeDone, setMinTimeDone] = useState(false);
  const navigated = useRef(false);

  // Minimum splash duration
  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Route once both the min time AND hydration are ready
  useEffect(() => {
    if (!minTimeDone || !state.isHydrated || navigated.current) return;
    navigated.current = true;

    if (state.isAuthenticated && state.user) {
      navigation.replace('MainTabs');
      return;
    }

    AsyncStorage.getItem('has_seen_onboarding').then(seen => {
      navigation.replace(seen ? 'GenderSelection' : 'Onboarding');
    }).catch(() => navigation.replace('Onboarding'));
  }, [minTimeDone, state.isHydrated]); // isAuthenticated read at execution time via state ref

  const logoScale    = useRef(new Animated.Value(0.6)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const taglineOp    = useRef(new Animated.Value(0)).current;
  const urduOp       = useRef(new Animated.Value(0)).current;
  const progressW    = useRef(new Animated.Value(0)).current;
  const shimmerX     = useRef(new Animated.Value(-width)).current;
  const ring1Scale   = useRef(new Animated.Value(0.4)).current;
  const ring1Op      = useRef(new Animated.Value(0.5)).current;
  const ring2Scale   = useRef(new Animated.Value(0.4)).current;
  const ring2Op      = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Rings expand + fade
    Animated.parallel([
      Animated.timing(ring1Scale, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      Animated.timing(ring1Op,   { toValue: 0,    duration: 1400, useNativeDriver: true }),
      Animated.timing(ring2Scale, { toValue: 1.3, duration: 1800, useNativeDriver: true }),
      Animated.timing(ring2Op,   { toValue: 0,    duration: 1800, useNativeDriver: true }),
    ]).start();

    // Logo spring in
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1, tension: 55, friction: 8, useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Tagline
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(taglineOp, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Urdu
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(urduOp, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Shimmer loop on logo
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(shimmerX, { toValue: width * 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -width,      duration: 0,    useNativeDriver: true }),
      ])
    ).start();

    // Progress bar
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(progressW, { toValue: 1, duration: 2200, useNativeDriver: false }),
    ]).start();

    // Navigation is handled separately above, accounting for auth state
  }, []);

  const progressInterp = progressW.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Background glows */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Expanding rings */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Op, width: 280, height: 280, borderRadius: 140 }]} />
      <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Op, width: 360, height: 360, borderRadius: 180 }]} />

      {/* Logo cluster */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Shield container */}
        <View style={styles.shieldBox}>
          <View style={styles.shieldInner}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
          {/* Shimmer sweep */}
          <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />
          {/* Glow border */}
          <View style={styles.shieldGlowBorder} />
        </View>

        {/* App name */}
        <Text style={styles.appName}>Safe-Sawar</Text>

        {/* Urdu subtitle */}
        <Animated.Text style={[styles.urduText, { opacity: urduOp }]}>
          محفوظ سوار
        </Animated.Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineWrap, { opacity: taglineOp }]}>
        <Text style={styles.tagline}>Travel Together. Stay Safe.</Text>
        <View style={styles.taglineLine} />
        <Text style={styles.subTagline}>Hyper-Local Transit • Pakistan</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressInterp }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow1: {
    position: 'absolute',
    width: 500, height: 500, borderRadius: 250,
    backgroundColor: Colors.primary, opacity: 0.04,
    top: -180, right: -160,
  },
  glow2: {
    position: 'absolute',
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: Colors.secondary, opacity: 0.06,
    bottom: -80, left: -120,
  },

  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },

  logoWrap: { alignItems: 'center', marginBottom: 28 },

  shieldBox: {
    width: 116, height: 116, borderRadius: 30,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 22,
    borderWidth: 2, borderColor: Colors.borderStrong,
    elevation: 20, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 20,
  },
  shieldInner: { alignItems: 'center', justifyContent: 'center' },
  shieldEmoji: { fontSize: 58 },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 56,
    backgroundColor: 'rgba(255,255,255,0.13)',
    transform: [{ skewX: '-20deg' }],
  },
  shieldGlowBorder: {
    position: 'absolute', inset: 0,
    borderRadius: 28, borderWidth: 1,
    borderColor: Colors.primary + '50',
  },

  appName: {
    fontSize: 40, fontWeight: '900',
    color: Colors.textPrimary, letterSpacing: 2,
    marginBottom: 8,
  },
  urduText: {
    fontSize: 19, color: Colors.primary,
    fontWeight: '600', letterSpacing: 3,
  },

  taglineWrap: { alignItems: 'center', gap: 8 },
  tagline: {
    color: Colors.textPrimary, fontSize: 16,
    fontWeight: '600', letterSpacing: 0.5,
  },
  taglineLine: {
    width: 44, height: 2,
    backgroundColor: Colors.primary, borderRadius: 1,
  },
  subTagline: {
    color: Colors.textMuted, fontSize: 12, letterSpacing: 0.3,
  },

  progressTrack: {
    position: 'absolute', bottom: 60,
    width: width * 0.55, height: 3,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
