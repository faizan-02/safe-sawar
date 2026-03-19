import * as LocalAuthentication from 'expo-local-authentication';

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

// Mock NADRA database
const MOCK_NADRA_DATABASE: Record<string, NADRAVerificationResult> = {
  '35202-1234567-8': {
    verified: true,
    name: 'Ayesha Mahmood',
    photo: '👩‍💼',
    cnic: '35202-1234567-8',
    city: 'Islamabad',
    dateOfBirth: '1995-05-15',
    gender: 'Female',
  },
  '37405-9876543-2': {
    verified: true,
    name: 'Fatima Zahra',
    photo: '🧕',
    cnic: '37405-9876543-2',
    city: 'Lahore',
    dateOfBirth: '1998-08-22',
    gender: 'Female',
  },
  '61101-5554443-3': {
    verified: true,
    name: 'Sara Ali Khan',
    photo: '👩‍⚕️',
    cnic: '61101-5554443-3',
    city: 'Karachi',
    dateOfBirth: '1992-03-10',
    gender: 'Female',
  },
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates CNIC verification with the NADRA API (Nishan Pakistan)
 * In production, this would call the actual NADRA/Nishan Pakistan API
 */
export async function verifyWithNADRA(cnic: string): Promise<NADRAVerificationResult> {
  // Simulate API call delay (2-3 seconds)
  await delay(2000 + Math.random() * 1000);

  // Clean CNIC format
  const cleanedCNIC = cnic.replace(/\s/g, '');

  // Check mock database
  if (MOCK_NADRA_DATABASE[cleanedCNIC]) {
    return MOCK_NADRA_DATABASE[cleanedCNIC];
  }

  // For demo: accept any properly formatted CNIC
  const cnicPattern = /^\d{5}-\d{7}-\d$/;
  if (cnicPattern.test(cleanedCNIC)) {
    return {
      verified: true,
      name: 'Verified User',
      photo: '👩',
      cnic: cleanedCNIC,
      city: 'Islamabad',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
    };
  }

  return {
    verified: false,
    name: '',
    photo: '',
    cnic: cleanedCNIC,
    city: '',
    dateOfBirth: '',
    gender: '',
    error: 'CNIC not found in NADRA database. Please check and try again.',
  };
}

/**
 * Simulates sending OTP to phone number
 */
export async function sendOTP(phoneNumber: string): Promise<OTPResult> {
  await delay(1000);

  const phonePattern = /^\+92\s?\d{3}\s?\d{7}$|^03\d{9}$/;
  if (!phonePattern.test(phoneNumber.replace(/\s/g, ''))) {
    return {
      success: false,
      message: 'Invalid phone number format. Use +92XXXXXXXXXX or 03XXXXXXXXX',
    };
  }

  return {
    success: true,
    message: `OTP sent to ${phoneNumber}. Use 123456 for demo.`,
  };
}

/**
 * Verifies OTP code
 */
export async function verifyOTP(otp: string): Promise<OTPResult> {
  await delay(800);

  // Demo OTP
  if (otp === '123456') {
    return { success: true, message: 'Phone number verified successfully' };
  }

  return { success: false, message: 'Invalid OTP. Please try again.' };
}

/**
 * Verifies biometric (fingerprint/face) using device's local authentication
 */
export async function verifyBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      // Simulate success for devices without biometric hardware (dev/emulator)
      await delay(1500);
      return { success: true };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      await delay(1500);
      return { success: true }; // Simulate for demo
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Biometric Verification for Safe-Sawar',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      error: result.success ? undefined : 'Biometric verification failed',
    };
  } catch (error) {
    // Simulate success for demo if there's an error
    await delay(1500);
    return { success: true };
  }
}

/**
 * Checks if device supports biometric authentication
 */
export async function checkBiometricSupport(): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return { hasHardware, isEnrolled, supportedTypes };
  } catch {
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
}

/**
 * Formats CNIC as user types (XXXXX-XXXXXXX-X)
 */
export function formatCNIC(value: string): string {
  const cleaned = value.replace(/[^0-9]/g, '');
  let formatted = '';

  if (cleaned.length <= 5) {
    formatted = cleaned;
  } else if (cleaned.length <= 12) {
    formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else {
    formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  }

  return formatted;
}
