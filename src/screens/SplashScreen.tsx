import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SplashScreen({ navigation }: Props) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0)).current;
  const ringScale2 = useRef(new Animated.Value(0)).current;
  const ringScale3 = useRef(new Animated.Value(0)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.4)).current;
  const ringOpacity3 = useRef(new Animated.Value(0.2)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    // Ripple rings
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(ringScale1, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(ringScale2, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(ringScale3, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ]).start();

    // Fade rings out
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(ringOpacity1, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(ringOpacity2, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(ringOpacity3, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ]).start();

    // Logo entrance
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tagline fade in
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer
    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(shimmerX, {
          toValue: width,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate to onboarding
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Background gradient circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Ripple rings */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: 300,
            height: 300,
            borderRadius: 150,
            transform: [{ scale: ringScale1 }],
            opacity: ringOpacity1,
            borderColor: Colors.primary,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: 400,
            height: 400,
            borderRadius: 200,
            transform: [{ scale: ringScale2 }],
            opacity: ringOpacity2,
            borderColor: Colors.primary,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: 500,
            height: 500,
            borderRadius: 250,
            transform: [{ scale: ringScale3 }],
            opacity: ringOpacity3,
            borderColor: Colors.primary,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        {/* Shield icon with shimmer */}
        <View style={styles.shieldContainer}>
          <View style={styles.shieldOuter}>
            <View style={styles.shieldInner}>
              <Text style={styles.shieldEmoji}>🛡️</Text>
            </View>
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerX }] },
              ]}
            />
          </View>
        </View>

        <Text style={styles.appName}>Safe-Sawar</Text>
        <View style={styles.urduContainer}>
          <Text style={styles.urduText}>محفوظ سوار</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Travel Together. Stay Safe.</Text>
        <View style={styles.taglineDivider} />
        <Text style={styles.subTagline}>Women's Hyper-Local Transit</Text>
        <Text style={styles.subTagline}>Pakistan</Text>
      </Animated.View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, { backgroundColor: Colors.primary, transform: [{ scale: 1.3 }] }]} />
        <View style={styles.loadingDot} />
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
  bgCircle1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: Colors.secondary,
    opacity: 0.08,
    top: -200,
    right: -200,
  },
  bgCircle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.primary,
    opacity: 0.05,
    bottom: -100,
    left: -150,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldContainer: {
    marginBottom: 20,
  },
  shieldOuter: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  shieldInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldEmoji: {
    fontSize: 56,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-20deg' }],
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  urduContainer: {
    marginTop: 6,
  },
  urduText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 2,
  },
  taglineContainer: {
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  taglineDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  subTagline: {
    color: Colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
});
