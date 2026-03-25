import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/appStore';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AuthScreen({ navigation }: Props) {
  const C = useTheme();
  const { state } = useAppStore();
  const isMale = state.selectedGender === 'male';

  const FEATURES = [
    { icon: 'shield-checkmark', text: 'NADRA CNIC Verified' },
    { icon: 'scan',             text: 'Biometric Authentication' },
    { icon: 'people',           text: isMale ? 'Verified Male Platform' : 'Women-Only Platform' },
    { icon: 'wifi',             text: 'Offline SOS Mesh Network' },
  ];

  const logoAnim    = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim,    { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnAnim,     { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />

      {/* Background glows */}
      <View style={[styles.glow1, { backgroundColor: C.primary }]} />
      <View style={[styles.glow2, { backgroundColor: C.secondary }]} />

      {/* Logo section */}
      <Animated.View style={[styles.logoSection, {
        opacity: logoAnim,
        transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        <View style={[styles.shieldBox, { backgroundColor: C.cardBackground, borderColor: C.borderStrong, shadowColor: C.primary }]}>
          <Text style={styles.shieldEmoji}>{isMale ? '🛡️' : '🛡️'}</Text>
        </View>
        <Text style={[styles.appName, { color: C.textPrimary, textShadowColor: C.primary }]}>Safe-Sawar</Text>
        <Text style={[styles.urdu, { color: C.primary }]}>محفوظ سوار</Text>
        <Text style={[styles.tagline, { color: C.textMuted }]}>
          {isMale ? "Pakistan's Verified Male Carpooling" : "Pakistan's First Women-Only Carpooling"}
        </Text>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View style={[styles.featuresWrap, { opacity: contentAnim }]}>
        <View style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featurePill, { backgroundColor: C.cardBackground, borderColor: C.border }]}>
              <Ionicons name={f.icon as any} size={14} color={C.primary} />
              <Text style={[styles.featureText, { color: C.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.btnSection, {
        opacity: btnAnim,
        transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        {/* Create Account */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: C.primary, shadowColor: C.primary }]}
          onPress={() => navigation.navigate('RoleSelection')}
          activeOpacity={0.88}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create Account</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: C.cardBackground, borderColor: C.primary }]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <Ionicons name="log-in-outline" size={20} color={C.primary} />
          <Text style={[styles.loginBtnText, { color: C.primary }]}>Sign In</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: C.textMuted }]}>
          By continuing you agree to our Terms of Service.{'\n'}
          {isMale ? 'Safe-Sawar verifies all male users via NADRA.' : 'Safe-Sawar is exclusively for women.'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 48, paddingHorizontal: 24,
  },
  glow1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: Colors.primary, opacity: 0.05, top: -100, right: -100,
  },
  glow2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.secondary, opacity: 0.06, bottom: -60, left: -80,
  },

  logoSection: { alignItems: 'center', gap: 10, marginTop: 20 },
  shieldBox: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.borderStrong,
    elevation: 16, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20,
    marginBottom: 8,
  },
  shieldEmoji: { fontSize: 52 },
  appName: {
    fontSize: 36, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: 1.5,
    textShadowColor: Colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  urdu: { fontSize: 16, color: Colors.primary, fontWeight: '600', letterSpacing: 2 },
  tagline: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },

  featuresWrap: { width: '100%' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  featureText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },

  btnSection: { width: '100%', gap: 12 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, gap: 10,
    elevation: 10, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14,
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardBackground, borderRadius: 16, paddingVertical: 16, gap: 10,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  loginBtnText: { color: Colors.primary, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  disclaimer: {
    color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 4,
  },
});
