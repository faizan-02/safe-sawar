import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/appStore';

const MOCK_RIDES = [
  {
    id: '1', date: 'Today, 8:15 AM', from: 'F-10 Markaz', to: 'PIMS Hospital',
    driver: 'Fatima Khan', status: 'completed', fare: 'Rs. 280', rating: 5,
  },
  {
    id: '2', date: 'Yesterday, 9:00 AM', from: 'G-9 Markaz', to: 'NUST H-12',
    driver: 'Sara Ahmed', status: 'completed', fare: 'Rs. 340', rating: 4,
  },
  {
    id: '3', date: 'Mar 20, 7:45 AM', from: 'Blue Area', to: 'Quaid-i-Azam Uni',
    driver: 'Amina Malik', status: 'cancelled', fare: '—', rating: 0,
  },
  {
    id: '4', date: 'Mar 19, 8:30 AM', from: 'I-8 Markaz', to: 'Comsats University',
    driver: 'Zara Hussain', status: 'completed', fare: 'Rs. 310', rating: 5,
  },
  {
    id: '5', date: 'Mar 18, 8:00 AM', from: 'F-6 Super Market', to: 'PIMS Hospital',
    driver: 'Nadia Iqbal', status: 'completed', fare: 'Rs. 260', rating: 4,
  },
];

const MOCK_OFFERED = [
  {
    id: '1', date: 'Today, 8:00 AM', from: 'F-10 Markaz', to: 'PIMS Hospital',
    passengers: 2, status: 'completed', earned: 'Rs. 560',
  },
  {
    id: '2', date: 'Yesterday, 7:50 AM', from: 'G-9 Markaz', to: 'NUST H-12',
    passengers: 3, status: 'completed', earned: 'Rs. 1,020',
  },
  {
    id: '3', date: 'Mar 20, 8:15 AM', from: 'Blue Area', to: 'Centaurus Mall',
    passengers: 1, status: 'completed', earned: 'Rs. 190',
  },
];

const STATUS_COLOR: Record<string, string> = {
  completed: Colors.verified,
  cancelled: '#e53935',
  upcoming: Colors.primary,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={12} color="#FFB300" />
      ))}
    </View>
  );
}

export default function MyRidesScreen() {
  const C = useTheme();
  const { state } = useAppStore();
  const isDriver = state.user?.role === 'carpooler';
  const [tab, setTab] = useState<'history' | 'upcoming'>('history');
  const rides = isDriver ? MOCK_OFFERED : MOCK_RIDES;

  const totalFare = isDriver
    ? 'Rs. 1,770'
    : `Rs. ${MOCK_RIDES.filter(r => r.status === 'completed').reduce((a) => a + 1, 0) * 290}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>My Rides</Text>
        <Text style={styles.headerSub}>{isDriver ? 'Your offered rides' : 'Your ride history'}</Text>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: C.textPrimary }]}>{rides.length}</Text>
          <Text style={styles.summaryLabel}>Total Rides</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: C.textPrimary }]}>
            {rides.filter(r => r.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>
            {isDriver ? 'Rs. 1,770' : 'Rs. 1,160'}
          </Text>
          <Text style={styles.summaryLabel}>{isDriver ? 'Earned' : 'Spent'}</Text>
        </View>
      </View>

      {/* Tab selector */}
      <View style={styles.tabs}>
        {(['history', 'upcoming'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'history' ? 'History' : 'Upcoming'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {tab === 'upcoming' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No upcoming rides</Text>
            <Text style={styles.emptyDesc}>
              {isDriver ? 'Offer a ride to see it here.' : 'Book a ride to see it here.'}
            </Text>
          </View>
        ) : (
          rides.map(ride => (
            <View key={ride.id} style={styles.rideCard}>
              {/* Date + status */}
              <View style={styles.rideTop}>
                <View style={styles.rideDate}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.rideDateText}>{ride.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[ride.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[ride.status] }]}>
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routeDots}>
                  <View style={styles.dotFrom} />
                  <View style={styles.routeVertLine} />
                  <View style={styles.dotTo} />
                </View>
                <View style={styles.routeText}>
                  <Text style={[styles.locationText, { color: C.textPrimary }]}>{ride.from}</Text>
                  <Text style={[styles.locationText, { color: C.textPrimary }]}>{ride.to}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.rideFooter}>
                {isDriver ? (
                  <>
                    <View style={styles.footerItem}>
                      <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.footerText}>{(ride as any).passengers} passengers</Text>
                    </View>
                    <Text style={styles.fareText}>{(ride as any).earned}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.footerItem}>
                      <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.footerText}>{(ride as any).driver}</Text>
                    </View>
                    <View style={styles.footerRight}>
                      {(ride as any).rating > 0 && <StarRating rating={(ride as any).rating} />}
                      <Text style={styles.fareText}>{(ride as any).fare}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '500' },

  summaryCard: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.surfaceBackground, borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.cardBackground },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  rideCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  rideTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rideDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rideDateText: { color: Colors.textMuted, fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  routeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  routeDots: { alignItems: 'center', paddingTop: 3 },
  dotFrom: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  routeVertLine: { width: 2, height: 16, backgroundColor: Colors.border, marginVertical: 3 },
  dotTo: { width: 10, height: 10, borderRadius: 3, backgroundColor: Colors.verified },
  routeText: { gap: 8 },
  locationText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: Colors.textMuted, fontSize: 12 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fareText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
