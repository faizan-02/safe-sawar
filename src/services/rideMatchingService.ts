export interface RideMatch {
  id: string;
  driverName: string;
  driverAvatar: string;
  circle: string;
  circleName: string;
  vouchCount: number;
  car: string;
  carColor: string;
  carPlate: string;
  eta: string;
  etaMinutes: number;
  rating: number;
  seatsAvailable: number;
  isVerified: boolean;
  pickupDistance: string;
  priceEstimate: string;
  route: {
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
  };
}

export interface ScheduleRideRequest {
  pickup: string;
  dropoff: string;
  departureTime?: Date;
  seatsNeeded?: number;
}

// Mock drivers/riders in Islamabad area
const MOCK_DRIVERS: RideMatch[] = [
  {
    id: 'driver_1',
    driverName: 'Ayesha K.',
    driverAvatar: '👩‍⚕️',
    circle: 'pims-islamabad',
    circleName: 'PIMS Doctors',
    vouchCount: 12,
    car: 'Toyota Aqua',
    carColor: 'Pink',
    carPlate: 'ISB-2024',
    eta: '4 min',
    etaMinutes: 4,
    rating: 4.9,
    seatsAvailable: 2,
    isVerified: true,
    pickupDistance: '0.3 km away',
    priceEstimate: 'PKR 150-200',
    route: {
      pickup: { lat: 33.7294, lng: 73.0931, address: 'F-10 Markaz' },
      dropoff: { lat: 33.6938, lng: 73.0652, address: 'PIMS Hospital' },
    },
  },
  {
    id: 'driver_2',
    driverName: 'Sana M.',
    driverAvatar: '🧕',
    circle: 'nust-islamabad',
    circleName: 'NUST Students',
    vouchCount: 8,
    car: 'Honda City',
    carColor: 'White',
    carPlate: 'LHR-3301',
    eta: '7 min',
    etaMinutes: 7,
    rating: 4.7,
    seatsAvailable: 3,
    isVerified: true,
    pickupDistance: '0.8 km away',
    priceEstimate: 'PKR 120-180',
    route: {
      pickup: { lat: 33.7200, lng: 73.0800, address: 'Blue Area' },
      dropoff: { lat: 33.6421, lng: 72.9898, address: 'NUST H-12' },
    },
  },
  {
    id: 'driver_3',
    driverName: 'Fatima R.',
    driverAvatar: '👩‍💼',
    circle: 'quaid-azam-university',
    circleName: 'QAU Students',
    vouchCount: 15,
    car: 'Suzuki Alto',
    carColor: 'Silver',
    carPlate: 'ISB-8834',
    eta: '10 min',
    etaMinutes: 10,
    rating: 4.8,
    seatsAvailable: 2,
    isVerified: true,
    pickupDistance: '1.2 km away',
    priceEstimate: 'PKR 100-150',
    route: {
      pickup: { lat: 33.7100, lng: 73.0650, address: 'G-9 Markaz' },
      dropoff: { lat: 33.7474, lng: 73.1369, address: 'Quaid-i-Azam University' },
    },
  },
  {
    id: 'driver_4',
    driverName: 'Zainab H.',
    driverAvatar: '👩‍🎓',
    circle: 'comsats-islamabad',
    circleName: 'Comsats Students',
    vouchCount: 6,
    car: 'Toyota Vitz',
    carColor: 'Red',
    carPlate: 'ISB-5521',
    eta: '13 min',
    etaMinutes: 13,
    rating: 4.6,
    seatsAvailable: 1,
    isVerified: true,
    pickupDistance: '1.5 km away',
    priceEstimate: 'PKR 130-170',
    route: {
      pickup: { lat: 33.6844, lng: 73.0479, address: 'I-8 Markaz' },
      dropoff: { lat: 33.6574, lng: 73.1425, address: 'Comsats University' },
    },
  },
  {
    id: 'driver_5',
    driverName: 'Mariam A.',
    driverAvatar: '🧑‍⚕️',
    circle: 'aga-khan-hospital',
    circleName: 'Aga Khan Doctors',
    vouchCount: 20,
    car: 'Honda Civic',
    carColor: 'Black',
    carPlate: 'KHI-7890',
    eta: '15 min',
    etaMinutes: 15,
    rating: 5.0,
    seatsAvailable: 3,
    isVerified: true,
    pickupDistance: '2.1 km away',
    priceEstimate: 'PKR 200-250',
    route: {
      pickup: { lat: 33.7000, lng: 73.0600, address: 'G-10 Markaz' },
      dropoff: { lat: 33.7200, lng: 73.0750, address: 'Aga Khan Hospital' },
    },
  },
  {
    id: 'driver_6',
    driverName: 'Hina S.',
    driverAvatar: '👩‍💻',
    circle: 'uet-lahore',
    circleName: 'UET Students',
    vouchCount: 4,
    car: 'Hyundai Santro',
    carColor: 'Blue',
    carPlate: 'LHR-4422',
    eta: '18 min',
    etaMinutes: 18,
    rating: 4.5,
    seatsAvailable: 2,
    isVerified: false,
    pickupDistance: '2.8 km away',
    priceEstimate: 'PKR 90-130',
    route: {
      pickup: { lat: 33.6700, lng: 73.0500, address: 'I-10 Markaz' },
      dropoff: { lat: 33.6844, lng: 73.0479, address: 'UET Campus' },
    },
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Matches rides based on pickup and dropoff locations
 */
export async function matchRides(
  _pickup: string,
  _dropoff: string,
  _request?: Partial<ScheduleRideRequest>
): Promise<RideMatch[]> {
  // Simulate matching algorithm delay
  await delay(1200);

  // Return all available drivers sorted by ETA (in production, would filter by actual route proximity)
  return MOCK_DRIVERS.sort((a, b) => a.etaMinutes - b.etaMinutes);
}

/**
 * Gets a specific ride match by ID
 */
export async function getRideById(id: string): Promise<RideMatch | null> {
  await delay(300);
  return MOCK_DRIVERS.find(d => d.id === id) || null;
}

/**
 * Books a ride
 */
export async function bookRide(
  rideId: string,
  userId: string
): Promise<{ success: boolean; bookingId: string; message: string }> {
  await delay(800);

  const ride = MOCK_DRIVERS.find(d => d.id === rideId);
  if (!ride) {
    return { success: false, bookingId: '', message: 'Ride not found' };
  }

  return {
    success: true,
    bookingId: `BK${Date.now()}`,
    message: `Ride booked with ${ride.driverName}! She will arrive in ${ride.eta}.`,
  };
}

/**
 * Gets estimated route coordinates for map display
 * Returns interpolated points between pickup and dropoff
 */
export function getRouteCoordinates(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  steps: number = 10
): Array<{ latitude: number; longitude: number }> {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coords.push({
      latitude: pickup.lat + (dropoff.lat - pickup.lat) * t,
      longitude: pickup.lng + (dropoff.lng - pickup.lng) * t,
    });
  }
  return coords;
}

/**
 * Formats rating as stars string
 */
export function formatRating(rating: number): string {
  const stars = Math.floor(rating);
  return '★'.repeat(stars) + (rating % 1 >= 0.5 ? '½' : '');
}
