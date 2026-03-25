import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import SOSButton from '../components/SOSButton';
import MeshNetworkStatus from '../components/MeshNetworkStatus';
import { useAppStore } from '../store/appStore';
import { getRouteCoordinates } from '../services/rideMatchingService';

const MOCK_RIDE_FEMALE = {
  driverName: 'Ayesha K.',
  driverAvatar: '👩‍⚕️',
  driverPhone: '+92 300 1234567',
  car: 'Toyota Aqua',
  carColor: 'White',
  carPlate: 'ISB-2024',
  circle: 'PIMS Islamabad',
  vouchCount: 12,
  rating: 4.9,
  eta: '4 min',
  pickup: { lat: 33.7294, lng: 73.0931, address: 'F-10 Markaz' },
  dropoff: { lat: 33.6938, lng: 73.0652, address: 'PIMS Hospital' },
};

const MOCK_RIDE_MALE = {
  driverName: 'Ahmed K.',
  driverAvatar: '👨‍⚕️',
  driverPhone: '+92 300 1234567',
  car: 'Honda Civic',
  carColor: 'Black',
  carPlate: 'LHR-4521',
  circle: 'NUST Islamabad',
  vouchCount: 9,
  rating: 4.8,
  eta: '5 min',
  pickup: { lat: 33.7294, lng: 73.0931, address: 'F-10 Markaz' },
  dropoff: { lat: 33.6938, lng: 73.0652, address: 'NUST H-12' },
};

// Simulated driver location moving along route
function useDriverLocation(
  route: Array<{ latitude: number; longitude: number }>,
  isActive: boolean
) {
  const [driverIndex, setDriverIndex] = useState(0);

  useEffect(() => {
    if (!isActive || route.length === 0) return;
    const interval = setInterval(() => {
      setDriverIndex(prev => {
        if (prev < route.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isActive, route.length]);

  return route[driverIndex] || route[0];
}

export default function RideInProgressScreen({ navigation }: any) {
  const C = useTheme();
  const { state, dispatch } = useAppStore();
  const isMale = state.selectedGender === 'male';
  const MOCK_RIDE = isMale ? MOCK_RIDE_MALE : MOCK_RIDE_FEMALE;
  const [rideStatus, setRideStatus] = useState<'waiting' | 'enroute' | 'arrived' | 'completed'>('waiting');
  const [elapsedTime, setElapsedTime] = useState(0);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);

  const ride = state.activeRide || MOCK_RIDE as any;

  const routeCoords = getRouteCoordinates(
    { lat: MOCK_RIDE.pickup.lat, lng: MOCK_RIDE.pickup.lng },
    { lat: MOCK_RIDE.dropoff.lat, lng: MOCK_RIDE.dropoff.lng },
    20
  );

  const driverLocation = useDriverLocation(routeCoords, rideStatus === 'enroute');

  // Animate bottom sheet in
  useEffect(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Simulate ride progression
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setRideStatus('enroute'), 4000));
    timers.push(setTimeout(() => setRideStatus('arrived'), 30000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    if (rideStatus !== 'enroute') return;
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [rideStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleShareRide = useCallback(() => {
    Alert.alert(
      'Share Ride Details',
      'Your live ride details have been shared with your emergency contacts:\n\n• Sara Ahmed (+92 311 2345678)\n• Fatima Khan (+92 321 9876543)\n\nThey can track your journey in real-time.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleCallDriver = useCallback(() => {
    const phone = `tel:${MOCK_RIDE.driverPhone.replace(/\s/g, '')}`;
    Linking.openURL(phone).catch(() => {
      Alert.alert('Call', `Calling ${MOCK_RIDE.driverName} at ${MOCK_RIDE.driverPhone}`);
    });
  }, []);

  const handleEndRide = useCallback(() => {
    Alert.alert(
      'End Ride?',
      'Are you sure you want to end the ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'SET_ACTIVE_RIDE', payload: null });
            navigation.goBack();
          },
        },
      ]
    );
  }, [dispatch, navigation]);

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'waiting': return Colors.warning;
      case 'enroute': return Colors.primary;
      case 'arrived': return Colors.verified;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'waiting': return `${MOCK_RIDE.driverName} is on her way • ${MOCK_RIDE.eta}`;
      case 'enroute': return `Ride in progress • ${formatTime(elapsedTime)} elapsed`;
      case 'arrived': return 'You have arrived at your destination';
      default: return '';
    }
  };

  const bottomSheetTranslate = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: (MOCK_RIDE.pickup.lat + MOCK_RIDE.dropoff.lat) / 2,
          longitude: (MOCK_RIDE.pickup.lng + MOCK_RIDE.dropoff.lng) / 2,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        customMapStyle={mapStyle}
      >
        {/* Route */}
        <Polyline
          coordinates={routeCoords}
          strokeColor={Colors.routeColor}
          strokeWidth={4}
          lineDashPattern={[0]}
        />

        {/* Pickup marker */}
        <Marker coordinate={{ latitude: MOCK_RIDE.pickup.lat, longitude: MOCK_RIDE.pickup.lng }}>
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
              <Ionicons name="person" size={12} color="white" />
            </View>
            <View style={styles.markerTail} />
          </View>
        </Marker>

        {/* Dropoff marker */}
        <Marker coordinate={{ latitude: MOCK_RIDE.dropoff.lat, longitude: MOCK_RIDE.dropoff.lng }}>
          <View style={styles.markerContainer}>
            <View style={[styles.marker, { backgroundColor: Colors.verified }]}>
              <Ionicons name="flag" size={12} color="white" />
            </View>
            <View style={[styles.markerTail, { backgroundColor: Colors.verified }]} />
          </View>
        </Marker>

        {/* Driver marker (animated) */}
        {driverLocation && (
          <Marker coordinate={driverLocation} title={MOCK_RIDE.driverName}>
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerEmoji}>{MOCK_RIDE.driverAvatar}</Text>
              <View style={styles.driverMarkerBadge}>
                <Ionicons name="car" size={8} color="#fff" />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor() + '25', borderColor: getStatusColor() }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: bottomSheetTranslate }] },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Driver info */}
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarEmoji}>{MOCK_RIDE.driverAvatar}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={8} color="#fff" />
              </View>
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{MOCK_RIDE.driverName}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFB300" />
                  <Text style={styles.ratingText}>{MOCK_RIDE.rating}</Text>
                </View>
              </View>

              <Text style={styles.carInfo}>
                {MOCK_RIDE.car} • {MOCK_RIDE.carColor} • {MOCK_RIDE.carPlate}
              </Text>

              <View style={styles.circleBadge}>
                <Ionicons name="shield-checkmark" size={10} color={Colors.verified} />
                <Text style={styles.circleBadgeText}>{MOCK_RIDE.circle}</Text>
                <Text style={styles.vouchText}>• Vouched by {MOCK_RIDE.vouchCount}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Route info */}
          <View style={styles.routeInfo}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.routeText} numberOfLines={1}>{MOCK_RIDE.pickup.address}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, { backgroundColor: Colors.verified }]} />
              <Text style={styles.routeText} numberOfLines={1}>{MOCK_RIDE.dropoff.address}</Text>
            </View>
          </View>

          {/* Mesh network status */}
          <View style={styles.meshContainer}>
            <MeshNetworkStatus />
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareRide}>
              <Ionicons name="share-social" size={16} color="#fff" />
              <Text style={styles.shareButtonText}>Share Ride Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endButton} onPress={handleEndRide}>
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          </View>

          {/* SOS Section */}
          <View style={styles.sosSection}>
            <SOSButton large location={{ lat: MOCK_RIDE.pickup.lat, lng: MOCK_RIDE.pickup.lng }} />
            <Text style={styles.sosHelperText}>
              Press & hold for Emergency SOS
            </Text>
            <Text style={styles.sosMeshText}>
              🔗 Mesh Network SOS Active (Offline Protection)
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a0010' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d4a0c0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a0010' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3d0022' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#4a0028' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d001a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingHorizontal: 20,
    maxHeight: '55%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginVertical: 12,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  driverAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  driverAvatarEmoji: {
    fontSize: 36,
    lineHeight: 48,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
    gap: 3,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: '700',
  },
  carInfo: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  circleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circleBadgeText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '600',
  },
  vouchText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfo: {
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 3,
  },
  routeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  meshContainer: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondaryDark,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  endButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sosSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  sosHelperText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  sosMeshText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: '600',
  },
  // Markers
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
  markerTail: {
    width: 4,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  driverMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerEmoji: {
    fontSize: 32,
  },
  driverMarkerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
