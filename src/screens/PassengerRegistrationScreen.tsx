import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Animated, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { formatCNIC } from '../services/biometricService';
import { useAppStore } from '../store/appStore';
import CameraCapture from '../components/CameraCapture';

type Props = { navigation: NativeStackNavigationProp<any> };

type Step = 'personal' | 'circle' | 'consent';

const STEPS: Step[]  = ['personal', 'circle', 'consent'];
const STEP_LABELS     = ['Personal Info', 'Your Circle', 'Consent'];
const STEP_ICONS      = ['person-outline', 'people-outline', 'shield-checkmark-outline'];

export default function PassengerRegistrationScreen({ navigation }: Props) {
  const { state, dispatch } = useAppStore();
  const C = useTheme();
  const isMale = state.selectedGender === 'male';

  const [step, setStep]               = useState<Step>('personal');
  const [name, setName]               = useState('');
  const [cnic, setCnic]               = useState('');
  const [phone, setPhone]             = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [circleDoc, setCircleDoc]     = useState('');
  const [biometricConsent, setBiometricConsent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const stepIndex = STEPS.indexOf(step);

  const transition = useCallback((next: Step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validatePersonal = () => {
    if (!name.trim() || name.trim().length < 3) {
      Alert.alert('Required', 'Please enter your full name (at least 3 characters).'); return false;
    }
    if (cnic.replace(/-/g, '').length < 13) {
      Alert.alert('Invalid CNIC', 'Enter your CNIC in the format XXXXX-XXXXXXX-X.'); return false;
    }
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+92\d{10}$|^03\d{9}$/.test(phoneClean)) {
      Alert.alert('Invalid Phone', 'Enter a valid Pakistani number (+92… or 03…).'); return false;
    }
    return true;
  };

  const validateCircle = () => {
    if (!selectedCircle) {
      Alert.alert('Required', 'Please select your Circle (institution).'); return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 'personal' && validatePersonal()) transition('circle');
    if (step === 'circle'   && validateCircle())   transition('consent');
  };

  const handleSubmit = () => {
    if (!biometricConsent) {
      Alert.alert('Consent Required', 'Please provide biometric consent to continue.'); return;
    }
    dispatch({
      type: 'SET_USER',
      payload: {
        id: `user_${Date.now()}`,
        name: name.trim(),
        cnic,
        phone,
        role: 'passenger',
        gender: state.selectedGender,
        isVerified: false,
        biometricVerified: false,
        trustCredits: 5,
        circles: selectedCircle ? [selectedCircle] : [],
        photo: profilePhoto || undefined,
        circleId: selectedCircle || undefined,
        circleDoc: circleDoc || undefined,
      },
    });
    navigation.navigate('BiometricVerification');
  };

  const circles = state.circles;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.cardBackground, borderColor: C.border }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Passenger Registration</Text>
            <Text style={[styles.headerSub, { color: C.textMuted }]}>Step {stepIndex + 1} of {STEPS.length}</Text>
          </View>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                i < stepIndex  ? [styles.stepDone] :
                i === stepIndex ? [styles.stepActive, { backgroundColor: C.primary }] :
                                  [styles.stepPending, { borderColor: C.border }],
              ]}>
                {i < stepIndex
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Ionicons name={STEP_ICONS[i] as any} size={12}
                      color={i === stepIndex ? '#fff' : C.textMuted} />
                }
              </View>
              <Text style={[
                styles.stepLabel,
                i === stepIndex ? [styles.stepLabelActive, { color: C.primary }] : [styles.stepLabelMuted, { color: C.textMuted }],
              ]}>
                {label}
              </Text>
              {i < STEP_LABELS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: C.border }, i < stepIndex && styles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: C.cardBackground, borderColor: C.border }]}>

          {/* ── Step 1: Personal info ─────────────────────────────────────── */}
          {step === 'personal' && (
            <>
              <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Personal Information</Text>
              <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
                We need your details to create your verified profile.
              </Text>

              {/* Profile photo */}
              <Text style={[styles.fieldLabel, { color: C.textMuted }]}>Profile Photo</Text>
              <View style={styles.photoRow}>
                <CameraCapture
                  label="Take Selfie"
                  icon="person-circle-outline"
                  facing="front"
                  uri={profilePhoto}
                  onCapture={setProfilePhoto}
                />
                <Text style={[styles.photoHint, { color: C.textSecondary }]}>
                  {isMale
                    ? 'Take a clear selfie for your profile. This helps other men recognise you.'
                    : 'Take a clear selfie for your profile. This helps other women recognise you.'}
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: C.textMuted }]}>Full Name *</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.inputBackground, borderColor: C.border }]}>
                <Ionicons name="person-outline" size={18} color={C.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: C.textPrimary }]}
                  placeholder={isMale ? 'e.g. Ahmed Ali' : 'e.g. Ayesha Fatima'}
                  placeholderTextColor={C.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={[styles.fieldLabel, { color: C.textMuted }]}>CNIC Number *</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.inputBackground, borderColor: C.border }]}>
                <Ionicons name="card-outline" size={18} color={C.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: C.textPrimary }]}
                  placeholder="XXXXX-XXXXXXX-X"
                  placeholderTextColor={C.textMuted}
                  value={cnic}
                  onChangeText={v => setCnic(formatCNIC(v))}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: C.textMuted }]}>Phone Number *</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.inputBackground, borderColor: C.border }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={C.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: C.textPrimary }]}
                  placeholder="+92 300 1234567"
                  placeholderTextColor={C.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: C.primary, shadowColor: C.primary }]}
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Circle selection ──────────────────────────────────── */}
          {step === 'circle' && (
            <>
              <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Select Your Circle</Text>
              <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
                Circles are trusted groups from your institution. Pick the one you belong to.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.circleScroll}
              >
                {circles.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.circleChip,
                      { backgroundColor: C.surfaceBackground, borderColor: C.border },
                      selectedCircle === c.id && { borderColor: C.primary, backgroundColor: C.primaryGlow },
                    ]}
                    onPress={() => setSelectedCircle(c.id)}
                  >
                    <Text style={styles.circleEmoji}>{c.emoji}</Text>
                    <Text style={[
                      styles.circleName,
                      { color: C.textSecondary },
                      selectedCircle === c.id && { color: C.primary },
                    ]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.circleCategory, { color: C.textMuted }]}>{c.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedCircle && (
                <View style={styles.selectedCircleBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                  <Text style={styles.selectedCircleText}>
                    {circles.find(c => c.id === selectedCircle)?.institution}
                  </Text>
                </View>
              )}

              {/* Circle verification document */}
              <Text style={[styles.fieldLabel, { marginTop: 20, color: C.textMuted }]}>
                Circle Verification Document
              </Text>
              <Text style={[styles.docHint, { color: C.textMuted }]}>
                Upload your student card or employee ID to get verified faster.
                (Optional — you can submit it later.)
              </Text>
              <CameraCapture
                label="Scan Student / Employee ID"
                icon="id-card-outline"
                facing="back"
                uri={circleDoc}
                onCapture={setCircleDoc}
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.backStepBtn, { backgroundColor: C.surfaceBackground, borderColor: C.border }]}
                  onPress={() => transition('personal')}
                >
                  <Ionicons name="arrow-back" size={16} color={C.primary} />
                  <Text style={[styles.backStepText, { color: C.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { flex: 1, backgroundColor: C.primary, shadowColor: C.primary }]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3: Consent ───────────────────────────────────────────── */}
          {step === 'consent' && (
            <>
              <Text style={[styles.cardTitle, { color: C.textPrimary }]}>Biometric Consent</Text>
              <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
                {isMale
                  ? 'Safe-Sawar uses NADRA biometric verification to keep the platform safe for all members. Please read and consent to the following.'
                  : 'Safe-Sawar uses NADRA biometric verification to keep the platform safe for all women. Please read and consent to the following.'}
              </Text>

              <View style={[styles.consentBox, { backgroundColor: C.surfaceBackground, borderColor: C.border }]}>
                <Ionicons name="document-text-outline" size={20} color={C.primary} />
                <Text style={[styles.consentBoxText, { color: C.textSecondary }]}>
                  By joining Safe-Sawar, you consent to:{'\n\n'}
                  • Verification of your CNIC against the NADRA database{'\n'}
                  • Biometric (face / fingerprint) verification on your device{'\n'}
                  • Storage of your verified status (CNIC details are not stored){'\n'}
                  • Sharing your name and circle with matched ride partners
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setBiometricConsent(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: C.border, backgroundColor: C.inputBackground },
                  biometricConsent && { backgroundColor: C.primary, borderColor: C.primary },
                ]}>
                  {biometricConsent && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.checkLabel, { color: C.textSecondary }]}>
                  I agree to biometric verification and the Safe-Sawar privacy policy.
                </Text>
              </TouchableOpacity>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.backStepBtn, { backgroundColor: C.surfaceBackground, borderColor: C.border }]}
                  onPress={() => transition('circle')}
                >
                  <Ionicons name="arrow-back" size={16} color={C.primary} />
                  <Text style={[styles.backStepText, { color: C.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { flex: 1, backgroundColor: C.primary, shadowColor: C.primary }, !biometricConsent && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={!biometricConsent}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={styles.nextBtnText}>Verify Identity</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  headerSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  stepsRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepItem:  { flex: 1, alignItems: 'center', position: 'relative' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepDone:    { backgroundColor: Colors.verified },
  stepActive:  { backgroundColor: Colors.primary },
  stepPending: { backgroundColor: Colors.surfaceBackground, borderWidth: 1, borderColor: Colors.border },
  stepLabel:   { fontSize: 9, textAlign: 'center' },
  stepLabelActive: { color: Colors.primary, fontWeight: '700' },
  stepLabelMuted:  { color: Colors.textMuted },
  stepLine: {
    position: 'absolute', top: 14, left: '50%', right: '-50%',
    height: 1.5, backgroundColor: Colors.border, zIndex: -1,
  },
  stepLineDone: { backgroundColor: Colors.verified },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    marginHorizontal: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  cardDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 20 },

  fieldLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  photoHint: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 13 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
    gap: 8, marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backStepBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  backStepText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  circleScroll: { paddingVertical: 4, paddingRight: 8, gap: 10, flexDirection: 'row', marginBottom: 14 },
  circleChip: {
    alignItems: 'center', width: 90, paddingVertical: 12, paddingHorizontal: 8,
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  circleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  circleEmoji: { fontSize: 24, marginBottom: 6 },
  circleName: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  circleNameActive: { color: Colors.primary },
  circleCategory: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },

  selectedCircleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.verifiedLight, borderRadius: 10, padding: 10,
  },
  selectedCircleText: { color: Colors.verified, fontSize: 12, fontWeight: '600', flex: 1 },

  docHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginBottom: 10 },

  consentBox: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
  },
  consentBoxText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.inputBackground, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
