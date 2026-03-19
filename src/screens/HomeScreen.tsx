import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import SOSButton from '../components/SOSButton';
import MeshNetworkStatus from '../components/MeshNetworkStatus';

const QUICK_ACTIONS = [
  { icon: 'car', label: 'Schedule\nRide', screen: 'ScheduleRide', color: Colors.primary },
  { icon: 'people', label: 'My\nCircles', screen: 'Circles', color: '#9C27B0' },
  { icon: 'heart', label: 'Vouch\nFriend', screen: 'Vouch', color: Colors.secondary },
  { icon: 'map', label: 'Track\nRide', screen: 'RideInProgress', color: Colors.verified },
];

export default function HomeScreen({ navigation }: any) {
  const { state } = useAppStore();
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    Animated.timing(greetingAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    cardAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(i * 100 + 200),
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const userName = state.user?.name?.split(' ')[0] || 'Welcome';
  const joinedCircles = state.circles.filter(c => c.isJoined);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: greetingAnim }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
            {state.isVerified && (
              <View style={styles.verifiedBanner}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.verified} />
                <Text style={styles.verifiedBannerText}>NADRA Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileEmoji}>👩</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Safety status card */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Text style={styles.safetyTitle}>Safety Status</Text>
            <View style={styles.safetyActive}>
              <View style={styles.safetyDot} />
              <Text style={styles.safetyActiveText}>Protected</Text>
            </View>
          </View>
          <MeshNetworkStatus compact showLabel />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <Animated.View
              key={action.screen}
              style={[
                styles.quickActionWrapper,
                {
                  opacity: cardAnims[i],
                  transform: [
                    {
                      translateY: cardAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* My Circles */}
        {joinedCircles.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Circles</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Circles')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.circlesRow}
            >
              {joinedCircles.map(circle => (
                <View key={circle.id} style={styles.circleChip}>
                  <Text style={styles.circleChipEmoji}>{circle.emoji}</Text>
                  <View>
                    <Text style={styles.circleChipName}>{circle.name}</Text>
                    <Text style={styles.circleChipStats}>
                      {circle.memberCount} members • {circle.ridesPerDay} rides
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.user?.trustCredits ?? 5}</Text>
            <Text style={styles.statLabel}>Trust Credits</Text>
            <Ionicons name="heart" size={16} color={Colors.primary} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{joinedCircles.length}</Text>
            <Text style={styles.statLabel}>Circles Joined</Text>
            <Ionicons name="people" size={16} color={Colors.primary} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{state.contacts.filter(c => c.isVouched).length}</Text>
            <Text style={styles.statLabel}>Women Vouched</Text>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} style={styles.statIcon} />
          </View>
        </View>

        {/* Emergency SOS */}
        <View style={styles.sosCard}>
          <View style={styles.sosLeft}>
            <Text style={styles.sosCardTitle}>Emergency SOS</Text>
            <Text style={styles.sosCardDesc}>
              Sends your location to emergency contacts instantly. Works even offline via mesh network.
            </Text>
          </View>
          <SOSButton large={false} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 54,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.verifiedLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedBannerText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {},
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderStrong,
  },
  profileEmoji: {
    fontSize: 26,
  },
  safetyCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  safetyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  safetyActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.verifiedLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.verified,
  },
  safetyActiveText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickActionWrapper: {
    width: '47%',
  },
  quickActionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  circlesRow: {
    paddingRight: 20,
    gap: 10,
    marginBottom: 24,
    paddingLeft: 0,
  },
  circleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 160,
  },
  circleChipEmoji: {
    fontSize: 28,
  },
  circleChipName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  circleChipStats: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
  statIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.5,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.sosRed + '30',
    gap: 14,
  },
  sosLeft: {
    flex: 1,
  },
  sosCardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sosCardDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
