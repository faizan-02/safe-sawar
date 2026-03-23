import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'ss_auth_state';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleDetails {
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
  registrationDoc?: string; // local file URI
}

export interface User {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  role: 'passenger' | 'carpooler';
  isVerified: boolean;
  biometricVerified: boolean;
  trustCredits: number;
  circles: string[];
  photo?: string;
  // Circle registration
  circleId?: string;
  circleDoc?: string; // local file URI of student/employee ID
  // Carpooler only
  vehicle?: VehicleDetails;
  regularRoute?: { from: string; to: string };
}

export interface Circle {
  id: string;
  name: string;
  institution: string;
  memberCount: number;
  ridesPerDay: number;
  emoji: string;
  isJoined: boolean;
  category: string;
}

export interface RideMatch {
  id: string;
  driverName: string;
  circle: string;
  circleName: string;
  vouchCount: number;
  car: string;
  carColor: string;
  eta: string;
  rating: number;
  pickup: string;
  dropoff: string;
  seatsAvailable: number;
  isVerified: boolean;
}

export interface ActiveRide {
  id: string;
  driverName: string;
  driverPhone: string;
  car: string;
  carColor: string;
  carPlate: string;
  status: 'waiting' | 'enroute' | 'arrived' | 'completed';
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  startedAt?: Date;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  circle?: string;
  isVouched: boolean;
  emoji: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isVerified: boolean;
  verificationStep: number;
  circles: Circle[];
  activeRide: ActiveRide | null;
  contacts: Contact[];
  sosActive: boolean;
  meshNetworkDevices: number;
  isOnline: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────
type AppAction =
  | { type: 'SET_USER';            payload: User }
  | { type: 'UPDATE_USER';         payload: Partial<User> }
  | { type: 'SET_AUTHENTICATED';   payload: boolean }
  | { type: 'HYDRATE';             payload: { user: User | null; isAuthenticated: boolean } }
  | { type: 'LOGOUT' }
  | { type: 'SET_VERIFIED';        payload: boolean }
  | { type: 'SET_VERIFICATION_STEP'; payload: number }
  | { type: 'UPDATE_CIRCLES';      payload: Circle[] }
  | { type: 'JOIN_CIRCLE';         payload: string }
  | { type: 'SET_ACTIVE_RIDE';     payload: ActiveRide | null }
  | { type: 'UPDATE_RIDE_STATUS';  payload: ActiveRide['status'] }
  | { type: 'ACTIVATE_SOS' }
  | { type: 'DEACTIVATE_SOS' }
  | { type: 'SET_MESH_DEVICES';    payload: number }
  | { type: 'SET_ONLINE';          payload: boolean }
  | { type: 'VOUCH_FOR_CONTACT';   payload: string }
  | { type: 'DECREMENT_TRUST_CREDITS' };

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────
const initialCircles: Circle[] = [
  {
    id: 'uet-lahore',
    name: 'UET Lahore',
    institution: 'University of Engineering & Technology',
    memberCount: 240, ridesPerDay: 48, emoji: '🎓', isJoined: false, category: 'University',
  },
  {
    id: 'pims-islamabad',
    name: 'PIMS Islamabad',
    institution: 'Pakistan Institute of Medical Sciences',
    memberCount: 35, ridesPerDay: 35, emoji: '🏥', isJoined: false, category: 'Hospital',
  },
  {
    id: 'comsats-islamabad',
    name: 'Comsats University',
    institution: 'Comsats University Islamabad',
    memberCount: 180, ridesPerDay: 32, emoji: '💻', isJoined: false, category: 'University',
  },
  {
    id: 'aga-khan-hospital',
    name: 'Aga Khan Hospital',
    institution: 'Aga Khan University Hospital',
    memberCount: 55, ridesPerDay: 20, emoji: '⚕️', isJoined: true, category: 'Hospital',
  },
  {
    id: 'quaid-azam-university',
    name: 'Quaid-i-Azam Uni',
    institution: 'Quaid-i-Azam University Islamabad',
    memberCount: 312, ridesPerDay: 60, emoji: '📚', isJoined: false, category: 'University',
  },
  {
    id: 'nust-islamabad',
    name: 'NUST Islamabad',
    institution: 'National University of Sciences & Technology',
    memberCount: 420, ridesPerDay: 75, emoji: '🔬', isJoined: false, category: 'University',
  },
];

const initialContacts: Contact[] = [
  { id: '1', name: 'Sara Ahmed',    phone: '+92 311 2345678', circle: 'PIMS Islamabad',    isVouched: false, emoji: '👩' },
  { id: '2', name: 'Fatima Khan',   phone: '+92 321 9876543', circle: 'NUST Islamabad',    isVouched: true,  emoji: '👩‍💼' },
  { id: '3', name: 'Amina Malik',   phone: '+92 333 1122334', circle: 'Comsats University', isVouched: false, emoji: '👩‍🎓' },
  { id: '4', name: 'Zara Hussain',  phone: '+92 345 5544332',                               isVouched: false, emoji: '👩‍⚕️' },
  { id: '5', name: 'Nadia Iqbal',   phone: '+92 312 7788990', circle: 'UET Lahore',        isVouched: false, emoji: '🧕' },
  { id: '6', name: 'Hina Butt',     phone: '+92 300 4433221', circle: 'Aga Khan Hospital', isVouched: false, emoji: '👩‍💻' },
  { id: '7', name: 'Rabia Siddiqui',phone: '+92 322 6677889',                               isVouched: false, emoji: '🧑‍🔬' },
];

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isVerified: false,
  verificationStep: 0,
  circles: initialCircles,
  activeRide: null,
  contacts: initialContacts,
  sosActive: false,
  meshNetworkDevices: 3,
  isOnline: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : state.user,
      };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'HYDRATE':
      return { ...state, user: action.payload.user, isAuthenticated: action.payload.isAuthenticated, isHydrated: true };

    case 'LOGOUT':
      return { ...initialState, isHydrated: true, circles: state.circles };

    case 'SET_VERIFIED':
      return { ...state, isVerified: action.payload };

    case 'SET_VERIFICATION_STEP':
      return { ...state, verificationStep: action.payload };

    case 'UPDATE_CIRCLES':
      return { ...state, circles: action.payload };

    case 'JOIN_CIRCLE':
      return {
        ...state,
        circles: state.circles.map(c =>
          c.id === action.payload ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c
        ),
        user: state.user
          ? { ...state.user, circles: [...state.user.circles, action.payload] }
          : state.user,
      };

    case 'SET_ACTIVE_RIDE':
      return { ...state, activeRide: action.payload };

    case 'UPDATE_RIDE_STATUS':
      return state.activeRide
        ? { ...state, activeRide: { ...state.activeRide, status: action.payload } }
        : state;

    case 'ACTIVATE_SOS':   return { ...state, sosActive: true };
    case 'DEACTIVATE_SOS': return { ...state, sosActive: false };

    case 'SET_MESH_DEVICES': return { ...state, meshNetworkDevices: action.payload };
    case 'SET_ONLINE':       return { ...state, isOnline: action.payload };

    case 'VOUCH_FOR_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map(c =>
          c.id === action.payload ? { ...c, isVouched: true } : c
        ),
      };

    case 'DECREMENT_TRUST_CREDITS':
      return {
        ...state,
        user: state.user
          ? { ...state.user, trustCredits: Math.max(0, state.user.trustCredits - 1) }
          : state.user,
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted session on startup
  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const { user, isAuthenticated } = JSON.parse(raw);
          dispatch({ type: 'HYDRATE', payload: { user: user ?? null, isAuthenticated: !!isAuthenticated } });
        } else {
          dispatch({ type: 'HYDRATE', payload: { user: null, isAuthenticated: false } });
        }
      })
      .catch(() => {
        dispatch({ type: 'HYDRATE', payload: { user: null, isAuthenticated: false } });
      });
  }, []);

  // Persist session whenever user or auth state changes
  useEffect(() => {
    if (!state.isHydrated) return;
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    })).catch(() => {});
  }, [state.user, state.isAuthenticated, state.isHydrated]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
