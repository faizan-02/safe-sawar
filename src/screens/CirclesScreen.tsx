import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import CircleCard from '../components/CircleCard';
import { useAppStore } from '../store/appStore';
import { requestJoinCircle } from '../services/circlesService';

export default function CirclesScreen() {
  const { state, dispatch } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [notificationCount] = useState(3);

  const categories = ['All', 'University', 'Hospital'];

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
      `You'll be joining ${circle.institution} circle with ${circle.memberCount} verified women members.`,
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
      `${circle.institution}\n\n👥 ${circle.memberCount} Members\n🚗 ${circle.ridesPerDay} rides per day\n📍 ${circle.category}\n\n${circle.isJoined ? '✅ You are a member of this circle.' : 'Join this circle to see posts and schedule rides.'}`,
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const joinedCount = state.circles.filter(c => c.isJoined).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Institution Vaults</Text>
          <Text style={styles.headerSubtitle}>
            {joinedCount > 0
              ? `Member of ${joinedCount} circle${joinedCount > 1 ? 's' : ''}`
              : 'Join a circle to get started'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{state.circles.length}</Text>
          <Text style={styles.statLabel}>Circles</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {state.circles.reduce((sum, c) => sum + c.memberCount, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Women</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {state.circles.reduce((sum, c) => sum + c.ridesPerDay, 0)}
          </Text>
          <Text style={styles.statLabel}>Rides Today</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search circles or institutions..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter */}
      <View style={styles.categoryRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              selectedCategory === cat && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Circles grid */}
      <ScrollView
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredCircles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No circles found</Text>
            <Text style={styles.emptyText}>Try a different search term or category</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCircles.map(circle => (
              <View key={circle.id} style={styles.gridItem}>
                <CircleCard
                  circle={circle}
                  onJoin={handleJoin}
                  onView={handleView}
                />
              </View>
            ))}
          </View>
        )}

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.bottomInfoText}>
            All circles require NADRA verification to join
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: Colors.textPrimary,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47.5%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    opacity: 0.7,
  },
  bottomInfoText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
