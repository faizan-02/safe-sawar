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
import { Circle } from '../store/appStore';

interface CircleCardProps {
  circle: Circle;
  onJoin: (id: string) => void;
  onView: (id: string) => void;
}

export default function CircleCard({ circle, onJoin, onView }: CircleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onView(circle.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{circle.emoji}</Text>
          </View>
          {circle.isJoined && (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          )}
        </View>

        {/* Circle info */}
        <Text style={styles.circleName} numberOfLines={2}>
          {circle.name}
        </Text>
        <Text style={styles.institutionName} numberOfLines={1}>
          {circle.institution}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={11} color={Colors.primary} />
            <Text style={styles.statValue}>{circle.memberCount}</Text>
            <Text style={styles.statLabel}>members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="car" size={11} color={Colors.primary} />
            <Text style={styles.statValue}>{circle.ridesPerDay}</Text>
            <Text style={styles.statLabel}>rides/day</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {circle.isJoined ? (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onView(circle.id)}
            >
              <Text style={styles.viewButtonText}>View Circle</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => onJoin(circle.id)}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.peekButton}
                onPress={() => onView(circle.id)}
              >
                <Text style={styles.peekButtonText}>View</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  touchable: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  emoji: {
    fontSize: 22,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verified,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  joinedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  circleName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 18,
  },
  institutionName: {
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  peekButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  peekButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  viewButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
