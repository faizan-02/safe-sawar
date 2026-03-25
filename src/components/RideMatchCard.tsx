import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { RideMatch } from '../services/rideMatchingService';
import { useAppStore } from '../store/appStore';

interface RideMatchCardProps {
  match: RideMatch;
  onBook: (match: RideMatch) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={10}
          color="#FFB300"
        />
      ))}
      <Text style={{ color: '#FFB300', fontSize: 11, marginLeft: 2, fontWeight: '700' }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export default function RideMatchCard({ match, onBook }: RideMatchCardProps) {
  const { state } = useAppStore();
  const isMale = state.selectedGender === 'male';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,     useNativeDriver: true, speed: 30 }).start();

  // Use first letter of driver name as avatar initial
  const initial = match.driverName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Top accent strip */}
      <View style={styles.accentStrip} />

      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.inner}
      >
        {/* ── Driver row ─────────────────────────────────────────────── */}
        <View style={styles.driverRow}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            {match.isVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={7} color="#fff" />
              </View>
            )}
          </View>

          {/* Name + rating */}
          <View style={styles.driverMeta}>
            <Text style={styles.driverName}>{match.driverName}</Text>
            <StarRating rating={match.rating} />
          </View>

          {/* ETA pill */}
          <View style={styles.etaPill}>
            <Ionicons name="time-outline" size={11} color={Colors.primary} />
            <Text style={styles.etaText}>{match.eta}</Text>
          </View>
        </View>

        {/* ── Circle badge ────────────────────────────────────────────── */}
        <View style={styles.circleBadge}>
          <Ionicons name="shield-checkmark" size={11} color={Colors.verified} />
          <Text style={styles.circleBadgeText}>Verified Circle</Text>
          <Text style={styles.circleNameText}>• {match.circleName}</Text>
        </View>

        {/* ── Car info ─────────────────────────────────────────────────── */}
        <View style={styles.carRow}>
          <View style={styles.carInfo}>
            <Ionicons name="car-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.carText}>{match.car}</Text>
            <View style={styles.carColorDot} />
            <Text style={styles.carColorText}>{match.carColor}</Text>
          </View>
          <View style={styles.platePill}>
            <Text style={styles.plateText}>{match.carPlate}</Text>
          </View>
        </View>

        {/* ── Vouches ──────────────────────────────────────────────────── */}
        <View style={styles.vouchRow}>
          <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.vouchText}>{match.vouchCount} {isMale ? 'men' : 'women'} vouched for {isMale ? 'him' : 'her'}</Text>
        </View>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Footer row ───────────────────────────────────────────────── */}
        <View style={styles.footerRow}>
          <View style={styles.seatsWrap}>
            <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.seatsText}>{match.seatsAvailable} seats left</Text>
          </View>

          <Text style={styles.priceText}>{match.priceEstimate}</Text>

          <TouchableOpacity style={styles.bookBtn} onPress={() => onBook(match)}>
            <Text style={styles.bookBtnText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  accentStrip: {
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
  inner: { padding: 16 },

  // Driver row
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '60',
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  verifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.verified,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBackground,
  },
  driverMeta: { flex: 1, gap: 4 },
  driverName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryGlow, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  etaText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  // Circle badge
  circleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.verifiedLight, alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  circleBadgeText: { color: Colors.verified, fontSize: 11, fontWeight: '700' },
  circleNameText: { color: Colors.verified, fontSize: 11, opacity: 0.85 },

  // Car row
  carRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  carInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  carText: { color: Colors.textSecondary, fontSize: 13 },
  carColorDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  carColorText: { color: Colors.textMuted, fontSize: 12 },
  platePill: {
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  plateText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Vouch
  vouchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  vouchText: { color: Colors.textMuted, fontSize: 12 },

  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },

  // Footer
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seatsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seatsText: { color: Colors.textMuted, fontSize: 12 },
  priceText: { flex: 1, color: Colors.textSecondary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    elevation: 4, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
