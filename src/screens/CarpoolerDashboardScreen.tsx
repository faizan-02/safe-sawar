import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import ProfileModal from '../components/ProfileModal';

const MOCK_REQUESTS = [
  {
    id: '1', passengerName: 'Sara Ahmed', from: 'F-10 Markaz', to: 'PIMS Hospital',
    time: '8:15 AM', seats: 1, circle: 'PIMS Islamabad', trustScore: 4.8,
  },
  {
    id: '2', passengerName: 'Fatima Khan', from: 'G-9 Markaz', to: 'PIMS Hospital',
    time: '8:15 AM', seats: 1, circle: 'NUST Islamabad', trustScore: 4.9,
  },
  {
    id: '3', passengerName: 'Amina Malik', from: 'Blue Area', to: 'PIMS Hospital',
    time: '8:30 AM', seats: 1, circle: 'Comsats University', trustScore: 4.7,
  },
];

export default function CarpoolerDashboardScreen({ navigation }: any) {
  const { state, dispatch } = useAppStore();
  const [isOnline, setIsOnline] = useState(false);
  const [acceptedRequests, setAcceptedRequests] = useState<string[]>([]);
  const [profileVisible, setProfileVisible] = useState(false);

  const userName = state.user?.name || 'Driver';
  const initial = userName !== 'Driver' ? userName[0].toUpperCase() : 'D';

  const handleAccept = (id: string) => setAcceptedRequests(prev => [...prev, id]);
  const handleDecline = (id: string) => setAcceptedRequests(prev => prev.filter(r => r !== id));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Driver Dashboard</Text>
            <Text style={styles.subGreeting}>Manage your rides & requests</Text>
          </View>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => setProfileVisible(true)}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        {/* Online toggle */}
        <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
          <View style={styles.onlineLeft}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.verified : Colors.textMuted }]} />
            <View>
              <Text style={styles.onlineTitle}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
              <Text style={styles.onlineDesc}>
                {isOnline ? 'Passengers can see your route and book seats.' : 'Toggle to start accepting ride requests.'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: Colors.border, true: Colors.verified + '60' }}
            thumbColor={isOnline ? Colors.verified : Colors.textMuted}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: "Today's Rides", value: '2', icon: 'car', color: Colors.primary },
            { label: "Earned Today", value: 'Rs. 560', icon: 'cash', color: Colors.verified },
            { label: 'Rating', value: '4.9 ⭐', icon: 'star', color: '#FFB300' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Current route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Route Today</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeDots}>
                <View style={styles.dotFrom} />
                <View style={styles.routeLine} />
                <View style={styles.dotTo} />
              </View>
              <View style={styles.routeAddresses}>
                <View>
                  <Text style={styles.routeLabel}>Pickup From</Text>
                  <Text style={styles.routeAddress}>F-10 Markaz, Islamabad</Text>
                </View>
                <View>
                  <Text style={styles.routeLabel}>Dropping At</Text>
                  <Text style={styles.routeAddress}>PIMS Hospital, Islamabad</Text>
                </View>
              </View>
            </View>
            <View style={styles.routeMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>8:15 AM</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>3 seats available</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>Rs. 280/seat</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editRouteBtn}>
              <Ionicons name="pencil" size={14} color={Colors.primary} />
              <Text style={styles.editRouteBtnText}>Edit Route</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Incoming requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ride Requests</Text>
            {isOnline && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>

          {!isOnline ? (
            <View style={styles.offlineNotice}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.offlineText}>Go online to receive ride requests</Text>
            </View>
          ) : MOCK_REQUESTS.map(req => {
            const accepted = acceptedRequests.includes(req.id);
            return (
              <View key={req.id} style={[styles.requestCard, accepted && styles.requestCardAccepted]}>
                <View style={styles.requestTop}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                      <Text style={styles.passengerAvatarText}>{req.passengerName[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.passengerName}>{req.passengerName}</Text>
                      <Text style={styles.passengerCircle}>📍 {req.circle}</Text>
                    </View>
                  </View>
                  <View style={styles.trustBadge}>
                    <Ionicons name="star" size={11} color="#FFB300" />
                    <Text style={styles.trustScore}>{req.trustScore}</Text>
                  </View>
                </View>

                <View style={styles.requestRoute}>
                  <Ionicons name="location-outline" size={14} color={Colors.primary} />
                  <Text style={styles.requestRouteText}>{req.from} → {req.to}</Text>
                  <Text style={styles.requestTime}>{req.time}</Text>
                </View>

                {accepted ? (
                  <View style={styles.acceptedBanner}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                    <Text style={styles.acceptedText}>Accepted — Passenger notified</Text>
                  </View>
                ) : (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleDecline(req.id)}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(req.id)}
                    >
                      <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  subGreeting: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },

  onlineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16,
    backgroundColor: Colors.cardBackground, borderWidth: 1.5, borderColor: Colors.border,
  },
  onlineCardActive: { borderColor: Colors.verified + '60', backgroundColor: Colors.verified + '08' },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
  onlineTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  onlineDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2, maxWidth: 200 },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.verified + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.verified },
  liveText: { fontSize: 11, fontWeight: '700', color: Colors.verified },

  routeCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  routeRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  dotFrom: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  routeLine: { width: 2, height: 24, backgroundColor: Colors.border, marginVertical: 4 },
  dotTo: { width: 10, height: 10, borderRadius: 3, backgroundColor: Colors.verified },
  routeAddresses: { gap: 16 },
  routeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeAddress: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  routeMeta: { flexDirection: 'row', gap: 16, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  editRouteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  editRouteBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  offlineNotice: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  offlineText: { color: Colors.textMuted, fontSize: 14 },

  requestCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  requestCardAccepted: { borderColor: Colors.verified + '50' },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  passengerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  passengerAvatarText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },
  passengerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  passengerCircle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFB30020', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  trustScore: { fontSize: 12, fontWeight: '700', color: '#FFB300' },

  requestRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  requestRouteText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  requestTime: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  requestActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surfaceBackground, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  declineBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary, gap: 6,
  },
  acceptBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },

  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.verifiedLight, borderRadius: 10, padding: 10 },
  acceptedText: { color: Colors.verified, fontSize: 13, fontWeight: '600' },
});
