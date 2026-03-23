import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Animated, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { formatCNIC } from '../services/biometricService';
import { useAppStore } from '../store/appStore';
import CameraCapture from '../components/CameraCapture';

type Props = { navigation: NativeStackNavigationProp<any> };
type Step = 'personal' | 'circle' | 'vehicle' | 'consent';

const STEPS: Step[]  = ['personal', 'circle', 'vehicle', 'consent'];
const STEP_LABELS     = ['Personal', 'Circle', 'Vehicle', 'Consent'];
const STEP_ICONS      = ['person-outline', 'people-outline', 'car-outline', 'shield-checkmark-outline'];

const CAR_COLORS = [
  { name: 'White',  hex: '#FFFFFF' },
  { name: 'Black',  hex: '#1A1A1A' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Red',    hex: '#E53935' },
  { name: 'Blue',   hex: '#1E88E5' },
  { name: 'Green',  hex: '#43A047' },
  { name: 'Gray',   hex: '#757575' },
  { name: 'Brown',  hex: '#795548' },
];

export default function CarpoolerRegistrationScreen({ navigation }: Props) {
  const { state, dispatch } = useAppStore();

  // Personal
  const [name, setName]               = useState('');
  const [cnic, setCnic]               = useState('');
  const [phone, setPhone]             = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  // Circle
  const [selectedCircle, setSelectedCircle] = useState('');
  const [circleDoc, setCircleDoc]     = useState('');
  // Vehicle
  const [make, setMake]               = useState('');
  const [model, setModel]             = useState('');
  const [carColor, setCarColor]       = useState('');
  const [plate, setPlate]             = useState('');
  const [seats, setSeats]             = useState(2);
  const [vehicleDoc, setVehicleDoc]   = useState('');
  const [routeFrom, setRouteFrom]     = useState('');
  const [routeTo, setRouteTo]         = useState('');
  // Consent
  const [biometricConsent, setBiometricConsent] = useState(false);

  const [step, setStep] = useState<Step>('personal');
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
      Alert.alert('Required', 'Please select your Circle.'); return false;
    }
    return true;
  };

  const validateVehicle = () => {
    if (!make.trim()) { Alert.alert('Required', 'Enter your vehicle make (e.g. Honda, Toyota).'); return false; }
    if (!model.trim()) { Alert.alert('Required', 'Enter your vehicle model (e.g. Civic, Corolla).'); return false; }
    if (!plate.trim()) { Alert.alert('Required', 'Enter your vehicle registration plate.'); return false; }
    if (!routeFrom.trim() || !routeTo.trim()) {
      Alert.alert('Required', 'Please enter your regular route (From and To).'); return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 'personal' && validatePersonal()) transition('circle');
    if (step === 'circle'   && validateCircle())   transition('vehicle');
    if (step === 'vehicle'  && validateVehicle())  transition('consent');
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
        role: 'carpooler',
        isVerified: false,
        biometricVerified: false,
        trustCredits: 5,
        circles: selectedCircle ? [selectedCircle] : [],
        photo: profilePhoto || undefined,
        circleId: selectedCircle || undefined,
        circleDoc: circleDoc || undefined,
        vehicle: {
          make: make.trim(),
          model: model.trim(),
          color: carColor || 'White',
          plate: plate.trim().toUpperCase(),
          seats,
          registrationDoc: vehicleDoc || undefined,
        },
        regularRoute: {
          from: routeFrom.trim(),
          to:   routeTo.trim(),
        },
      },
    });
    navigation.navigate('BiometricVerification');
  };

  const circles = state.circles;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Carpooler Registration</Text>
            <Text style={styles.headerSub}>Step {stepIndex + 1} of {STEPS.length}</Text>
          </View>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                i < stepIndex   ? styles.stepDone :
                i === stepIndex ? styles.stepActive :
                                  styles.stepPending,
              ]}>
                {i < stepIndex
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Ionicons name={STEP_ICONS[i] as any} size={11}
                      color={i === stepIndex ? '#fff' : Colors.textMuted} />
                }
              </View>
              <Text style={[styles.stepLabel,
                i === stepIndex ? styles.stepLabelActive : styles.stepLabelMuted]}>
                {label}
              </Text>
              {i < STEP_LABELS.length - 1 && (
                <View style={[styles.stepLine, i < stepIndex && styles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>

          {/* ── Step 1: Personal ───────────────────────────────────────────── */}
          {step === 'personal' && (
            <>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardDesc}>Your details are verified against NADRA before activation.</Text>

              <Text style={styles.fieldLabel}>Profile Photo</Text>
              <View style={styles.photoRow}>
                <CameraCapture
                  label="Take Selfie"
                  icon="person-circle-outline"
                  facing="front"
                  uri={profilePhoto}
                  onCapture={setProfilePhoto}
                />
                <Text style={styles.photoHint}>Passengers will see this when you offer a ride.</Text>
              </View>

              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g. Ayesha Fatima"
                  placeholderTextColor={Colors.textMuted} value={name}
                  onChangeText={setName} autoCapitalize="words" />
              </View>

              <Text style={styles.fieldLabel}>CNIC Number *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="card-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="XXXXX-XXXXXXX-X"
                  placeholderTextColor={Colors.textMuted} value={cnic}
                  onChangeText={v => setCnic(formatCNIC(v))} keyboardType="numeric" maxLength={15} />
              </View>

              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="+92 300 1234567"
                  placeholderTextColor={Colors.textMuted} value={phone}
                  onChangeText={setPhone} keyboardType="phone-pad" />
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Circle ────────────────────────────────────────────── */}
          {step === 'circle' && (
            <>
              <Text style={styles.cardTitle}>Your Circle</Text>
              <Text style={styles.cardDesc}>You can only offer rides within your verified circle.</Text>

              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.circleScroll}
              >
                {circles.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.circleChip, selectedCircle === c.id && styles.circleChipActive]}
                    onPress={() => setSelectedCircle(c.id)}
                  >
                    <Text style={styles.circleEmoji}>{c.emoji}</Text>
                    <Text style={[styles.circleName, selectedCircle === c.id && styles.circleNameActive]}>
                      {c.name}
                    </Text>
                    <Text style={styles.circleCategory}>{c.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedCircle && (
                <View style={styles.selectedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />
                  <Text style={styles.selectedText}>
                    {circles.find(c => c.id === selectedCircle)?.institution}
                  </Text>
                </View>
              )}

              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Circle Verification Doc</Text>
              <Text style={styles.docHint}>Student card or employee ID. Optional — submit later.</Text>
              <CameraCapture label="Scan Student / Employee ID" icon="id-card-outline"
                facing="back" uri={circleDoc} onCapture={setCircleDoc} />

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => transition('personal')}>
                  <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                  <Text style={styles.backStepText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3: Vehicle ───────────────────────────────────────────── */}
          {step === 'vehicle' && (
            <>
              <Text style={styles.cardTitle}>Vehicle Details</Text>
              <Text style={styles.cardDesc}>Passengers use these details to identify your car.</Text>

              <Text style={styles.fieldLabel}>Vehicle Make *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="car-sport-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g. Honda, Toyota, Suzuki"
                  placeholderTextColor={Colors.textMuted} value={make}
                  onChangeText={setMake} autoCapitalize="words" />
              </View>

              <Text style={styles.fieldLabel}>Vehicle Model *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="car-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g. Civic, Corolla, Alto"
                  placeholderTextColor={Colors.textMuted} value={model}
                  onChangeText={setModel} autoCapitalize="words" />
              </View>

              <Text style={styles.fieldLabel}>Registration Plate *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="document-text-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g. LHR-1234"
                  placeholderTextColor={Colors.textMuted} value={plate}
                  onChangeText={setPlate} autoCapitalize="characters" />
              </View>

              <Text style={styles.fieldLabel}>Vehicle Color</Text>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorScroll}
              >
                {CAR_COLORS.map(c => (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.colorChip, carColor === c.name && styles.colorChipActive]}
                    onPress={() => setCarColor(c.name)}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.hex,
                      borderWidth: c.name === 'White' ? 1 : 0, borderColor: Colors.border }]} />
                    <Text style={[styles.colorName, carColor === c.name && styles.colorNameActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Available Seats *</Text>
              <View style={styles.seatsRow}>
                {[1, 2, 3].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.seatBtn, seats === n && styles.seatBtnActive]}
                    onPress={() => setSeats(n)}
                  >
                    <Ionicons
                      name="person"
                      size={18}
                      color={seats === n ? Colors.textPrimary : Colors.textMuted}
                    />
                    <Text style={[styles.seatLabel, seats === n && styles.seatLabelActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.seatsHint}>available passenger seats</Text>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Vehicle Registration Doc</Text>
              <Text style={styles.docHint}>Photo of your vehicle registration certificate. Optional.</Text>
              <CameraCapture label="Scan Registration Doc" icon="document-outline"
                facing="back" uri={vehicleDoc} onCapture={setVehicleDoc} />

              {/* Regular Route */}
              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Regular Route *</Text>
              <Text style={styles.docHint}>Your typical daily commute. Passengers will be matched along this route.</Text>

              <View style={styles.routeCard}>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.verified }]} />
                  <View style={styles.inputWrap2}>
                    <TextInput style={styles.input} placeholder="From (e.g. Gulberg, Lahore)"
                      placeholderTextColor={Colors.textMuted} value={routeFrom}
                      onChangeText={setRouteFrom} />
                  </View>
                </View>
                <View style={styles.routeConnector} />
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                  <View style={styles.inputWrap2}>
                    <TextInput style={styles.input} placeholder="To (e.g. UET Main Campus)"
                      placeholderTextColor={Colors.textMuted} value={routeTo}
                      onChangeText={setRouteTo} />
                  </View>
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => transition('circle')}>
                  <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                  <Text style={styles.backStepText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 4: Consent ───────────────────────────────────────────── */}
          {step === 'consent' && (
            <>
              <Text style={styles.cardTitle}>Biometric Consent</Text>
              <Text style={styles.cardDesc}>
                As a carpooler, you are responsible for the safety of your passengers. Please read carefully.
              </Text>

              {/* Summary card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Registration Summary</Text>
                <SummaryRow icon="person" label="Name"    value={name} />
                <SummaryRow icon="car"   label="Vehicle" value={`${make} ${model} · ${plate}`} />
                <SummaryRow icon="people"label="Circle"  value={circles.find(c => c.id === selectedCircle)?.name || '-'} />
                <SummaryRow icon="navigate" label="Route" value={`${routeFrom} → ${routeTo}`} />
                <SummaryRow icon="people-circle" label="Seats" value={`${seats} available`} />
              </View>

              <View style={styles.consentBox}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                <Text style={styles.consentBoxText}>
                  By joining as a Carpooler, you consent to:{'\n\n'}
                  • CNIC verification against the NADRA database{'\n'}
                  • Biometric (face / fingerprint) device verification{'\n'}
                  • Sharing your name, vehicle details & circle with matched passengers{'\n'}
                  • Background safety checks within Safe-Sawar{'\n'}
                  • Women-only policy — your vehicle will only be matched with verified women
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setBiometricConsent(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, biometricConsent && styles.checkboxChecked]}>
                  {biometricConsent && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkLabel}>
                  I agree to biometric verification and the Safe-Sawar carpooler terms & conditions.
                </Text>
              </TouchableOpacity>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => transition('vehicle')}>
                  <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                  <Text style={styles.backStepText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, { flex: 1 }, !biometricConsent && styles.btnDisabled]}
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

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value || value.trim() === ' · ' || value.trim() === '→') return null;
  return (
    <View style={summaryStyles.row}>
      <Ionicons name={icon as any} size={14} color={Colors.primary} />
      <Text style={summaryStyles.label}>{label}:</Text>
      <Text style={summaryStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { color: Colors.textMuted, fontSize: 12, width: 52 },
  value: { color: Colors.textPrimary, fontSize: 12, flex: 1, fontWeight: '600' },
});

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 22, paddingTop: 56, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.cardBackground, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  headerSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  stepsRow: {
    flexDirection: 'row', paddingHorizontal: 22,
    marginBottom: 16, alignItems: 'flex-start',
  },
  stepItem:  { flex: 1, alignItems: 'center', position: 'relative' },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepDone:    { backgroundColor: Colors.verified },
  stepActive:  { backgroundColor: Colors.primary },
  stepPending: { backgroundColor: Colors.surfaceBackground, borderWidth: 1, borderColor: Colors.border },
  stepLabel:   { fontSize: 8, textAlign: 'center' },
  stepLabelActive: { color: Colors.primary, fontWeight: '700' },
  stepLabelMuted:  { color: Colors.textMuted },
  stepLine: {
    position: 'absolute', top: 13, left: '50%', right: '-50%',
    height: 1.5, backgroundColor: Colors.border, zIndex: -1,
  },
  stepLineDone: { backgroundColor: Colors.verified },

  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 20,
    marginHorizontal: 22, padding: 22, borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  cardDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 20 },

  fieldLabel: {
    fontSize: 11, color: Colors.textMuted, fontWeight: '700',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  photoHint: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBackground, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, marginBottom: 14,
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
  circleEmoji:  { fontSize: 22, marginBottom: 6 },
  circleName:   { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  circleNameActive: { color: Colors.primary },
  circleCategory: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },

  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.verifiedLight, borderRadius: 10, padding: 10,
  },
  selectedText: { color: Colors.verified, fontSize: 12, fontWeight: '600', flex: 1 },

  docHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginBottom: 10 },

  colorScroll: { paddingVertical: 4, paddingRight: 8, gap: 10, flexDirection: 'row', marginBottom: 14 },
  colorChip: {
    alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 10,
    backgroundColor: Colors.surfaceBackground, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  colorChipActive: { borderColor: Colors.primary },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorName: { color: Colors.textSecondary, fontSize: 10 },
  colorNameActive: { color: Colors.primary, fontWeight: '700' },

  seatsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  seatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: Colors.surfaceBackground, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  seatBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seatLabel: { color: Colors.textMuted, fontSize: 15, fontWeight: '700' },
  seatLabelActive: { color: Colors.textPrimary },
  seatsHint: { color: Colors.textMuted, fontSize: 12, flex: 1 },

  routeCard: {
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  inputWrap2: {
    flex: 1, backgroundColor: Colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
  },
  routeConnector: {
    width: 2, height: 16, backgroundColor: Colors.border,
    marginLeft: 4, marginVertical: 4,
  },

  summaryCard: {
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  summaryTitle: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },

  consentBox: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.surfaceBackground, borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
  },
  consentBoxText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.inputBackground, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
