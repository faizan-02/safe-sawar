import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import RideMatchCard from '../components/RideMatchCard';
import { matchRides, RideMatch, bookRide } from '../services/rideMatchingService';
import { useAppStore } from '../store/appStore';

// ── Nominatim geocoding (OpenStreetMap, free, no API key) ─────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocode(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json` +
      `&countrycodes=pk&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SafeSawar/1.0 (carpooling app)' },
    });
    const data: NominatimResult[] = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
  } catch {
    return null;
  }
}

async function autocomplete(query: string): Promise<string[]> {
  if (query.length < 3) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json` +
      `&countrycodes=pk&limit=5&addressdetails=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SafeSawar/1.0 (carpooling app)' },
    });
    const data: NominatimResult[] = await res.json();
    // Return shortened display names (first two comma-separated parts)
    return data.map(d => d.display_name.split(',').slice(0, 2).join(',').trim());
  } catch {
    return [];
  }
}

// ── Fallback suggestions shown before the user has typed ──────────────────────

const POPULAR_LOCATIONS = [
  'F-10 Markaz, Islamabad',
  'Blue Area, Islamabad',
  'G-9 Markaz, Islamabad',
  'PIMS Hospital, Islamabad',
  'NUST H-12, Islamabad',
  'Quaid-i-Azam University, Islamabad',
  'COMSATS University, Islamabad',
  'I-8 Markaz, Islamabad',
  'F-6 Super Market, Islamabad',
  'Centaurus Mall, Islamabad',
];


// ── Component ──────────────────────────────────────────────────────────────────

export default function ScheduleRideScreen({ navigation }: any) {
  const { state, dispatch } = useAppStore();

  // Location inputs
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Autocomplete
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([]);
  const [showPickupSugg, setShowPickupSugg] = useState(false);
  const [showDropoffSugg, setShowDropoffSugg] = useState(false);
  const pickupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search & results
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [departureTime, setDepartureTime] = useState('Now');

    // User location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // ── Get real user location on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        // ignore
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // ── Debounced Nominatim autocomplete ───────────────────────────────────────
  const onPickupChange = (text: string) => {
    setPickup(text);
    setPickupCoords(null); // coords stale when text changes
    setShowPickupSugg(true);
    if (pickupTimer.current) clearTimeout(pickupTimer.current);
    if (text.length >= 3) {
      pickupTimer.current = setTimeout(async () => {
        const results = await autocomplete(text);
        setPickupSuggestions(results.length > 0 ? results : POPULAR_LOCATIONS.filter(l =>
          l.toLowerCase().includes(text.toLowerCase())
        ));
      }, 500);
    } else {
      setPickupSuggestions(POPULAR_LOCATIONS.filter(l =>
        text.length > 0 && l.toLowerCase().includes(text.toLowerCase())
      ));
    }
  };

  const onDropoffChange = (text: string) => {
    setDropoff(text);
    setDropoffCoords(null);
    setShowDropoffSugg(true);
    if (dropoffTimer.current) clearTimeout(dropoffTimer.current);
    if (text.length >= 3) {
      dropoffTimer.current = setTimeout(async () => {
        const results = await autocomplete(text);
        setDropoffSuggestions(results.length > 0 ? results : POPULAR_LOCATIONS.filter(l =>
          l.toLowerCase().includes(text.toLowerCase())
        ));
      }, 500);
    } else {
      setDropoffSuggestions(POPULAR_LOCATIONS.filter(l =>
        text.length > 0 && l.toLowerCase().includes(text.toLowerCase())
      ));
    }
  };

  // When user picks a suggestion: geocode it and pin the marker
  const selectPickup = async (label: string) => {
    setPickup(label);
    setShowPickupSugg(false);
    const coords = await geocode(label);
    if (coords) {
      setPickupCoords(coords);
      panToFit(coords, dropoffCoords);
    }
  };

  const selectDropoff = async (label: string) => {
    setDropoff(label);
    setShowDropoffSugg(false);
    const coords = await geocode(label);
    if (coords) {
      setDropoffCoords(coords);
      panToFit(pickupCoords, coords);
    }
  };

  const panToFit = (_p: any, _d: any) => {}; // no-op without map

  // ── Search for ride matches ─────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Info', 'Please enter both pickup and drop-off locations.');
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      // Geocode if not done yet (user typed without picking suggestion)
      let pCoords = pickupCoords;
      let dCoords = dropoffCoords;
      if (!pCoords) { pCoords = await geocode(pickup); if (pCoords) setPickupCoords(pCoords); }
      if (!dCoords) { dCoords = await geocode(dropoff); if (dCoords) setDropoffCoords(dCoords); }

      if (pCoords && dCoords) panToFit(pCoords, dCoords);

      const results = await matchRides(pickup, dropoff);
      setMatches(results);
    } catch {
      Alert.alert('Error', 'Could not find matches. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [pickup, dropoff, pickupCoords, dropoffCoords]);

  // ── Book a ride ────────────────────────────────────────────────────────────
  const handleBook = useCallback(async (match: RideMatch) => {
    Alert.alert(
      `Book with ${match.driverName}?`,
      `${match.car} (${match.carColor})\nETA: ${match.eta}\nEstimated: ${match.priceEstimate}\n\n${match.vouchCount} women have vouched for her.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: async () => {
            const result = await bookRide(match.id, 'current_user');
            if (result.success) {
              dispatch({
                type: 'SET_ACTIVE_RIDE',
                payload: {
                  id: result.bookingId,
                  driverName: match.driverName,
                  driverPhone: '+92 300 0000000',
                  car: match.car,
                  carColor: match.carColor,
                  carPlate: match.carPlate,
                  status: 'waiting',
                  pickupLocation: {
                    lat: pickupCoords?.lat ?? match.route.pickup.lat,
                    lng: pickupCoords?.lng ?? match.route.pickup.lng,
                    address: pickup,
                  },
                  dropoffLocation: {
                    lat: dropoffCoords?.lat ?? match.route.dropoff.lat,
                    lng: dropoffCoords?.lng ?? match.route.dropoff.lng,
                    address: dropoff,
                  },
                },
              });
              navigation.navigate('RideInProgress');
            }
          },
        },
      ]
    );
  }, [pickup, dropoff, pickupCoords, dropoffCoords, dispatch, navigation]);


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule a Ride</Text>
        <Text style={styles.headerSubtitle}>Find verified women going your way</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Location status card */}
        <View style={styles.locationCard}>
          <View style={styles.locationCardRow}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="navigate-circle" size={22} color={Colors.primary} />
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.locationCardTitle}>
                {locationLoading ? 'Getting your location...' : userLocation ? 'Location detected' : 'Location unavailable'}
              </Text>
              <Text style={styles.locationCardSub}>
                {userLocation
                  ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                  : 'Enable location permission for better results'}
              </Text>
            </View>
          </View>
          {pickupCoords && dropoffCoords && (
            <View style={styles.routePreview}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <View style={[styles.routeDot, { backgroundColor: Colors.verified }]} />
              <Text style={styles.routePreviewText}>Route ready</Text>
            </View>
          )}
        </View>

        {/* Input card */}
        <View style={styles.inputsCard}>
          {/* Pickup */}
          <View style={styles.locationRow}>
            <View style={styles.dotIndicator}>
              <View style={styles.dotPickup} />
              <View style={styles.dotLine} />
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.locationInput}
                placeholder="Pickup location"
                placeholderTextColor={Colors.textMuted}
                value={pickup}
                onChangeText={onPickupChange}
                onFocus={() => setShowPickupSugg(true)}
                onBlur={() => setTimeout(() => setShowPickupSugg(false), 200)}
              />
              {pickup ? (
                <TouchableOpacity onPress={() => { setPickup(''); setPickupCoords(null); }}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {showPickupSugg && pickupSuggestions.length > 0 && (
            <ScrollView style={styles.suggestions} nestedScrollEnabled>
              {pickupSuggestions.slice(0, 5).map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => selectPickup(s)}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputDivider} />

          {/* Drop-off */}
          <View style={styles.locationRow}>
            <View style={styles.dotIndicator}>
              <View style={styles.dotDropoff} />
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.locationInput}
                placeholder="Drop-off location"
                placeholderTextColor={Colors.textMuted}
                value={dropoff}
                onChangeText={onDropoffChange}
                onFocus={() => setShowDropoffSugg(true)}
                onBlur={() => setTimeout(() => setShowDropoffSugg(false), 200)}
              />
              {dropoff ? (
                <TouchableOpacity onPress={() => { setDropoff(''); setDropoffCoords(null); }}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {showDropoffSugg && dropoffSuggestions.length > 0 && (
            <ScrollView style={styles.suggestions} nestedScrollEnabled>
              {dropoffSuggestions.slice(0, 5).map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => selectDropoff(s)}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Time selector */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={styles.timeLabel}>Depart:</Text>
            {['Now', 'In 30 min', 'In 1 hr', 'Custom'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, departureTime === t && styles.timeChipActive]}
                onPress={() => setDepartureTime(t)}
              >
                <Text style={[styles.timeChipText, departureTime === t && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search button */}
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <ActivityIndicator color={Colors.textPrimary} size="small" />
                <Text style={styles.searchButtonText}>Finding SheRahs...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={18} color={Colors.textPrimary} />
                <Text style={styles.searchButtonText}>Find Matching SheRahs</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {isSearching ? 'Searching...' : `Matching SheRahs (${matches.length})`}
              </Text>
              {!isSearching && matches.length > 0 && (
                <Text style={styles.resultsSubtitle}>Sorted by ETA</Text>
              )}
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Matching routes in your area...</Text>
              </View>
            ) : matches.length > 0 ? (
              matches.map(match => (
                <RideMatchCard key={match.id} match={match} onBook={handleBook} />
              ))
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsEmoji}>🚗</Text>
                <Text style={styles.noResultsTitle}>No matches found</Text>
                <Text style={styles.noResultsText}>
                  Try different locations or check back later
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '500' },
  scrollContent: { paddingBottom: 40 },

  locationCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  locationCardRow: { flexDirection: 'row', alignItems: 'center' },
  locationCardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  locationCardSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  routePreview: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  routeLine: { flex: 1, height: 2, backgroundColor: Colors.primary, opacity: 0.4 },
  routePreviewText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

  inputsCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotIndicator: { width: 20, alignItems: 'center' },
  dotPickup: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: Colors.primaryLight,
  },
  dotDropoff: { width: 12, height: 12, borderRadius: 3, backgroundColor: Colors.verified },
  dotLine: { width: 2, height: 20, backgroundColor: Colors.border, marginTop: 4 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  locationInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 10 },
  inputDivider: {
    height: 1, backgroundColor: Colors.border, marginLeft: 30, marginVertical: 4,
  },
  suggestions: {
    maxHeight: 160,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 8,
    marginLeft: 30,
    marginTop: 4,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  timeLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  timeChipText: { color: Colors.textMuted, fontSize: 12 },
  timeChipTextActive: { color: Colors.primary, fontWeight: '700' },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  searchButtonDisabled: { opacity: 0.7 },
  searchButtonText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },

  resultsSection: { paddingHorizontal: 20 },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  resultsTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  resultsSubtitle: { color: Colors.textMuted, fontSize: 12 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  noResults: { alignItems: 'center', paddingVertical: 40 },
  noResultsEmoji: { fontSize: 48, marginBottom: 12 },
  noResultsTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  noResultsText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
});
