import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface BiometricScannerProps {
  status: 'idle' | 'scanning' | 'verified' | 'failed';
  size?: number;
}

export default function BiometricScanner({ status, size = 160 }: BiometricScannerProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  };

  useEffect(() => {
    if (status === 'scanning') {
      // Scanning animation: scan line moves
      const scan = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );

      // Pulsing ring
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotating outer ring
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      scan.start();
      pulse.start();
      rotate.start();

      return () => {
        scan.stop();
        pulse.stop();
        rotate.stop();
      };
    } else if (status === 'verified') {
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const scanLineTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-size / 2, size / 2],
  });

  const rotateInterp = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cx = size / 2;
  const cy = size / 2;

  const getStatusColor = () => {
    switch (status) {
      case 'scanning': return Colors.primary;
      case 'verified': return Colors.verified;
      case 'failed': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Rotating outer hexagon ring */}
      {status === 'scanning' && (
        <Animated.View
          style={[
            styles.rotatingRing,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              transform: [{ rotate: rotateInterp }],
              borderColor: Colors.primary,
            },
          ]}
        />
      )}

      {/* Pulsing background */}
      <Animated.View
        style={[
          styles.pulseBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: statusColor + '15',
            transform: [{ scale: status === 'scanning' ? pulseAnim : 1 }],
          },
        ]}
      />

      {/* Main hexagon shape (simulated with bordered circle) */}
      <View
        style={[
          styles.hexagonContainer,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: size * 0.15,
            borderColor: statusColor,
            borderWidth: status === 'verified' ? 3 : 2,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Inner face area */}
        <View style={[styles.faceArea, { backgroundColor: statusColor + '10' }]}>
          {status === 'idle' && (
            <Ionicons name="scan" size={size * 0.35} color={Colors.textMuted} />
          )}

          {status === 'scanning' && (
            <>
              {/* Face outline lines */}
              <View style={styles.faceOutline}>
                {/* Face shape lines */}
                <View style={[styles.faceLine, { width: '60%', top: '30%' }]} />
                <View style={[styles.faceLine, { width: '40%', top: '50%' }]} />
                <View style={[styles.faceLine, { width: '50%', top: '65%' }]} />
                {/* Eye dots */}
                <View style={[styles.eyeDot, { left: '30%', top: '38%' }]} />
                <View style={[styles.eyeDot, { right: '30%', top: '38%' }]} />
              </View>

              {/* Animated scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: Colors.primary,
                    transform: [{ translateY: scanLineTranslate }],
                  },
                ]}
              />
            </>
          )}

          {status === 'verified' && (
            <Animated.View
              style={[
                styles.verifiedIcon,
                { transform: [{ scale: fadeAnim }], opacity: fadeAnim },
              ]}
            >
              <View style={[styles.verifiedCircle, { backgroundColor: Colors.verified + '20' }]}>
                <Ionicons name="checkmark-circle" size={size * 0.4} color={Colors.verified} />
              </View>
            </Animated.View>
          )}

          {status === 'failed' && (
            <Ionicons name="close-circle" size={size * 0.4} color={Colors.error} />
          )}
        </View>
      </View>

      {/* Corner scan markers */}
      {status === 'scanning' && (
        <>
          <View style={[styles.cornerMark, styles.topLeft, { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.topRight, { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.bottomLeft, { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.bottomRight, { borderColor: Colors.primary }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rotatingRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pulseBackground: {
    position: 'absolute',
  },
  hexagonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  faceOutline: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  faceLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: Colors.primary,
    opacity: 0.6,
    left: '20%',
  },
  eyeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  },
  verifiedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCircle: {
    borderRadius: 100,
    padding: 8,
  },
  // Corner markers
  cornerMark: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 2.5,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
});
