import * as LocalAuthentication from 'expo-local-authentication';
import auth from '@react-native-firebase/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const NADRA_PROVIDER = (process.env.EXPO_PUBLIC_NADRA_PROVIDER || 'shufti') as 'nishan' | 'shufti';

// Nishan Pakistan (official NADRA) — OAuth 2.0
const NISHAN_CLIENT_ID     = process.env.EXPO_PUBLIC_NISHAN_CLIENT_ID     || '';
const NISHAN_CLIENT_SECRET = process.env.EXPO_PUBLIC_NISHAN_CLIENT_SECRET  || '';
const NISHAN_TOKEN_URL     = process.env.EXPO_PUBLIC_NISHAN_TOKEN_URL      ||
  'https://nishan.nadra.gov.pk/auth/realms/nishan/protocol/openid-connect/token';
const NISHAN_API_URL       = process.env.EXPO_PUBLIC_NISHAN_API_URL        ||
  'https://nishan.nadra.gov.pk/api/v1';

// Shufti Pro (easiest to access; free sandbox available at shuftipro.com)
const SHUFTI_CLIENT_ID  = process.env.EXPO_PUBLIC_SHUFTI_CLIENT_ID  || '';
const SHUFTI_SECRET_KEY = process.env.EXPO_PUBLIC_SHUFTI_SECRET_KEY || '';
const SHUFTI_API_URL    = process.env.EXPO_PUBLIC_SHUFTI_API_URL    || 'https://api.shuftipro.com';

// Twilio Verify (OTP)
const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN  = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN  || '';
const TWILIO_VERIFY_SID  = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SID  || '';

// Face++ (face detection + gender verification)
const FACEPP_API_KEY    = process.env.EXPO_PUBLIC_FACEPP_API_KEY    || '';
const FACEPP_API_SECRET = process.env.EXPO_PUBLIC_FACEPP_API_SECRET || '';
const FACEPP_API_URL    = process.env.EXPO_PUBLIC_FACEPP_API_URL    ||
  'https://api-us.faceplusplus.com/facepp/v3/detect';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NADRAVerificationResult {
  verified: boolean;
  name: string;
  photo: string;
  cnic: string;
  city: string;
  dateOfBirth: string;
  gender: string;
  error?: string;
}

export interface OTPResult {
  success: boolean;
  message: string;
}

export type FaceGenderResult =
  | { detected: true;  gender: 'Female' | 'Male'; confidence: number }
  | { detected: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// CNIC Verification — Nishan Pakistan
// Official NADRA platform. Register at: https://nishan.nadra.gov.pk/
// Approval requires a SECP-registered business and takes 10–15 days.
// API uses OAuth 2.0 — we fetch a token first, then call Verisys.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchNishanToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     NISHAN_CLIENT_ID,
    client_secret: NISHAN_CLIENT_SECRET,
  });

  const res = await fetch(NISHAN_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nishan token error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

async function verifyWithNishan(cnic: string): Promise<NADRAVerificationResult> {
  if (!NISHAN_CLIENT_ID || !NISHAN_CLIENT_SECRET) {
    return notConfiguredError(cnic, 'Nishan Pakistan (NADRA)', 'https://nishan.nadra.gov.pk/');
  }

  try {
    const token = await fetchNishanToken();

    const res = await fetch(`${NISHAN_API_URL}/verisys/verify`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify({ cnic: cnic.replace(/-/g, '') }), // 13 digits, no dashes
    });

    const data = await res.json();

    if (!res.ok) {
      return errorResult(cnic, data.message || data.error || `Server error ${res.status}`);
    }

    const valid = data.verified ?? data.status === 'VALID' ?? data.result === 'found';
    if (!valid) {
      return errorResult(cnic, data.message || 'CNIC not found in NADRA database.');
    }

    return {
      verified:    true,
      name:        data.name        ?? data.fullName   ?? data.holder_name ?? '',
      photo:       data.photo       ?? data.image      ?? '',
      cnic,
      city:        data.city        ?? data.district   ?? data.address?.city ?? '',
      dateOfBirth: data.dateOfBirth ?? data.dob        ?? '',
      gender:      data.gender      ?? '',
    };
  } catch (err) {
    return networkError(cnic, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CNIC Verification — Shufti Pro
// Register at https://shuftipro.com — free sandbox available immediately.
// Uses Basic Auth: Base64(client_id:secret_key)
// Docs: https://developers.shuftipro.com/
// ─────────────────────────────────────────────────────────────────────────────
async function verifyWithShufti(cnic: string): Promise<NADRAVerificationResult> {
  if (!SHUFTI_CLIENT_ID || !SHUFTI_SECRET_KEY) {
    return notConfiguredError(cnic, 'Shufti Pro', 'https://shuftipro.com');
  }

  const auth = 'Basic ' + btoa(`${SHUFTI_CLIENT_ID}:${SHUFTI_SECRET_KEY}`);
  const reference = `safe_sawar_${Date.now()}`;

  try {
    const res = await fetch(`${SHUFTI_API_URL}`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  auth,
      },
      body: JSON.stringify({
        reference,
        country:  'PK',
        language: 'EN',
        document: {
          supported_types:  ['id_card'],
          document_number:  cnic.replace(/-/g, ''), // 13-digit CNIC
          verification_instructions: { allow_online: '1' },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return errorResult(cnic, data.message || data.error?.message || `Server error ${res.status}`);
    }

    // event = 'verification.accepted' means the document is authentic
    const accepted = data.event === 'verification.accepted';
    if (!accepted) {
      const reason =
        data.verification_result?.document?.document_number === 1
          ? 'CNIC number valid'
          : 'CNIC could not be verified. Check the number and try again.';
      return errorResult(cnic, reason);
    }

    const info = data.verification_data?.document ?? {};

    return {
      verified:    true,
      name:        info.name?.full_name         ?? '',
      photo:       data.verification_data?.face?.face_on_document_matched ? '' : '',
      cnic,
      city:        info.address?.full_address   ?? '',
      dateOfBirth: info.dob                     ?? '',
      gender:      info.gender                  ?? '',
    };
  } catch (err) {
    return networkError(cnic, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point — dispatches to the configured provider.
// Also enforces the women-only policy: rejects any CNIC whose gender field
// comes back as Male from the NADRA/verification response.
// ─────────────────────────────────────────────────────────────────────────────
function isMale(gender: string): boolean {
  const g = gender.trim().toLowerCase();
  return g === 'male' || g === 'm';
}

export async function verifyWithNADRA(cnic: string): Promise<NADRAVerificationResult> {
  const cleaned = cnic.replace(/\s/g, '');
  const result  = await (NADRA_PROVIDER === 'nishan'
    ? verifyWithNishan(cleaned)
    : verifyWithShufti(cleaned));

  // Women-only enforcement: reject if NADRA confirms male gender
  if (result.verified && result.gender && isMale(result.gender)) {
    return {
      ...result,
      verified: false,
      error: 'Safe-Sawar is exclusively for women. This CNIC is registered to a male.',
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone OTP — Firebase Authentication
// Free up to 10,000 SMS/month. Works in Pakistan with no geo-blocking.
// Setup: console.firebase.google.com → Authentication → Sign-in method → Phone
// ─────────────────────────────────────────────────────────────────────────────

// Holds the Firebase confirmation object between sendOTP and verifyOTP calls
let _firebaseConfirmation: any = null;

function toE164(phone: string): string | null {
  const d = phone.replace(/[\s\-()]/g, '');
  if (/^\+92\d{10}$/.test(d))  return d;
  if (/^03\d{9}$/.test(d))     return '+92' + d.slice(1);
  if (/^923\d{9}$/.test(d))    return '+' + d;
  return null;
}

export async function sendOTP(phoneNumber: string): Promise<OTPResult> {
  const e164 = toE164(phoneNumber);
  if (!e164) {
    return { success: false, message: 'Invalid phone number. Use +92XXXXXXXXXX or 03XXXXXXXXX' };
  }

  try {
    _firebaseConfirmation = await auth().signInWithPhoneNumber(e164);
    return { success: true, message: `OTP sent to ${e164}. Check your SMS.` };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    // Surface a friendly message for common errors
    if (msg.includes('invalid-phone-number')) {
      return { success: false, message: 'Invalid phone number format.' };
    }
    if (msg.includes('too-many-requests')) {
      return { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    return { success: false, message: `Failed to send OTP: ${msg}` };
  }
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<OTPResult> {
  if (!_firebaseConfirmation) {
    return { success: false, message: 'Please request OTP first.' };
  }

  try {
    await _firebaseConfirmation.confirm(otp);
    _firebaseConfirmation = null;
    return { success: true, message: 'Phone number verified successfully.' };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    if (msg.includes('invalid-verification-code')) {
      return { success: false, message: 'Incorrect OTP. Please check and try again.' };
    }
    if (msg.includes('session-expired')) {
      return { success: false, message: 'OTP expired. Please request a new one.' };
    }
    return { success: false, message: 'Verification failed. Please try again.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Face++ — gender detection from a captured face photo
// Register at: https://console.faceplusplus.com  (personal email, free tier)
// Returns detected gender and whether a face was found at all.
// Safe-Sawar uses this to enforce the women-only policy at the face-scan step.
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyFaceGender(base64Image: string): Promise<FaceGenderResult> {
  if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
    return {
      detected: false,
      error:
        'Face++ not configured. Add EXPO_PUBLIC_FACEPP_API_KEY and EXPO_PUBLIC_FACEPP_API_SECRET to your .env file. Register at console.faceplusplus.com',
    };
  }

  try {
    const body = new FormData();
    body.append('api_key',          FACEPP_API_KEY);
    body.append('api_secret',       FACEPP_API_SECRET);
    body.append('image_base64',     base64Image);
    body.append('return_attributes','gender,age');

    const res = await fetch(FACEPP_API_URL, { method: 'POST', body });

    if (!res.ok) {
      const text = await res.text();
      return { detected: false, error: `Face++ error ${res.status}: ${text}` };
    }

    const data = await res.json();

    if (!data.faces || data.faces.length === 0) {
      return { detected: false, error: 'No face detected. Please look directly at the camera and try again.' };
    }

    if (data.faces.length > 1) {
      return { detected: false, error: 'Multiple faces detected. Please ensure only your face is visible.' };
    }

    const face       = data.faces[0];
    const gender     = face.attributes?.gender?.value as 'Female' | 'Male';
    // Face++ returns a threshold — we treat it as 100% since it's categorical
    const confidence = 100;

    return { detected: true, gender, confidence };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { detected: false, error: `Network error: ${msg}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Biometric — device Face ID / fingerprint (expo-local-authentication)
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { success: false, error: 'This device does not have biometric hardware.' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        success: false,
        error: 'No biometrics enrolled. Set up Face ID or fingerprint in device Settings.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:         'Verify your face to continue',
      cancelLabel:           'Cancel',
      fallbackLabel:         'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) return { success: true };

    const friendly: Record<string, string> = {
      user_cancel:        'Cancelled. Tap "Start Face Scan" to try again.',
      lockout:            'Too many failed attempts. Try again in a moment.',
      lockout_permanent:  'Biometrics locked. Use your device passcode.',
      not_enrolled:       'No biometrics enrolled. Set up Face ID in Settings.',
    };
    const errKey = (result as any).error ?? '';
    return { success: false, error: friendly[errKey] ?? 'Biometric verification failed. Please try again.' };
  } catch (err) {
    return { success: false, error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function checkBiometricSupport() {
  try {
    return {
      hasHardware:    await LocalAuthentication.hasHardwareAsync(),
      isEnrolled:     await LocalAuthentication.isEnrolledAsync(),
      supportedTypes: await LocalAuthentication.supportedAuthenticationTypesAsync(),
    };
  } catch {
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
export function formatCNIC(value: string): string {
  const c = value.replace(/[^0-9]/g, '');
  if (c.length <= 5)  return c;
  if (c.length <= 12) return `${c.slice(0, 5)}-${c.slice(5)}`;
  return `${c.slice(0, 5)}-${c.slice(5, 12)}-${c.slice(12, 13)}`;
}

function notConfiguredError(cnic: string, service: string, url: string): NADRAVerificationResult {
  return {
    verified: false, name: '', photo: '', cnic, city: '', dateOfBirth: '', gender: '',
    error: `${service} credentials not set. Register at ${url} and add the keys to your .env file.`,
  };
}

function errorResult(cnic: string, message: string): NADRAVerificationResult {
  return { verified: false, name: '', photo: '', cnic, city: '', dateOfBirth: '', gender: '', error: message };
}

function networkError(cnic: string, err: unknown): NADRAVerificationResult {
  const msg = err instanceof Error ? err.message : String(err);
  return errorResult(cnic, `Network error: ${msg}. Check your internet connection.`);
}
