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
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import RideMatchCard from '../components/RideMatchCard';
import { matchRides, RideMatch, getRouteCoordinates } from '../services/rideMatchingService';
import { useAppStore } from '../store/appStore';
import { bookRide } from '../services/rideMatchingService';

const ISLAMABAD_REGION = {
  latitude: 33.6844,
  longitude: 73.0479,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const POPULAR_LOCATIONS = [
  'F-10 Markaz, Islamabad',
  'Blue Area, Islamabad',
  'G-9 Markaz, Islamabad',
  'PIMS Hospital, Islamabad',
  'NUST H-12, Islamabad',
  'Quaid-i-Azam University',
  'Comsats University, Islamabad',
  'I-8 Markaz, Islamabad',
  'F-6 Super Market',
  'Centaurus Mall, Islamabad',
];

export default function ScheduleRideScreen({ navigation }: any) {
  const { state, dispatch } = useAppStore();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [departureTime, setDepartureTime] = useState('Now');
  const mapRef = useRef<MapView>(null);

  const routeCoordinates = getRouteCoordinates(
    { lat: 33.7294, lng: 73.0931 },
    { lat: 33.6938, lng: 73.0652 }
  );

  const handleSearch = useCallback(async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Info', 'Please enter both pickup and drop-off locations.');
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await matchRides(pickup, dropoff);
      setMatches(results);
    } catch {
      Alert.alert('Error', 'Could not find matches. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [pickup, dropoff]);

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
                    lat: match.route.pickup.lat,
                    lng: match.route.pickup.lng,
                    address: pickup,
                  },
                  dropoffLocation: {
                    lat: match.route.dropoff.lat,
                    lng: match.route.dropoff.lng,
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
  }, [pickup, dropoff, dispatch, navigation]);

  const pickupSuggestions = POPULAR_LOCATIONS.filter(loc =>
    pickup.length > 0 && loc.toLowerCase().includes(pickup.toLowerCase())
  );
  const dropoffSuggestions = POPULAR_LOCATIONS.filter(loc =>
    dropoff.length > 0 && loc.toLowerCase().includes(dropoff.toLowerCase())
  );

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
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={ISLAMABAD_REGION}
            showsUserLocation
            showsMyLocationButton={false}
            customMapStyle={mapStyle}
          >
            {/* Route polyline */}
            {hasSearched && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={Colors.routeColor}
                strokeWidth={3}
                lineDashPattern={[0]}
              />
            )}

            {/* Islamabad center marker */}
            <Marker
              coordinate={{ latitude: 33.7294, longitude: 73.0931 }}
              title="Pickup Area"
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="location" size={14} color="white" />
                </View>
              </View>
            </Marker>
            <Marker
              coordinate={{ latitude: 33.6938, longitude: 73.0652 }}
              title="Drop-off Area"
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: Colors.verified }]}>
                  <Ionicons name="flag" size={12} color="white" />
                </View>
              </View>
            </Marker>
          </MapView>

          {/* Map overlay: city label */}
          <View style={styles.mapLabel}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.mapLabelText}>Islamabad, Pakistan</Text>
          </View>
        </View>

        {/* Ride inputs */}
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
                onChangeText={(t) => {
                  setPickup(t);
                  setShowPickupSuggestions(true);
                }}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
              />
              {pickup ? (
                <TouchableOpacity onPress={() => setPickup('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <ScrollView style={styles.suggestions} nestedScrollEnabled>
              {pickupSuggestions.slice(0, 4).map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setPickup(s);
                    setShowPickupSuggestions(false);
                  }}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputDivider} />

          {/* Dropoff */}
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
                onChangeText={(t) => {
                  setDropoff(t);
                  setShowDropoffSuggestions(true);
                }}
                onFocus={() => setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
              />
              {dropoff ? (
                <TouchableOpacity onPress={() => setDropoff('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
            <ScrollView style={styles.suggestions} nestedScrollEnabled>
              {dropoffSuggestions.slice(0, 4).map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDropoff(s);
                    setShowDropoffSuggestions(false);
                  }}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.suggestionText}>{s}</Text>
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

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a0010' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d4a0c0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a0010' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#3d0022' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#4a0028' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d001a' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  mapLabelText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  inputsCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotIndicator: {
    width: 20,
    alignItems: 'center',
  },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  dotDropoff: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.verified,
  },
  dotLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  inputDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 30,
    marginVertical: 4,
  },
  suggestions: {
    maxHeight: 140,
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
  suggestionText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  timeLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  timeChipText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  timeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
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
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  resultsSection: {
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  resultsSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  noResultsText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
