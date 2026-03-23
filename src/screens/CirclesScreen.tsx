import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import CircleCard from '../components/CircleCard';
import { useAppStore } from '../store/appStore';
import { requestJoinCircle } from '../services/circlesService';

const CATEGORIES = [
  { label: 'All',        icon: 'apps-outline' },
  { label: 'University', icon: 'school-outline' },
  { label: 'Hospital',   icon: 'medical-outline' },
];

export default function CirclesScreen() {
  const { state, dispatch } = useAppStore();
  const [searchQuery, setSearchQuery]           = useState('');
  const [refreshing, setRefreshing]             = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredCircles = state.circles.filter(circle => {
    const matchesSearch =
      !searchQuery ||
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || circle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoin = useCallback(async (circleId: string) => {
    const circle = state.circles.find(c => c.id === circleId);
    if (!circle) return;
    Alert.alert(
      `Join ${circle.name}?`,
      `You'll join ${circle.institution} with ${circle.memberCount} verified women.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join Circle',
          onPress: async () => {
            const result = await requestJoinCircle(circleId, 'current_user');
            if (result.success) {
              dispatch({ type: 'JOIN_CIRCLE', payload: circleId });
              Alert.alert('Joined!', result.message);
            }
          },
        },
      ]
    );
  }, [state.circles, dispatch]);

  const handleView = useCallback((circleId: string) => {
    const circle = state.circles.find(c => c.id === circleId);
    if (!circle) return;
    Alert.alert(
      circle.name,
      `${circle.institution}\n\n👥 ${circle.memberCount} Members\n🚗 ${circle.ridesPerDay} rides/day\n📍 ${circle.category}\n\n${circle.isJoined ? '✅ You are a member.' : 'Join to schedule rides.'}`,
      [
        circle.isJoined
          ? { text: 'Close' }
          : { text: 'Join Now', onPress: () => handleJoin(circleId) },
        circle.isJoined ? undefined : { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  }, [state.circles, handleJoin]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const joinedCount   = state.circles.filter(c => c.isJoined).length;
  const totalMembers  = state.circles.reduce((s, c) => s + c.memberCount, 0);
  const totalRides    = state.circles.reduce((s, c) => s + c.ridesPerDay, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Your Community</Text>
          <Text style={styles.headerTitle}>Institution Circles</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={21} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <View style={styles.statsBar}>
        {[
          { value: state.circles.length, label: 'Circles',     icon: 'layers-outline',  color: Colors.primary },
          { value: totalMembers.toLocaleString(), label: 'Women', icon: 'people-outline',  color: '#9C27B0' },
          { value: totalRides,           label: 'Rides Today',  icon: 'car-outline',      color: Colors.verified },
        ].map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon as any} size={14} color={s.color} />
              </View>
              <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search circles or institutions..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category pills ─────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map(cat => {
          const active = selectedCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryPill, active && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.label)}
            >
              <Ionicons
                name={cat.icon as any}
                size={13}
                color={active ? Colors.textPrimary : Colors.textMuted}
              />
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Joined summary ─────────────────────────────────────────────── */}
      {joinedCount > 0 && (
        <View style={styles.memberBanner}>
          <Ionicons name="checkmark-circle" size={15} color={Colors.verified} />
          <Text style={styles.memberBannerText}>
            Member of <Text style={{ color: Colors.verified, fontWeight: '800' }}>{joinedCount}</Text> circle{joinedCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {filteredCircles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No circles found</Text>
            <Text style={styles.emptyText}>Try a different search or category</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCircles.map(circle => (
              <View key={circle.id} style={styles.gridItem}>
                <CircleCard circle={circle} onJoin={handleJoin} onView={handleView} />
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomNote}>
          <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
          <Text style={styles.bottomNoteText}>All circles require NADRA verification</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
  },
  eyebrow: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5, borderColor: Colors.cardBackground,
  },

  // Stats
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20, borderRadius: 18, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
    elevation: 3, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 20, fontWeight: '900' },
  statLabel: { color: Colors.textMuted, fontSize: 10, textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20, borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 12 },

  // Categories
  categoryRow: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.cardBackground,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: Colors.textPrimary },

  // Member banner
  memberBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.verifiedLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  memberBannerText: { color: Colors.textSecondary, fontSize: 13 },

  // Grid
  gridContent: { paddingHorizontal: 20, paddingBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },

  // Bottom note
  bottomNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, opacity: 0.65,
  },
  bottomNoteText: { color: Colors.textMuted, fontSize: 12 },
});
