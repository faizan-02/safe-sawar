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
      <Text style={{ color: '#FFB300', fontSize: 11, marginLeft: 2 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function RideMatchCard({ match, onBook }: RideMatchCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {/* Avatar + Info */}
        <View style={styles.mainRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{match.driverAvatar}</Text>
            {match.isVerified && (
              <View style={styles.verifiedBadgeSmall}>
                <Ionicons name="checkmark" size={8} color={Colors.textPrimary} />
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{match.driverName}</Text>
              <StarRating rating={match.rating} />
            </View>

            {/* Circle badge */}
            <View style={styles.circleBadge}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.verified} />
              <Text style={styles.circleBadgeText}>Verified Circle</Text>
              <Text style={styles.circleNameText}>{match.circleName}</Text>
            </View>

            {/* Vouch info */}
            <View style={styles.vouchRow}>
              <Ionicons name="people" size={11} color={Colors.textMuted} />
              <Text style={styles.vouchText}>
                Vouched by {match.vouchCount} women
              </Text>
              <View style={styles.dotSeparator} />
              <Ionicons name="car" size={11} color={Colors.textMuted} />
              <Text style={styles.carText}>{match.car} ({match.carColor})</Text>
            </View>
          </View>
        </View>

        {/* Bottom row: ETA + Seats + Book */}
        <View style={styles.bottomRow}>
          <View style={styles.etaContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.etaText}>{match.eta}</Text>
          </View>

          <View style={styles.seatsContainer}>
            <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.seatsText}>{match.seatsAvailable} seats</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{match.priceEstimate}</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => onBook(match)}
          >
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  touchable: {
    padding: 14,
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  avatarEmoji: {
    fontSize: 36,
    lineHeight: 50,
  },
  verifiedBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  circleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verifiedLight,
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  circleBadgeText: {
    color: Colors.verified,
    fontSize: 10,
    fontWeight: '700',
  },
  circleNameText: {
    color: Colors.verified,
    fontSize: 10,
    opacity: 0.8,
  },
  vouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  vouchText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  carText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  etaText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seatsText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'right',
    marginRight: 4,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
});
