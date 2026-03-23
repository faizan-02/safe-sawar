import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { sendOTP, verifyOTP } from '../services/biometricService';
import { useAppStore } from '../store/appStore';

type Props = { navigation: NativeStackNavigationProp<any> };
type LoginStep = 'phone' | 'otp';

export default function LoginScreen({ navigation }: Props) {
  const { dispatch } = useAppStore();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredCreds, setRegisteredCreds] = useState<{
    role: 'passenger' | 'carpooler'; name: string;
  } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('registered_credentials').then(raw => {
      if (raw) setRegisteredCreds(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const handleSendOTP = useCallback(async () => {
    const trimmed = phone.trim();
    if (trimmed.replace(/\s/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Enter a valid Pakistani number (+92 or 03…)');
      return;
    }
    setIsLoading(true);
    const result = await sendOTP(trimmed);
    setIsLoading(false);
    if (result.success) {
      setStep('otp');
    } else {
      Alert.alert('Failed', result.message);
    }
  }, [phone]);

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code sent to your number.');
      return;
    }
    setIsLoading(true);
    const result = await verifyOTP(phone.trim(), otp);
    setIsLoading(false);
    if (result.success) {
      dispatch({
        type: 'SET_USER',
        payload: {
          id: `user_${Date.now()}`,
          name: registeredCreds?.name ?? '',
          cnic: '',
          phone: phone.trim(),
          role: registeredCreds?.role ?? 'passenger',
          isVerified: true,
          biometricVerified: false,
          trustCredits: 5,
          circles: [],
        },
      });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      Alert.alert('Invalid OTP', result.message);
    }
  }, [otp, phone, registeredCreds, dispatch, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🛡️</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Safe-Sawar account</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.cardTitle}>Enter Your Phone Number</Text>
              <Text style={styles.cardDesc}>
                We'll send a 6-digit verification code to confirm it's you.
              </Text>

              {/* Detected role from registration */}
              {registeredCreds ? (
                <View style={styles.roleDetected}>
                  <Ionicons
                    name={registeredCreds.role === 'carpooler' ? 'car' : 'person'}
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.roleDetectedText}>
                    Signing in as{' '}
                    <Text style={{ fontWeight: '800' }}>
                      {registeredCreds.role === 'carpooler' ? 'Carpooler' : 'Passenger'}
                    </Text>
                    {registeredCreds.name ? ` · ${registeredCreds.name}` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.roleDetected}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                  <Text style={[styles.roleDetectedText, { color: Colors.textMuted }]}>
                    No registration found on this device.{' '}
                    <Text
                      style={{ color: Colors.primary, fontWeight: '700' }}
                      onPress={() => navigation.navigate('Auth')}
                    >
                      Create account
                    </Text>
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+92 300 1234567"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, isLoading && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={Colors.textPrimary} />
                    <Text style={styles.btnText}>Send OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Enter Verification Code</Text>
              <View style={styles.otpSentBanner}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                <Text style={styles.otpSentText}>Code sent to {phone}</Text>
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="keypad-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, isLoading && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} />
                    <Text style={styles.btnText}>Verify & Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.changeBtn} onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.changeBtnText}>Change number or resend</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Register link */}
        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.registerLinkText}>New to Safe-Sawar? </Text>
          <Text style={[styles.registerLinkText, { color: Colors.primary, fontWeight: '700' }]}>Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute', top: 52, left: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  header: { alignItems: 'center', paddingTop: 100, marginBottom: 28 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: Colors.borderStrong,
    elevation: 12, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14,
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 20 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  roleDetected: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  roleDetectedText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 16, paddingVertical: 14 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, gap: 8,
    elevation: 6, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },

  otpSentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.verifiedLight, borderRadius: 8, padding: 10, marginBottom: 16,
  },
  otpSentText: { color: Colors.verified, fontSize: 12, fontWeight: '600', flex: 1 },

  changeBtn: { alignItems: 'center', marginTop: 14 },
  changeBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

  registerLink: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  registerLinkText: { color: Colors.textMuted, fontSize: 14 },
});
