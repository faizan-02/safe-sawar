import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const WEEKLY_DATA = [
  { day: 'Mon', amount: 560, rides: 2 },
  { day: 'Tue', amount: 840, rides: 3 },
  { day: 'Wed', amount: 280, rides: 1 },
  { day: 'Thu', amount: 1120, rides: 4 },
  { day: 'Fri', amount: 700, rides: 2 },
  { day: 'Sat', amount: 420, rides: 2 },
  { day: 'Sun', amount: 0, rides: 0 },
];

const TRANSACTIONS = [
  { id: '1', date: 'Today, 8:45 AM',    desc: 'Ride: F-10 → PIMS',       amount: '+Rs. 560', type: 'credit' },
  { id: '2', date: 'Yesterday, 9:10 AM', desc: 'Ride: G-9 → NUST',        amount: '+Rs. 840', type: 'credit' },
  { id: '3', date: 'Mar 20',             desc: 'Ride: Blue Area → PIMS',  amount: '+Rs. 280', type: 'credit' },
  { id: '4', date: 'Mar 19',             desc: 'Ride: I-8 → Comsats',     amount: '+Rs. 1,120', type: 'credit' },
  { id: '5', date: 'Mar 18',             desc: 'Withdrawal to EasyPaisa', amount: '-Rs. 2,000', type: 'debit' },
];

const MAX_AMOUNT = Math.max(...WEEKLY_DATA.map(d => d.amount));

export default function EarningsScreen() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const totalWeek = WEEKLY_DATA.reduce((a, b) => a + b.amount, 0);
  const totalRides = WEEKLY_DATA.reduce((a, b) => a + b.rides, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSub}>Track your income</Text>
        </View>

        {/* Period toggle */}
        <View style={styles.periodToggle}>
          {(['week', 'month'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total earnings card */}
        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>Total Earned</Text>
            <Text style={styles.totalAmount}>Rs. {period === 'week' ? '3,920' : '18,450'}</Text>
            <View style={styles.growthRow}>
              <Ionicons name="trending-up" size={14} color={Colors.verified} />
              <Text style={styles.growthText}>+12% vs last {period}</Text>
            </View>
          </View>
          <View style={styles.totalRight}>
            <View style={styles.totalStatItem}>
              <Text style={styles.totalStatValue}>{period === 'week' ? totalRides : 58}</Text>
              <Text style={styles.totalStatLabel}>Rides</Text>
            </View>
            <View style={styles.totalStatDivider} />
            <View style={styles.totalStatItem}>
              <Text style={styles.totalStatValue}>Rs. {period === 'week' ? '280' : '318'}</Text>
              <Text style={styles.totalStatLabel}>Avg/Ride</Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Earnings</Text>
          <View style={styles.chart}>
            {WEEKLY_DATA.map((d, i) => {
              const heightPct = MAX_AMOUNT > 0 ? (d.amount / MAX_AMOUNT) * 100 : 0;
              const isToday = d.day === 'Mon';
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barAmount}>
                    {d.amount > 0 ? `${d.amount / 1000 >= 1 ? (d.amount / 1000).toFixed(1) + 'k' : d.amount}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: `${Math.max(heightPct, 4)}%` },
                        isToday && styles.barToday,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, isToday && styles.barDayToday]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Withdrawal section */}
        <View style={styles.withdrawCard}>
          <View>
            <Text style={styles.withdrawLabel}>Available Balance</Text>
            <Text style={styles.withdrawAmount}>Rs. 3,920</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn}>
            <Ionicons name="arrow-down-circle" size={18} color={Colors.textPrimary} />
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {TRANSACTIONS.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? Colors.verified + '20' : '#e5393520' }]}>
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={tx.type === 'credit' ? Colors.verified : '#e53935'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? Colors.verified : '#e53935' }]}>
                {tx.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '500' },

  periodToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.surfaceBackground, borderRadius: 12, padding: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.cardBackground },
  periodBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  periodBtnTextActive: { color: Colors.textPrimary },

  totalCard: {
    marginHorizontal: 20, marginBottom: 16, padding: 20,
    backgroundColor: Colors.primary, borderRadius: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  totalLeft: {},
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: 6 },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  growthText: { fontSize: 12, color: Colors.verified, fontWeight: '600' },
  totalRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  totalStatItem: { alignItems: 'center' },
  totalStatValue: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  totalStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  totalStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },

  chartCard: {
    marginHorizontal: 20, marginBottom: 16, padding: 16,
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  chartTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barAmount: { fontSize: 8, color: Colors.textMuted, marginBottom: 2 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.primary + '60', borderRadius: 4 },
  barToday: { backgroundColor: Colors.primary },
  barDay: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  barDayToday: { color: Colors.primary, fontWeight: '700' },

  withdrawCard: {
    marginHorizontal: 20, marginBottom: 20, padding: 16,
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  withdrawLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  withdrawAmount: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
  },
  withdrawBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },

  section: { marginHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
});
