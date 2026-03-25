import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const { width } = Dimensions.get('window');
const TOGGLE_W = width - 64;

type Props = { navigation: NativeStackNavigationProp<any> };

const FEMALE_COLOR = '#E91E63';
const MALE_COLOR   = '#1565C0';

const FEMALE = {
  gender: 'female' as const,
  icon: 'female' as const,
  label: 'Female',
  urdu: 'خواتین',
  headline: 'Safe rides for women',
  sub: 'Verified. Private. Trusted.',
  color: FEMALE_COLOR,
  cardBg: '#FFF5F8',
  borderColor: 'rgba(233,30,99,0.18)',
  shadowColor: FEMALE_COLOR,
  features: [
    { icon: 'person' as const,           label: 'Women-only',    bg: '#E91E63' },
    { icon: 'shield-checkmark' as const, label: 'Verified',      bg: '#388E3C' },
    { icon: 'finger-print' as const,     label: 'Biometric Verification', bg: '#1976D2' },
    { icon: 'people' as const,           label: 'Trust Circles',          bg: '#388E3C' },
  ],
};

const MALE = {
  gender: 'male' as const,
  icon: 'male' as const,
  label: 'Male',
  urdu: 'مرد',
  headline: 'Trusted rides for men',
  sub: 'Verified. Safe. Reliable.',
  color: MALE_COLOR,
  cardBg: '#F5F9FF',
  borderColor: 'rgba(21,101,192,0.18)',
  shadowColor: MALE_COLOR,
  features: [
    { icon: 'person' as const,           label: 'Men-only',              bg: MALE_COLOR },
    { icon: 'shield-checkmark' as const, label: 'Verified',              bg: '#388E3C' },
    { icon: 'finger-print' as const,     label: 'Biometric Verification', bg: '#1976D2' },
    { icon: 'people' as const,           label: 'Trust Circles',         bg: '#388E3C' },
  ],
};

export default function GenderSelectionScreen({ navigation }: Props) {
  const { dispatch } = useAppStore();
  const [selected, setSelected] = useState<'female' | 'male'>('female');

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const cardsAnim   = useRef(new Animated.Value(0)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;
  const femaleScale = useRef(new Animated.Value(1)).current;
  const maleScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(cardsAnim,  { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const selectGender = (g: 'female' | 'male') => {
    setSelected(g);
    Animated.spring(toggleSlide, {
      toValue: g === 'female' ? 0 : 1,
      tension: 70, friction: 12,
      useNativeDriver: true,
    }).start();
    const anim = g === 'female' ? femaleScale : maleScale;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.spring(anim, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handleContinue = (gender: 'female' | 'male') => {
    dispatch({ type: 'SET_GENDER', payload: gender });
    navigation.navigate('Auth');
  };

  const toggleIndicatorX = toggleSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [3, TOGGLE_W / 2 + 3],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ECEDF4" />

      {/* Pakistan flag-style moon + star watermark — centered behind header */}
      <View style={styles.watermarkGroup} pointerEvents="none">
        <Ionicons
          name="moon-outline"
          size={210}
          color="rgba(90,100,140,0.10)"
          style={{ transform: [{ rotate: '20deg' }] }}
        />
        <View style={styles.starOnMoon}>
          <Ionicons name="star" size={52} color="rgba(90,100,140,0.10)" />
        </View>
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] }) }],
      }]}>
        <View style={styles.logoBox}>
          <Ionicons name="shield-half" size={34} color="#2E7D32" />
        </View>
        <Text style={styles.appName}>Safe-Sawar</Text>
        <Text style={styles.appUrdu}>محفوظ سوار</Text>
        <Text style={styles.subtitle}>Select your profile</Text>
      </Animated.View>

      {/* Pill toggle */}
      <Animated.View style={[styles.toggleWrap, {
        opacity: cardsAnim,
        transform: [{ scale: cardsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }]}>
        <View style={styles.toggle}>
          <Animated.View style={[styles.toggleIndicator, {
            transform: [{ translateX: toggleIndicatorX }],
            width: TOGGLE_W / 2 - 6,
          }]} />
          <TouchableOpacity style={styles.toggleTab} onPress={() => selectGender('female')} activeOpacity={0.8}>
            <Ionicons name="female" size={14} color={selected === 'female' ? FEMALE_COLOR : '#9CA3AF'} />
            <Text style={[styles.toggleLabel, selected === 'female' && { color: FEMALE_COLOR, fontWeight: '700' }]}>
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleTab} onPress={() => selectGender('male')} activeOpacity={0.8}>
            <Ionicons name="male" size={14} color={selected === 'male' ? MALE_COLOR : '#9CA3AF'} />
            <Text style={[styles.toggleLabel, selected === 'male' && { color: MALE_COLOR, fontWeight: '700' }]}>
              Male
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Cards — equal height via alignItems stretch */}
      <Animated.View style={[styles.cardsRow, {
        opacity: cardsAnim,
        transform: [{ translateY: cardsAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
      }]}>
        {[FEMALE, MALE].map((g) => {
          const scale      = g.gender === 'female' ? femaleScale : maleScale;
          const isSelected = selected === g.gender;
          return (
            <Animated.View key={g.gender} style={[styles.cardOuter, { transform: [{ scale }] }]}>
              <TouchableOpacity
                style={[styles.card, isSelected ? {
                  backgroundColor: g.cardBg,
                  borderColor: g.color + '55',
                  shadowColor: g.shadowColor,
                  shadowOpacity: 0.16,
                } : {
                  backgroundColor: '#F4F4F6',
                  borderColor: '#E0E0E6',
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                }]}
                onPress={() => selectGender(g.gender)}
                activeOpacity={0.96}
              >
                {/* Icon + label */}
                <View style={styles.iconRow}>
                  <View style={[styles.genderCircle, {
                    backgroundColor: isSelected ? g.color : '#BDBDBD',
                  }]}>
                    <Ionicons name={g.icon} size={21} color="#fff" />
                  </View>
                  <View style={styles.labelBlock}>
                    <Text style={[styles.cardLabel, { color: isSelected ? g.color : '#9E9E9E' }]}>
                      {g.label}
                    </Text>
                    <Text style={[styles.cardUrdu, { color: isSelected ? g.color + 'AA' : '#BDBDBD' }]}>
                      {g.urdu}
                    </Text>
                  </View>
                </View>

                {/* Headline + subline */}
                <Text style={[styles.headline, { color: isSelected ? '#1A1A2E' : '#9E9E9E' }]}>
                  {g.headline}
                </Text>
                <Text style={[styles.subline, { color: isSelected ? '#6B7280' : '#BDBDBD' }]}>
                  {g.sub}
                </Text>

                {/* Features */}
                <View style={[styles.featureBox, { backgroundColor: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.03)' }]}>
                  {g.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={[styles.featureIconWrap, {
                        backgroundColor: isSelected ? f.bg : '#D0D0D0',
                      }]}>
                        <Ionicons name={f.icon} size={12} color="#fff" />
                      </View>
                      <Text style={[styles.featureLabel, { color: isSelected ? '#374151' : '#BDBDBD' }]}>
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Continue button — only on selected card */}
                {isSelected && (
                  <TouchableOpacity
                    style={[styles.cardBtn, { backgroundColor: g.color }]}
                    onPress={() => handleContinue(g.gender)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cardBtnText}>Continue →</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>

      <Text style={styles.footerNote}>All users verified via NADRA CNIC + Biometrics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ECEDF4',
    paddingHorizontal: 14,
    paddingVertical: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },

  // Pakistan flag watermark
  watermarkGroup: {
    position: 'absolute',
    top: '4%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  starOnMoon: {
    position: 'absolute',
    top: 68,
    left: '50%',
    marginLeft: 28,
  },

  // Header
  header:  { alignItems: 'center', marginBottom: 16 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  appName:  { fontSize: 27, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.2 },
  appUrdu:  { fontSize: 14, color: '#6B7280', fontWeight: '500', letterSpacing: 1.5, marginTop: 2 },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 5 },

  // Toggle
  toggleWrap: { alignItems: 'center', marginBottom: 14 },
  toggle: {
    width: TOGGLE_W, height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22, flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute', height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 5, elevation: 3,
  },
  toggleTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, zIndex: 1,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },

  // Cards
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'stretch',   // makes both cards the same height
  },
  cardOuter: { flex: 1 },
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },

  iconRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  genderCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  labelBlock: { flex: 1 },
  cardLabel:  { fontSize: 17, fontWeight: '800' },
  cardUrdu:   { fontSize: 12, fontWeight: '500', letterSpacing: 0.8, marginTop: 1 },

  headline: { fontSize: 12.5, fontWeight: '700', color: '#1A1A2E', lineHeight: 17, marginBottom: 2 },
  subline:  { fontSize: 10.5, color: '#6B7280', fontWeight: '500', marginBottom: 10 },

  featureBox: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 12, padding: 10, gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  featureRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },

  cardBtn: {
    borderRadius: 30, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },

  footerNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
});
