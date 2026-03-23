import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import SOSButton from '../components/SOSButton';
import MeshNetworkStatus from '../components/MeshNetworkStatus';
import ProfileModal from '../components/ProfileModal';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'car',    label: 'Schedule Ride',  desc: 'Find a SheRah',     screen: 'ScheduleRide',  color: Colors.primary },
  { icon: 'people', label: 'My Circles',      desc: 'Community vaults',  screen: 'Circles',       color: '#9C27B0' },
  { icon: 'heart',  label: 'Vouch Friend',    desc: 'Build trust',       screen: 'Vouch',         color: '#E91E63' },
  { icon: 'map',    label: 'Track Ride',      desc: 'Live location',     screen: 'RideInProgress', color: Colors.verified },
];

export default function HomeScreen({ navigation }: any) {
  const { state, dispatch } = useAppStore();
  const [profileVisible, setProfileVisible] = useState(false);
  const headerAnim   = useRef(new Animated.Value(0)).current;
  const heroAnim     = useRef(new Animated.Value(0)).current;
  const cardAnims    = useRef(QUICK_ACTIONS.map(() => new Animated.Value(0))).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(heroAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
      ...cardAnims.map(a =>
        Animated.spring(a, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true })
      ),
    ]).start();

    // Pulsing safety dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const userName     = state.user?.name?.split(' ')[0] || 'Welcome';
  const initials     = state.user?.name
    ? state.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '👩';
  const joinedCircles = state.circles.filter(c => c.isJoined);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
            {state.isVerified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={11} color={Colors.verified} />
                <Text style={styles.verifiedPillText}>NADRA Verified</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => setProfileVisible(true)}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.avatarOnline} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero — Book a ride CTA ─────────────────────────────────────── */}
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <TouchableOpacity
            style={styles.heroCard}
            onPress={() => navigation.navigate('ScheduleRide')}
            activeOpacity={0.9}
          >
            {/* Background decoration */}
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroEyebrow}>Women-only • NADRA verified</Text>
                <Text style={styles.heroTitle}>Book a{'\n'}Safe Ride</Text>
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>Find SheRahs</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.textPrimary} />
                </View>
              </View>
              <View style={styles.heroIconWrap}>
                <Text style={styles.heroIcon}>🚗</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Safety Status ──────────────────────────────────────────────── */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyLeft}>
            <View style={styles.safetyIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.verified} />
            </View>
            <View>
              <Text style={styles.safetyTitle}>Safety Status</Text>
              <MeshNetworkStatus compact showLabel />
            </View>
          </View>
          <View style={styles.safetyStatus}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.safetyStatusText}>Protected</Text>
          </View>
        </View>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionAccent, { backgroundColor: Colors.primary }]} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <Animated.View
              key={action.screen}
              style={[
                styles.actionWrapper,
                {
                  opacity: cardAnims[i],
                  transform: [{ scale: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon as any} size={26} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
                <View style={[styles.actionArrow, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name="chevron-forward" size={12} color={action.color} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* ── My Circles ─────────────────────────────────────────────────── */}
        {joinedCircles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionAccent, { backgroundColor: '#9C27B0' }]} />
                <Text style={styles.sectionTitle}>My Circles</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Circles')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.circlesScroll}
            >
              {joinedCircles.map(circle => (
                <View key={circle.id} style={styles.circleChip}>
                  <Text style={styles.circleEmoji}>{circle.emoji}</Text>
                  <View style={styles.circleInfo}>
                    <Text style={styles.circleName} numberOfLines={1}>{circle.name}</Text>
                    <Text style={styles.circleStats}>{circle.memberCount} members</Text>
                  </View>
                  <View style={styles.circleJoinedBadge}>
                    <Ionicons name="checkmark" size={10} color={Colors.verified} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionAccent, { backgroundColor: Colors.verified }]} />
            <Text style={styles.sectionTitle}>Your Stats</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: state.user?.trustCredits ?? 5,                          label: 'Trust Credits', icon: 'heart',           color: Colors.primary },
            { value: joinedCircles.length,                                    label: 'Circles',       icon: 'people',          color: '#9C27B0' },
            { value: state.contacts.filter(c => c.isVouched).length,         label: 'Vouched',       icon: 'shield-checkmark', color: Colors.verified },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SOS Card ───────────────────────────────────────────────────── */}
        <View style={styles.sosCard}>
          <View style={styles.sosGlow} />
          <View style={styles.sosLeft}>
            <View style={styles.sosIconWrap}>
              <Ionicons name="warning" size={18} color={Colors.sosRed} />
            </View>
            <View style={styles.sosTextWrap}>
              <Text style={styles.sosTitle}>Emergency SOS</Text>
              <Text style={styles.sosDesc}>Works offline via Bluetooth mesh</Text>
            </View>
          </View>
          <SOSButton large={false} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  greeting: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 2 },
  userName: { color: Colors.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 6 },
  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: Colors.verifiedLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedPillText: { color: Colors.verified, fontSize: 11, fontWeight: '700' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
    position: 'relative',
  },
  avatarText: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  avatarOnline: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.verified,
    borderWidth: 2, borderColor: Colors.background,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primary + '15', top: -60, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.primary + '10', bottom: -30, right: 60,
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  heroEyebrow: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  heroTitle: { color: Colors.textPrimary, fontSize: 28, fontWeight: '900', lineHeight: 32, marginBottom: 16 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  heroBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800' },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  heroIcon: { fontSize: 44 },

  // Safety card
  safetyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 18, padding: 14, marginBottom: 22,
    borderWidth: 1, borderColor: Colors.border,
  },
  safetyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  safetyIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.verifiedLight, alignItems: 'center', justifyContent: 'center',
  },
  safetyTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  safetyStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.verified },
  safetyStatusText: { color: Colors.verified, fontSize: 12, fontWeight: '700' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  seeAll: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 24,
  },
  actionWrapper: { width: '47.5%' },
  actionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    gap: 8,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
    position: 'relative',
  },
  actionIconBox: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  actionDesc: { color: Colors.textMuted, fontSize: 11 },
  actionArrow: {
    position: 'absolute', top: 14, right: 14,
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // My circles
  circlesScroll: { paddingRight: 4, gap: 10, marginBottom: 24 },
  circleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    minWidth: 170, position: 'relative',
  },
  circleEmoji: { fontSize: 28 },
  circleInfo: { flex: 1 },
  circleName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  circleStats: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  circleJoinedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.verifiedLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground,
    borderRadius: 18, padding: 14,
    alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: Colors.textMuted, fontSize: 10, textAlign: 'center' },

  // SOS card
  sosCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.sosRed + '35',
    gap: 12, overflow: 'hidden', position: 'relative',
    elevation: 6, shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 10,
  },
  sosGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.sosRed + '06',
  },
  sosLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sosIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.sosRed + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  sosTextWrap: { flex: 1 },
  sosTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  sosDesc: { color: Colors.textMuted, fontSize: 11 },
});
