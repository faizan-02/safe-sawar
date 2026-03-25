import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/appStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// accent for Passenger is set dynamically below using C.primary
const ROLES_BASE = [
  {
    icon: 'person' as const,
    title: 'Passenger',
    subtitle: 'I need a safe, verified ride',
    highlights: [
      { icon: 'car',            text: 'Book verified-only rides instantly' },
      { icon: 'shield-checkmark', text: 'Stay within your trusted Circle' },
      { icon: 'navigate',       text: 'Share live location with family' },
    ],
    accentKey: 'primary' as const,
    screen: 'PassengerRegistration',
    emoji: '🚗',
  },
  {
    icon: 'car' as const,
    title: 'Carpooler',
    subtitle: 'I want to offer rides & earn',
    highlights: [
      { icon: 'people',    text: 'Offer verified rides & earn money' },
      { icon: 'wallet',    text: 'Earn while you commute' },
      { icon: 'map',       text: 'Full vehicle & route control' },
    ],
    accentKey: 'carpooler' as const,
    screen: 'CarpoolerRegistration',
    emoji: '🛞',
  },
];

const CARPOOLER_ACCENT = '#7C3AED';

type RoleItem = typeof ROLES_BASE[number] & { accent: string };

function RoleCard({
  role,
  onPress,
  enterAnim,
  C,
}: {
  role: RoleItem;
  index: number;
  onPress: () => void;
  enterAnim: Animated.Value;
  C: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [
          { scale },
          { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
        ],
      }}
    >
      <TouchableOpacity
        style={[styles.card, { borderColor: role.accent + '50', backgroundColor: C.cardBackground }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Top accent */}
        <View style={[styles.cardAccentBar, { backgroundColor: role.accent }]} />

        <View style={styles.cardBody}>
          {/* Icon + emoji cluster */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: role.accent + '18', borderColor: role.accent + '40' }]}>
              <Ionicons name={role.icon} size={30} color={role.accent} />
            </View>
            <Text style={styles.cardEmoji}>{role.emoji}</Text>
          </View>

          <Text style={styles.cardTitle}>{role.title}</Text>
          <Text style={styles.cardSubtitle}>{role.subtitle}</Text>

          <View style={styles.divider} />

          {/* Highlights */}
          {role.highlights.map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <View style={[styles.highlightIconWrap, { backgroundColor: role.accent + '15' }]}>
                <Ionicons name={h.icon as any} size={13} color={role.accent} />
              </View>
              <Text style={styles.highlightText}>{h.text}</Text>
            </View>
          ))}

          {/* CTA */}
          <View style={[styles.cta, { backgroundColor: role.accent }]}>
            <Text style={styles.ctaText}>Continue as {role.title}</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen({ navigation }: Props) {
  const C = useTheme();
  const { state } = useAppStore();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims  = useRef(ROLES_BASE.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.stagger(120,
        cardAnims.map(a =>
          Animated.spring(a, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true })
        )
      ),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
        <Text style={styles.eyebrow}>Welcome to Safe-Sawar</Text>
        <Text style={styles.title}>How will you{'\n'}travel today?</Text>
        <Text style={styles.subtitle}>
          Choose your role — you can switch anytime from your profile.
        </Text>

        {/* Verification badge */}
        <View style={[styles.verificationBadge, { backgroundColor: C.primaryGlow, borderColor: C.border }]}>
          <Ionicons name="shield-checkmark" size={16} color={C.primary} />
          <Text style={styles.verificationText}>
            All roles require NADRA CNIC + biometric verification
          </Text>
        </View>
      </Animated.View>

      {/* Role cards */}
      {ROLES_BASE.map((roleBase, i) => {
        const role = { ...roleBase, accent: roleBase.accentKey === 'primary' ? C.primary : CARPOOLER_ACCENT };
        return (
          <View key={role.screen} style={i > 0 ? { marginTop: 14 } : {}}>
            <RoleCard
              role={role}
              index={i}
              enterAnim={cardAnims[i]}
              onPress={() => navigation.navigate(role.screen)}
              C={C}
            />
          </View>
        );
      })}

      <Text style={styles.footerNote}>
        {state.selectedGender === 'male'
          ? 'Safe-Sawar male section is for verified men only.'
          : 'Safe-Sawar is exclusively for women.'}
        {'\n'}All members are verified through NADRA.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 44 },

  header: { marginBottom: 28 },
  eyebrow: { color: Colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, lineHeight: 38, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },

  verificationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  verificationText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 22, borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 6, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  cardAccentBar: { height: 4 },
  cardBody: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 42 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },

  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  highlightIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  highlightText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14, marginTop: 18,
    elevation: 4,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  footerNote: {
    textAlign: 'center', color: Colors.textMuted,
    fontSize: 12, lineHeight: 18, marginTop: 28,
  },
});
