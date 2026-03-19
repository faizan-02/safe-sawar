import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getNearbyDeviceCount } from '../services/meshNetworkService';

interface MeshNetworkStatusProps {
  compact?: boolean;
  showLabel?: boolean;
}

export default function MeshNetworkStatus({
  compact = false,
  showLabel = true,
}: MeshNetworkStatusProps) {
  const [deviceCount, setDeviceCount] = useState(getNearbyDeviceCount());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([
    new Animated.Value(0.4),
    new Animated.Value(0.4),
    new Animated.Value(0.4),
  ]).current;

  useEffect(() => {
    // Pulse the main indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Animate connection dots
    const dotAnimations = dotAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 250),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    );
    dotAnimations.forEach(a => a.start());

    // Update device count periodically
    const interval = setInterval(() => {
      setDeviceCount(getNearbyDeviceCount());
    }, 5000);

    return () => {
      pulse.stop();
      dotAnimations.forEach(a => a.stop());
      clearInterval(interval);
    };
  }, []);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View
          style={[
            styles.compactDot,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <Text style={styles.compactText}>
          Mesh: {deviceCount} device{deviceCount !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* Central node */}
        <View style={styles.nodeContainer}>
          <Animated.View
            style={[
              styles.nodeOuter,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.nodeInner} />
        </View>

        {/* Connection lines and dots */}
        <View style={styles.connectionsContainer}>
          {dotAnims.map((anim, i) => (
            <View key={i} style={styles.connectionRow}>
              <Animated.View
                style={[
                  styles.connectionLine,
                  { opacity: anim },
                ]}
              />
              <Animated.View
                style={[
                  styles.remoteDot,
                  { opacity: anim },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {showLabel && (
        <View style={styles.textSection}>
          <Text style={styles.meshTitle}>Mesh Network Active</Text>
          <Text style={styles.meshSubtitle}>
            {deviceCount} nearby Safe-Sawar device{deviceCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.meshNote}>Offline SOS protection enabled</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  nodeContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeOuter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 200, 83, 0.3)',
  },
  nodeInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.verified,
  },
  connectionsContainer: {
    marginLeft: 4,
    gap: 4,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionLine: {
    width: 16,
    height: 1.5,
    backgroundColor: Colors.verified,
    marginRight: 3,
  },
  remoteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.verified,
  },
  textSection: {
    flex: 1,
  },
  meshTitle: {
    color: Colors.verified,
    fontSize: 13,
    fontWeight: '700',
  },
  meshSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  meshNote: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.verified,
  },
  compactText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '600',
  },
});
