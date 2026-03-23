import React, { useEffect, useRef, forwardRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { Colors } from '../theme/colors';

interface BiometricScannerProps {
  status: 'idle' | 'scanning' | 'verified' | 'failed';
  /** Camera permission has been granted — enables live camera feed */
  cameraPermissionGranted?: boolean;
  size?: number;
}

/**
 * Wrap with forwardRef so the parent screen can call
 * ref.current.takePictureAsync() to capture a frame for Face++ analysis.
 */
const BiometricScanner = forwardRef<CameraView, BiometricScannerProps>(function BiometricScanner({
  status,
  cameraPermissionGranted = false,
  size = 160,
}, cameraRef) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // ── Animations ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'scanning') {
      const scan = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      );
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
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
    } else {
      // Reset fade when going back to idle / failed
      fadeAnim.setValue(0);
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

  const getStatusColor = () => {
    switch (status) {
      case 'scanning': return Colors.primary;
      case 'verified': return Colors.verified;
      case 'failed':   return Colors.error;
      default:         return Colors.textMuted;
    }
  };
  const statusColor = getStatusColor();

  // ── Whether to show the live camera ──────────────────────────────────────
  const showCamera =
    cameraPermissionGranted && (status === 'idle' || status === 'scanning');

  return (
    <View style={[styles.container, { width: size, height: size }]}>

      {/* ── Rotating outer ring (scanning only) ─────────────────────────── */}
      {status === 'scanning' && (
        <Animated.View
          style={[
            styles.rotatingRing,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              borderColor: Colors.primary,
              transform: [{ rotate: rotateInterp }],
            },
          ]}
        />
      )}

      {/* ── Pulsing background ───────────────────────────────────────────── */}
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

      {/* ── Main face frame ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.faceFrame,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: size * 0.15,
            borderColor: statusColor,
            borderWidth: status === 'verified' ? 3 : 2,
          },
        ]}
      >
        {/* Live camera feed (front camera) — ref exposed for photo capture */}
        {showCamera && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
          />
        )}

        {/* Content overlay on top of camera (or standalone when no camera) */}
        <View style={[styles.overlay, { backgroundColor: showCamera ? 'transparent' : statusColor + '10' }]}>

          {/* Idle — no camera permission yet */}
          {status === 'idle' && !cameraPermissionGranted && (
            <Ionicons name="scan" size={size * 0.35} color={Colors.textMuted} />
          )}

          {/* Scanning — face outline + scan line */}
          {status === 'scanning' && (
            <>
              {!cameraPermissionGranted && (
                <View style={styles.faceOutline}>
                  <View style={[styles.faceLine, { width: '60%', top: '30%' }]} />
                  <View style={[styles.faceLine, { width: '40%', top: '50%' }]} />
                  <View style={[styles.faceLine, { width: '50%', top: '65%' }]} />
                  <View style={[styles.eyeDot, { left: '30%', top: '38%' }]} />
                  <View style={[styles.eyeDot, { right: '30%', top: '38%' }]} />
                </View>
              )}
              {/* Scan line always shown while scanning */}
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

          {/* Verified */}
          {status === 'verified' && (
            <Animated.View
              style={[styles.verifiedIcon, { transform: [{ scale: fadeAnim }], opacity: fadeAnim }]}
            >
              <View style={[styles.verifiedCircle, { backgroundColor: Colors.verified + '20' }]}>
                <Ionicons name="checkmark-circle" size={size * 0.4} color={Colors.verified} />
              </View>
            </Animated.View>
          )}

          {/* Failed */}
          {status === 'failed' && (
            <View style={styles.failedOverlay}>
              <Ionicons name="close-circle" size={size * 0.4} color={Colors.error} />
              <Text style={[styles.failedText, { fontSize: size * 0.08 }]}>Try Again</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Corner scan markers ──────────────────────────────────────────── */}
      {status === 'scanning' && (
        <>
          <View style={[styles.cornerMark, styles.topLeft,    { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.topRight,   { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.bottomLeft, { borderColor: Colors.primary }]} />
          <View style={[styles.cornerMark, styles.bottomRight,{ borderColor: Colors.primary }]} />
        </>
      )}
    </View>
  );
});

export default BiometricScanner;

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
  faceFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.85,
  },
  verifiedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCircle: {
    borderRadius: 100,
    padding: 8,
  },
  failedOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error + '15',
    ...StyleSheet.absoluteFillObject,
  },
  failedText: {
    color: Colors.error,
    fontWeight: '700',
  },
  cornerMark: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 2.5,
  },
  topLeft:     { top: 8,    left: 8,  borderRightWidth: 0,  borderBottomWidth: 0, borderTopLeftRadius: 4 },
  topRight:    { top: 8,    right: 8, borderLeftWidth: 0,   borderBottomWidth: 0, borderTopRightRadius: 4 },
  bottomLeft:  { bottom: 8, left: 8,  borderRightWidth: 0,  borderTopWidth: 0,    borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 8, right: 8, borderLeftWidth: 0,   borderTopWidth: 0,    borderBottomRightRadius: 4 },
});
