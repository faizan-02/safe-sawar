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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import BiometricScanner from '../components/BiometricScanner';
import {
  verifyWithNADRA,
  sendOTP,
  verifyOTP,
  formatCNIC,
  verifyBiometric,
} from '../services/biometricService';
import { useAppStore } from '../store/appStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type VerificationStep = 'cnic' | 'biometric' | 'otp' | 'complete';

export default function BiometricVerificationScreen({ navigation }: Props) {
  const { dispatch } = useAppStore();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('cnic');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [verifiedName, setVerifiedName] = useState('');
  const [statusMessage, setStatusMessage] = useState('Enter your CNIC to begin verification');
  const [otpSent, setOtpSent] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  const STEPS = ['cnic', 'biometric', 'otp', 'complete'];
  const stepIndex = STEPS.indexOf(currentStep);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const transitionToStep = useCallback((step: VerificationStep) => {
    Animated.timing(stepFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(step);
      Animated.timing(stepFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [stepFadeAnim]);

  const handleCNICVerify = useCallback(async () => {
    if (cnic.replace(/-/g, '').length < 13) {
      Alert.alert('Invalid CNIC', 'Please enter a valid CNIC in format XXXXX-XXXXXXX-X');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Connecting to Nishan Pakistan (NADRA)...');
    try {
      const result = await verifyWithNADRA(cnic);
      if (result.verified) {
        setVerifiedName(result.name);
        setStatusMessage(`Identity confirmed: ${result.name}`);
        dispatch({
          type: 'SET_USER',
          payload: {
            id: `user_${Date.now()}`,
            name: result.name,
            cnic: result.cnic,
            phone: '',
            isVerified: false,
            biometricVerified: false,
            trustCredits: 5,
            circles: [],
            photo: result.photo,
          },
        });
        setTimeout(() => {
          transitionToStep('biometric');
          setStatusMessage('Place your face in front of the camera');
        }, 800);
      } else {
        setStatusMessage(result.error || 'Verification failed. Please try again.');
        Alert.alert('Verification Failed', result.error || 'CNIC not found. Please retry.');
      }
    } catch {
      setStatusMessage('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [cnic, dispatch, transitionToStep]);

  const handleBiometricVerify = useCallback(async () => {
    setScanStatus('scanning');
    setStatusMessage('Scanning... Keep your face steady');
    try {
      const result = await verifyBiometric();
      if (result.success) {
        setScanStatus('verified');
        setStatusMessage('Biometric Verified ✓');
        dispatch({ type: 'SET_VERIFIED', payload: true });
        setTimeout(() => {
          transitionToStep('otp');
          setStatusMessage('Enter your phone number for OTP verification');
        }, 1500);
      } else {
        setScanStatus('failed');
        setStatusMessage('Verification failed. Try again.');
        setTimeout(() => setScanStatus('idle'), 2000);
      }
    } catch {
      setScanStatus('failed');
      setTimeout(() => setScanStatus('idle'), 2000);
    }
  }, [dispatch, transitionToStep]);

  const handleSendOTP = useCallback(async () => {
    if (!phone || phone.replace(/\s/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid Pakistani phone number');
      return;
    }
    setIsLoading(true);
    const result = await sendOTP(phone);
    setIsLoading(false);
    if (result.success) {
      setOtpSent(true);
      setStatusMessage(result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  }, [phone]);

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }
    setIsLoading(true);
    const result = await verifyOTP(otp);
    setIsLoading(false);
    if (result.success) {
      transitionToStep('complete');
      setStatusMessage("You're all set!");
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        navigation.replace('MainTabs');
      }, 2000);
    } else {
      Alert.alert('Invalid OTP', result.message);
    }
  }, [otp, navigation, transitionToStep, successAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const stepLabels = ['CNIC', 'Face Scan', 'Phone OTP', 'Done'];
  const stepIcons = ['card-outline', 'scan-outline', 'phone-portrait-outline', 'checkmark-circle-outline'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
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

        {/* Step indicator */}
        <View style={styles.stepsContainer}>
          {stepLabels.map((label, i) => (
            <View key={i} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  i < stepIndex
                    ? styles.stepCompleted
                    : i === stepIndex
                    ? styles.stepActive
                    : styles.stepPending,
                ]}
              >
                {i < stepIndex ? (
                  <Ionicons name="checkmark" size={12} color={Colors.textPrimary} />
                ) : (
                  <Ionicons
                    name={stepIcons[i] as any}
                    size={12}
                    color={i === stepIndex ? Colors.textPrimary : Colors.textMuted}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  i === stepIndex ? styles.stepLabelActive : styles.stepLabelInactive,
                ]}
              >
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

        {/* Status message */}
        <View style={styles.statusBanner}>
          <View style={styles.nadraLogo}>
            <Text style={styles.nadraLogoText}>🏛️</Text>
          </View>
          <Text style={styles.statusText}>{statusMessage}</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Step content */}
        <Animated.View style={[styles.stepContent, { opacity: stepFadeAnim }]}>

          {/* STEP 1: CNIC */}
          {currentStep === 'cnic' && (
            <View style={styles.stepPanel}>
              <Text style={styles.stepTitle}>Enter Your CNIC</Text>
              <Text style={styles.stepDescription}>
                Your CNIC will be verified against the NADRA database to confirm your identity.
              </Text>

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
                  editable={!isLoading}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Your CNIC is encrypted and only used for one-time verification. We never store your full CNIC.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleCNICVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={Colors.textPrimary} />
                    <Text style={styles.primaryButtonText}>Verify with NADRA</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Biometric */}
          {currentStep === 'biometric' && (
            <View style={styles.stepPanel}>
              <Text style={styles.stepTitle}>Face Scan</Text>
              {verifiedName ? (
                <Text style={styles.verifiedNameText}>Welcome, {verifiedName}</Text>
              ) : null}
              <Text style={styles.stepDescription}>
                Look directly at the camera for biometric verification.
              </Text>

              <View style={styles.scannerContainer}>
                <BiometricScanner status={scanStatus} size={170} />
              </View>

              {scanStatus === 'verified' ? (
                <View style={styles.verifiedBanner}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.verified} />
                  <Text style={styles.verifiedText}>Biometric Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    scanStatus === 'scanning' && styles.buttonDisabled,
                  ]}
                  onPress={handleBiometricVerify}
                  disabled={scanStatus === 'scanning'}
                >
                  {scanStatus === 'scanning' ? (
                    <>
                      <ActivityIndicator color={Colors.textPrimary} size="small" />
                      <Text style={styles.primaryButtonText}>Scanning...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="scan" size={18} color={Colors.textPrimary} />
                      <Text style={styles.primaryButtonText}>Start Face Scan</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* STEP 3: OTP */}
          {currentStep === 'otp' && (
            <View style={styles.stepPanel}>
              <Text style={styles.stepTitle}>Phone Verification</Text>
              <Text style={styles.stepDescription}>
                Enter your Pakistani mobile number to receive a verification code.
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
                    <ActivityIndicator color={Colors.textPrimary} />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color={Colors.textPrimary} />
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.otpInfoBox}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                    <Text style={styles.otpSentText}>OTP sent! Use 123456 for demo.</Text>
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
                      <ActivityIndicator color={Colors.textPrimary} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} />
                        <Text style={styles.primaryButtonText}>Verify OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* STEP 4: Complete */}
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
              <Text style={styles.completeSubtitle}>Welcome to Safe-Sawar</Text>
              <Text style={styles.completeMessage}>
                Your identity has been verified. You can now join circles and book safe rides.
              </Text>
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
            </Animated.View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  stepCompleted: {
    backgroundColor: Colors.verified,
  },
  stepActive: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  stepPending: {
    backgroundColor: Colors.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepLabelInactive: {
    color: Colors.textMuted,
  },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 1.5,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  stepLineCompleted: {
    backgroundColor: Colors.verified,
  },
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
  nadraLogoText: {
    fontSize: 16,
  },
  statusText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  stepContent: {
    paddingHorizontal: 24,
  },
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
  inputIcon: {
    marginRight: 10,
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.textPrimary,
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
  },
  completePanel: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: {
    marginBottom: 16,
  },
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
