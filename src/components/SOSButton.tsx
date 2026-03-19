import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { sendSOS } from '../services/meshNetworkService';
import { useAppStore } from '../store/appStore';

interface SOSButtonProps {
  large?: boolean;
  location?: { lat: number; lng: number } | null;
}

type SOSState = 'idle' | 'confirming' | 'sending' | 'active' | 'success';

export default function SOSButton({ large = false, location = null }: SOSButtonProps) {
  const { state, dispatch } = useAppStore();
  const [sosState, setSosState] = useState<SOSState>(state.sosActive ? 'active' : 'idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [sosResult, setSosResult] = useState<string>('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Start pulsing when active
  useEffect(() => {
    if (sosState === 'active' || sosState === 'sending') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      glow.start();
      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [sosState]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSOSPress = useCallback(async () => {
    if (sosState === 'active') {
      // Deactivate SOS
      Alert.alert(
        'Deactivate SOS?',
        'Are you safe? Deactivating will stop all emergency alerts.',
        [
          { text: 'Keep Active', style: 'cancel' },
          {
            text: "I'm Safe",
            style: 'destructive',
            onPress: () => {
              setSosState('idle');
              dispatch({ type: 'DEACTIVATE_SOS' });
            },
          },
        ]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    triggerShake();
    setModalVisible(true);
    setSosState('confirming');
  }, [sosState, dispatch, triggerShake]);

  const confirmSOS = useCallback(async () => {
    setModalVisible(false);
    setSosState('sending');

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    dispatch({ type: 'ACTIVATE_SOS' });

    const emergencyContacts = ['+92 300 1234567', '+92 321 9876543'];
    const result = await sendSOS(
      state.user?.name || 'Safe-Sawar User',
      location,
      emergencyContacts
    );

    setSosResult(result.message);
    setSosState('active');

    Alert.alert(
      result.method === 'mesh' ? '🔗 SOS via Mesh Network' : '📡 SOS Sent',
      result.message,
      [{ text: 'OK' }]
    );
  }, [dispatch, location, state.user]);

  const cancelSOS = useCallback(() => {
    setModalVisible(false);
    setSosState('idle');
  }, []);

  const buttonSize = large ? 80 : 56;
  const fontSize = large ? 11 : 9;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <>
      <Animated.View
        style={[
          styles.outerContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Glow ring */}
        {(sosState === 'active' || sosState === 'sending') && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: buttonSize + 24,
                height: buttonSize + 24,
                borderRadius: (buttonSize + 24) / 2,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Main button */}
        <Animated.View
          style={[
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sosButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor:
                  sosState === 'active'
                    ? Colors.sosRed
                    : sosState === 'sending'
                    ? '#FF6B35'
                    : Colors.secondaryDark,
              },
              large && styles.largeShadow,
            ]}
            onPress={handleSOSPress}
            activeOpacity={0.8}
          >
            {sosState === 'sending' ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <Ionicons
                name={sosState === 'active' ? 'alert-circle' : 'warning'}
                size={large ? 28 : 22}
                color={Colors.textPrimary}
              />
            )}
            <Text style={[styles.sosLabel, { fontSize }]}>
              {sosState === 'active'
                ? 'SOS ACTIVE'
                : sosState === 'sending'
                ? 'SENDING...'
                : 'Emergency\nSOS'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Confirmation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelSOS}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning" size={40} color={Colors.sosRed} />
            </View>
            <Text style={styles.modalTitle}>Emergency SOS</Text>
            <Text style={styles.modalMessage}>
              This will immediately alert your emergency contacts and local authorities
              with your current location.
            </Text>
            <Text style={styles.modalNote}>
              If no internet is available, SOS will be sent via mesh network through
              nearby Safe-Sawar devices.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelSOS}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmSOS}
              >
                <Ionicons name="warning" size={16} color={Colors.textPrimary} />
                <Text style={styles.confirmText}>Send SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: Colors.sosRedGlow,
  },
  sosButton: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    gap: 2,
  },
  largeShadow: {
    elevation: 12,
    shadowOpacity: 0.7,
    shadowRadius: 16,
  },
  sosLabel: {
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.sosRed,
    width: '100%',
    maxWidth: 340,
  },
  modalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.sosRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
