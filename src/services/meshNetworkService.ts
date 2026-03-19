// Mesh Network Service - Emergency SOS fallback when internet is unavailable
// In production this would use Bluetooth LE / WiFi Direct for peer-to-peer messaging

export interface MeshDevice {
  id: string;
  name: string;
  distance: number; // meters
  signalStrength: number; // 0-100
  isTrusted: boolean;
  lastSeen: Date;
}

export interface MeshMessage {
  id: string;
  type: 'SOS' | 'LOCATION' | 'STATUS';
  senderId: string;
  senderName: string;
  content: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  hopCount: number;
  ttl: number; // time to live in hops
}

export interface NetworkStatus {
  isOnline: boolean;
  meshActive: boolean;
  nearbyDevices: MeshDevice[];
  deviceCount: number;
  sosCapable: boolean;
  lastUpdated: Date;
}

// Simulate nearby Safe-Sawar devices
const generateMockDevices = (): MeshDevice[] => {
  const count = Math.floor(Math.random() * 4) + 2; // 2-5 devices
  const deviceNames = [
    'SS_Device_F4A2',
    'SS_Device_B8C3',
    'SS_Device_A1D5',
    'SS_Device_E9F7',
    'SS_Device_C2B6',
    'SS_Device_D3A8',
  ];

  return deviceNames.slice(0, count).map((name, i) => ({
    id: `device_${i + 1}`,
    name,
    distance: Math.floor(Math.random() * 500) + 50, // 50-550 meters
    signalStrength: Math.floor(Math.random() * 40) + 60, // 60-100
    isTrusted: Math.random() > 0.3,
    lastSeen: new Date(),
  }));
};

let mockDevices: MeshDevice[] = generateMockDevices();
let meshActive = true;
let onlineStatus = true;

// Refresh mock devices periodically
setInterval(() => {
  mockDevices = generateMockDevices();
}, 15000);

/**
 * Gets current network and mesh status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  // Simulate network check delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    isOnline: onlineStatus,
    meshActive,
    nearbyDevices: mockDevices,
    deviceCount: mockDevices.length,
    sosCapable: mockDevices.length > 0,
    lastUpdated: new Date(),
  };
}

/**
 * Activates mesh network for emergency use
 */
export async function activateMeshNetwork(): Promise<{
  success: boolean;
  deviceCount: number;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 800));

  meshActive = true;
  mockDevices = generateMockDevices();

  return {
    success: true,
    deviceCount: mockDevices.length,
    message: `Mesh network activated. ${mockDevices.length} nearby Safe-Sawar devices found.`,
  };
}

/**
 * Sends SOS via mesh network when internet is unavailable
 * Uses hop-by-hop message relay through nearby devices
 */
export async function sendSOSViaMesh(
  senderName: string,
  location: { lat: number; lng: number } | null,
  emergencyContacts: string[]
): Promise<{
  success: boolean;
  hopCount: number;
  reachedContacts: number;
  message: string;
}> {
  if (mockDevices.length === 0) {
    return {
      success: false,
      hopCount: 0,
      reachedContacts: 0,
      message: 'No nearby devices found. SOS could not be relayed.',
    };
  }

  // Simulate mesh relay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const hopCount = Math.floor(Math.random() * 3) + 2; // 2-4 hops
  const reachedContacts = Math.min(
    emergencyContacts.length,
    Math.floor(Math.random() * 3) + 1
  );

  const sosMessage: MeshMessage = {
    id: `sos_${Date.now()}`,
    type: 'SOS',
    senderId: 'user_current',
    senderName,
    content: `EMERGENCY SOS from ${senderName}. Please help or contact authorities.`,
    location: location || undefined,
    timestamp: new Date(),
    hopCount: 0,
    ttl: 10,
  };

  console.log('SOS Message sent via mesh:', sosMessage);

  return {
    success: true,
    hopCount,
    reachedContacts,
    message: `SOS sent through ${hopCount} device hops. ${reachedContacts} emergency contact(s) notified via mesh network.`,
  };
}

/**
 * Sends SOS via internet (primary method)
 */
export async function sendSOSViaInternet(
  senderName: string,
  location: { lat: number; lng: number } | null,
  emergencyContacts: string[]
): Promise<{
  success: boolean;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate internet SOS
  return {
    success: true,
    message: `SOS alert sent to ${emergencyContacts.length} emergency contact(s) and local authorities. Your location has been shared.`,
  };
}

/**
 * Sends SOS using best available method (internet first, mesh fallback)
 */
export async function sendSOS(
  senderName: string,
  location: { lat: number; lng: number } | null,
  emergencyContacts: string[]
): Promise<{
  method: 'internet' | 'mesh' | 'failed';
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  // Try internet first
  if (onlineStatus) {
    try {
      const result = await sendSOSViaInternet(senderName, location, emergencyContacts);
      if (result.success) {
        return {
          method: 'internet',
          success: true,
          message: result.message,
          details: { method: 'internet' },
        };
      }
    } catch {
      // Fall through to mesh
    }
  }

  // Fallback to mesh network
  const meshResult = await sendSOSViaMesh(senderName, location, emergencyContacts);
  if (meshResult.success) {
    return {
      method: 'mesh',
      success: true,
      message: meshResult.message,
      details: {
        hopCount: meshResult.hopCount,
        reachedContacts: meshResult.reachedContacts,
        method: 'mesh',
      },
    };
  }

  return {
    method: 'failed',
    success: false,
    message: 'SOS could not be sent. No network or mesh devices available.',
  };
}

/**
 * Simulates toggling internet connectivity (for demo purposes)
 */
export function simulateOfflineMode(isOffline: boolean): void {
  onlineStatus = !isOffline;
}

/**
 * Gets nearby device count for display
 */
export function getNearbyDeviceCount(): number {
  return mockDevices.length;
}

/**
 * Gets signal strength indicator text
 */
export function getSignalStrengthText(strength: number): string {
  if (strength >= 80) return 'Excellent';
  if (strength >= 60) return 'Good';
  if (strength >= 40) return 'Fair';
  return 'Weak';
}
