import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import BiometricScanner from '../components/BiometricScanner';
import {
  verifyWithNADRA,
  sendOTP,
  verifyOTP,
  formatCNIC,
  verifyBiometric,
  verifyFaceGender,
} from '../services/biometricService';
import { useAppStore } from '../store/appStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type VerificationStep = 'cnic' | 'biometric' | 'otp' | 'complete';

export default function BiometricVerificationScreen({ navigation }: Props) {
  const C = useTheme();
  const { state, dispatch } = useAppStore();
  const isMale = state.selectedGender === 'male';

  // Pre-fill CNIC from registration (avoids asking twice)
  const prefillCnic = state.user?.cnic ? formatCNIC(state.user.cnic) : '';

  const [currentStep, setCurrentStep] = useState<VerificationStep>('cnic');
  const [cnic, setCnic] = useState(prefillCnic);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [verifiedName, setVerifiedName] = useState('');
  const [statusMessage, setStatusMessage] = useState('Enter your CNIC number to continue');
  const [otpSent, setOtpSent] = useState(false);

  // Camera permission + ref for face capture
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnim  = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  const STEPS = ['cnic', 'biometric', 'otp', 'complete'];
  const stepIndex = STEPS.indexOf(currentStep);
  const progress  = (stepIndex / (STEPS.length - 1)) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Request camera permission as soon as we hit the biometric step
  useEffect(() => {
    if (currentStep === 'biometric' && !cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [currentStep]);

  const transitionToStep = useCallback(
    (step: VerificationStep) => {
      Animated.timing(stepFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentStep(step);
        Animated.timing(stepFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    },
    [stepFadeAnim]
  );

  // ── Step 1: CNIC ──────────────────────────────────────────────────────────
  // Live NADRA verification is pending regulatory approval.
  // We validate the format, save the number, and proceed to face + OTP.
  const handleCNICVerify = useCallback(() => {
    const digits = cnic.replace(/-/g, '');
    if (digits.length < 13) {
      Alert.alert('Invalid CNIC', 'Please enter a valid 13-digit CNIC in the format XXXXX-XXXXXXX-X');
      return;
    }

    // Save CNIC into store (either update existing user or create shell)
    if (state.user) {
      dispatch({ type: 'UPDATE_USER', payload: { cnic } });
    } else {
      dispatch({
        type: 'SET_USER',
        payload: {
          id: `user_${Date.now()}`,
          name: '',
          cnic,
          phone: '',
          role: 'passenger',
          gender: state.selectedGender,
          isVerified: false,
          biometricVerified: false,
          trustCredits: 5,
          circles: [],
        },
      });
    }

    setStatusMessage('CNIC recorded. Proceeding to biometric verification…');
    setTimeout(() => {
      transitionToStep('biometric');
      setStatusMessage('Place your face in front of the camera');
    }, 600);
  }, [cnic, state.user, dispatch, transitionToStep]);

  // ── Step 2: Face scan — 3 stages ─────────────────────────────────────────
  //   Stage A: Capture photo from CameraView
  //   Stage B: Face++ API — detect face + confirm gender is Female
  //   Stage C: expo-local-authentication — device Face ID / fingerprint
  const handleBiometricVerify = useCallback(async () => {
    setScanStatus('scanning');

    try {
      // ── Stage A: Capture a frame ────────────────────────────────────────
      setStatusMessage('Capturing your face…');
      let base64Image = '';

      if (cameraRef.current && cameraPermission?.granted) {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
        base64Image = photo?.base64 ?? '';
      }

      // ── Stage B: Face++ gender check ────────────────────────────────────
      if (base64Image) {
        setStatusMessage('Checking face… Please stay still');
        const faceResult = await verifyFaceGender(base64Image);

        if (!faceResult.detected) {
          setScanStatus('failed');
          setStatusMessage(faceResult.error);
          Alert.alert('Face Verification Failed', faceResult.error);
          setTimeout(() => setScanStatus('idle'), 2500);
          return;
        } else if (isMale && faceResult.gender === 'Female') {
          setScanStatus('failed');
          const msg = 'This section is for male users only. A female face was detected. Please use the Female section.';
          setStatusMessage(msg);
          Alert.alert('Access Denied', msg);
          setTimeout(() => setScanStatus('idle'), 3000);
          return;
        } else if (!isMale && faceResult.gender === 'Male') {
          setScanStatus('failed');
          const msg = 'Safe-Sawar\'s female section is exclusively for women. A male face was detected.';
          setStatusMessage(msg);
          Alert.alert('Access Denied', msg);
          setTimeout(() => setScanStatus('idle'), 3000);
          return;
        }
        // Gender matched ✓ — continue
      }

      // ── Stage C: Device biometric (Face ID / fingerprint) ───────────────
      setStatusMessage('Complete Face ID or fingerprint to confirm…');
      const bioResult = await verifyBiometric();

      if (bioResult.success) {
        setScanStatus('verified');
        setStatusMessage('Biometric Verified ✓');
        dispatch({ type: 'SET_VERIFIED', payload: true });
        setTimeout(() => {
          transitionToStep('otp');
          setStatusMessage('Enter your phone number for OTP verification');
        }, 1500);
      } else {
        setScanStatus('failed');
        setStatusMessage(bioResult.error || 'Verification failed. Try again.');
        Alert.alert('Biometric Failed', bioResult.error || 'Please try again.');
        setTimeout(() => setScanStatus('idle'), 2500);
      }
    } catch (err) {
      setScanStatus('failed');
      setStatusMessage('Unexpected error. Please try again.');
      setTimeout(() => setScanStatus('idle'), 2500);
    }
  }, [dispatch, transitionToStep, cameraPermission]);

  // ── Step 3: Phone OTP ────────────────────────────────────────────────────
  const handleSendOTP = useCallback(async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.replace(/\s/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid Pakistani phone number (+92 or 03…)');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Sending OTP…');
    const result = await sendOTP(trimmed);
    setIsLoading(false);
    if (result.success) {
      setOtpSent(true);
      setStatusMessage(result.message);
    } else {
      setStatusMessage(result.message);
      Alert.alert('Failed to Send OTP', result.message);
    }
  }, [phone]);

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your number.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Verifying OTP…');
    const result = await verifyOTP(phone.trim(), otp);
    setIsLoading(false);
    if (result.success) {
      dispatch({ type: 'UPDATE_USER', payload: { phone: phone.trim(), isVerified: true, biometricVerified: true } });
      // Save credentials so Login screen can restore role without asking again
      await AsyncStorage.setItem('registered_credentials', JSON.stringify({
        phone: phone.trim(),
        role: state.user?.role ?? 'passenger',
        name: state.user?.name ?? '',
        gender: state.selectedGender,
      })).catch(() => {});
      transitionToStep('complete');
      setStatusMessage("Registration complete! Please sign in to continue.");
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        dispatch({ type: 'LOGOUT' });
        navigation.replace('Login');
      }, 2500);
    } else {
      setStatusMessage(result.message);
      Alert.alert('Invalid OTP', result.message);
    }
  }, [otp, phone, navigation, transitionToStep, successAnim]);

  // ── Derived values ────────────────────────────────────────────────────────
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  const cameraGranted = cameraPermission?.granted ?? false;
  const stepLabels = ['CNIC', 'Face Scan', 'Phone OTP', 'Done'];
  const stepIcons  = ['card-outline', 'scan-outline', 'phone-portrait-outline', 'checkmark-circle-outline'];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={styles.headerSubtitle}>Powered by NADRA / Nishan Pakistan</Text>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsContainer}>
          {stepLabels.map((label, i) => (
            <View key={i} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  i < stepIndex  ? styles.stepCompleted :
                  i === stepIndex ? styles.stepActive    :
                                    styles.stepPending,
                ]}
              >
                {i < stepIndex ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Ionicons
                    name={stepIcons[i] as any}
                    size={12}
                    color={i === stepIndex ? '#fff' : Colors.textMuted}
                  />
                )}
              </View>
              <Text style={[styles.stepLabel, i === stepIndex ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {label}
              </Text>
              {i < stepLabels.length - 1 && (
                <View style={[styles.stepLine, i < stepIndex && styles.stepLineCompleted]} />
              )}
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: C.cardBackground, borderColor: C.border }]}>
          <View style={[styles.nadraLogo, { backgroundColor: C.primaryGlow }]}>
            <Text style={styles.nadraLogoText}>🏛️</Text>
          </View>
          <Text style={styles.statusText}>{statusMessage}</Text>
          {isLoading && <ActivityIndicator size="small" color={C.primary} />}
        </View>

        {/* Step content */}
        <Animated.View style={[styles.stepContent, { opacity: stepFadeAnim }]}>

          {/* ── STEP 1: CNIC ──────────────────────────────────────────────── */}
          {currentStep === 'cnic' && (
            <View style={[styles.stepPanel, { backgroundColor: C.cardBackground, borderColor: C.border }]}>
              <Text style={styles.stepTitle}>Enter Your CNIC</Text>
              <Text style={styles.stepDescription}>
                Your 13-digit National Identity Card number is required to join Safe-Sawar.
              </Text>

              {/* Pending approval badge */}
              <View style={styles.pendingBadge}>
                <View style={styles.pendingIconWrap}>
                  <Ionicons name="time-outline" size={20} color={Colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>NADRA Verification — Coming Soon</Text>
                  <Text style={styles.pendingDesc}>
                    Live CNIC lookup is pending regulatory approval from NADRA.
                    Your CNIC number will be verified automatically once enabled.
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="35202-1234567-8"
                  placeholderTextColor={Colors.textMuted}
                  value={cnic}
                  onChangeText={(text) => setCnic(formatCNIC(text))}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="lock-closed" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Your CNIC is encrypted end-to-end and never stored in plain text.
                  It will be cross-checked against NADRA once the API is activated.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: C.primary, shadowColor: C.primary }]}
                onPress={handleCNICVerify}
              >
                <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Continue to Face Scan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Face scan ─────────────────────────────────────────── */}
          {currentStep === 'biometric' && (
            <View style={[styles.stepPanel, { backgroundColor: C.cardBackground, borderColor: C.border }]}>
              <Text style={styles.stepTitle}>Face Scan</Text>
              {verifiedName ? (
                <Text style={styles.verifiedNameText}>Welcome, {verifiedName}</Text>
              ) : null}
              <Text style={styles.stepDescription}>
                {cameraGranted
                  ? `Look directly at the camera. Only ${isMale ? 'male' : 'female'} faces are accepted. Tap "Start Face Scan" when ready.`
                  : 'Camera permission is required for face verification.'}
              </Text>

              {/* Camera denied — show permission prompt */}
              {!cameraGranted && cameraPermission?.canAskAgain === false && (
                <View style={styles.infoBox}>
                  <Ionicons name="warning" size={16} color={Colors.error} />
                  <Text style={[styles.infoText, { color: Colors.error }]}>
                    Camera access was denied. Enable it in device Settings → Apps → Safe-Sawar → Permissions.
                  </Text>
                </View>
              )}

              <View style={styles.scannerContainer}>
                <BiometricScanner
                  ref={cameraRef}
                  status={scanStatus}
                  cameraPermissionGranted={cameraGranted}
                  size={200}
                />
              </View>

              {scanStatus === 'verified' ? (
                <View style={styles.verifiedBanner}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.verified} />
                  <Text style={styles.verifiedText}>Biometric Verified</Text>
                </View>
              ) : (
                <>
                  {/* Allow re-requesting permission */}
                  {!cameraGranted && cameraPermission?.canAskAgain && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { marginBottom: 10 }]}
                      onPress={requestCameraPermission}
                    >
                      <Ionicons name="camera" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.primaryButton, scanStatus === 'scanning' && styles.buttonDisabled]}
                    onPress={handleBiometricVerify}
                    disabled={scanStatus === 'scanning'}
                  >
                    {scanStatus === 'scanning' ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.primaryButtonText}>Scanning…</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="scan" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>Start Face Scan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── STEP 3: Phone OTP ─────────────────────────────────────────── */}
          {currentStep === 'otp' && (
            <View style={[styles.stepPanel, { backgroundColor: C.cardBackground, borderColor: C.border }]}>
              <Text style={styles.stepTitle}>Phone Verification</Text>
              <Text style={styles.stepDescription}>
                Enter your Pakistani mobile number to receive a verification code via SMS.
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+92 300 1234567"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!otpSent && !isLoading}
                />
              </View>

              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#fff" />
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.otpInfoBox}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                    <Text style={styles.otpSentText}>OTP sent to {phone}. Check your SMS.</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit OTP"
                      placeholderTextColor={Colors.textMuted}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>Verify OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={() => { setOtpSent(false); setOtp(''); }}
                  >
                    <Text style={styles.resendText}>Change number or resend</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── STEP 4: Complete ──────────────────────────────────────────── */}
          {currentStep === 'complete' && (
            <Animated.View
              style={[
                styles.stepPanel,
                styles.completePanel,
                { transform: [{ scale: successAnim }], opacity: successAnim },
              ]}
            >
              <View style={styles.successCircle}>
                <Ionicons name="checkmark-circle" size={72} color={Colors.verified} />
              </View>
              <Text style={styles.completeTitle}>Verified!</Text>
              <Text style={styles.completeSubtitle}>Registration Complete</Text>
              <Text style={styles.completeMessage}>
                Your identity has been verified. Redirecting you to sign in…
              </Text>
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
            </Animated.View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCompleted: { backgroundColor: Colors.verified },
  stepActive:    { backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.primaryLight },
  stepPending:   { backgroundColor: Colors.surfaceBackground, borderWidth: 1, borderColor: Colors.border },
  stepLabel:     { fontSize: 9, textAlign: 'center' },
  stepLabelActive:   { color: Colors.primary, fontWeight: '700' },
  stepLabelInactive: { color: Colors.textMuted },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 1.5,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  stepLineCompleted: { backgroundColor: Colors.verified },
  progressBarContainer: {
    height: 3,
    backgroundColor: Colors.surfaceBackground,
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nadraLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nadraLogoText: { fontSize: 16 },
  statusText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  stepContent: { paddingHorizontal: 24 },
  stepPanel: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  verifiedNameText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scannerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.verifiedLight,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.verified + '50',
  },
  verifiedText: {
    color: Colors.verified,
    fontSize: 16,
    fontWeight: '800',
  },
  otpInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.verifiedLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  otpSentText: {
    color: Colors.verified,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warning + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    color: Colors.warning,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  pendingDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  completePanel: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: { marginBottom: 16 },
  completeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.verified,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 12,
  },
  completeMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
  },
});
