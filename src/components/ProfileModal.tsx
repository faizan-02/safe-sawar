import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeContext';

const { height } = Dimensions.get('window');

interface MenuItem {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function ProfileModal({ visible, onClose, navigation }: Props) {
  const C = useTheme();
  const { state, dispatch } = useAppStore();
  const isMale = state.selectedGender === 'male';
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const user = state.user;
  const isDriver = user?.role === 'carpooler';
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : isDriver ? 'D' : 'P';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      AsyncStorage.removeItem('ss_auth_state').catch(() => {});
      dispatch({ type: 'LOGOUT' });
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }, 300);
  };

  const navigate = (screen: string) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 300);
  };

  const passengerItems: MenuItem[] = [
    {
      icon: 'car',
      label: 'Schedule a Ride',
      sub: isMale ? 'Find verified men going your way' : 'Find verified women going your way',
      onPress: () => navigate('ScheduleRide'),
    },
    {
      icon: 'car-outline',
      label: 'My Rides',
      sub: 'View your ride history',
      onPress: () => navigate('MyRides'),
    },
    {
      icon: 'people',
      label: 'My Circles',
      sub: 'Your trusted institution groups',
      onPress: () => navigate('Circles'),
      badge: state.circles.filter(c => c.isJoined).length.toString(),
    },
    {
      icon: 'heart',
      label: 'Vouch a Friend',
      sub: 'Build the trust network',
      onPress: () => navigate('Vouch'),
      badge: `${user?.trustCredits ?? 5} credits`,
    },
    {
      icon: 'shield-checkmark',
      label: 'Verification Status',
      sub: user?.isVerified ? 'NADRA Verified ✓' : 'Pending verification',
      onPress: () => {},
      color: user?.isVerified ? Colors.verified : Colors.warning,
    },
  ];

  const carpoolerItems: MenuItem[] = [
    {
      icon: 'grid',
      label: 'Dashboard',
      sub: 'Manage rides and requests',
      onPress: () => navigate('Dashboard'),
    },
    {
      icon: 'car-outline',
      label: 'My Rides',
      sub: 'Rides offered and history',
      onPress: () => navigate('MyRides'),
    },
    {
      icon: 'cash',
      label: 'Earnings',
      sub: 'View income and withdraw',
      onPress: () => navigate('Earnings'),
    },
    {
      icon: 'people',
      label: 'My Circles',
      sub: 'Your institution community',
      onPress: () => navigate('Circles'),
      badge: state.circles.filter(c => c.isJoined).length.toString(),
    },
    {
      icon: 'car-sport',
      label: 'My Vehicle',
      sub: user?.vehicle ? `${user.vehicle.make} ${user.vehicle.model}` : 'No vehicle added',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark',
      label: 'Verification Status',
      sub: user?.isVerified ? 'NADRA Verified ✓' : 'Pending verification',
      onPress: () => {},
      color: user?.isVerified ? Colors.verified : Colors.warning,
    },
  ];

  const menuItems = isDriver ? carpoolerItems : passengerItems;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar barStyle={C.isDark ? "light-content" : "dark-content"} backgroundColor={C.background} />

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: C.cardBackground, borderColor: C.border, transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initials}</Text>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || 'No phone set'}</Text>
            <View style={styles.rolePill}>
              <Ionicons
                name={isDriver ? 'car' : 'person'}
                size={11}
                color={isDriver ? '#9C27B0' : Colors.primary}
              />
              <Text style={[styles.roleText, { color: isDriver ? '#9C27B0' : Colors.primary }]}>
                {isDriver ? 'Carpooler' : 'Passenger'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Trust credits bar (passenger only) */}
        {!isDriver && (
          <View style={styles.creditsBar}>
            <Ionicons name="star" size={14} color="#FFB300" />
            <Text style={styles.creditsText}>Trust Credits</Text>
            <View style={styles.creditsDots}>
              {[1, 2, 3, 4, 5].map(i => (
                <View
                  key={i}
                  style={[styles.creditDot, i <= (user?.trustCredits ?? 5) && styles.creditDotFilled]}
                />
              ))}
            </View>
            <Text style={styles.creditsCount}>{user?.trustCredits ?? 5}/5</Text>
          </View>
        )}

        {/* Menu items */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
              <View style={[styles.menuIcon, { backgroundColor: (item.color ?? Colors.primary) + '18' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color ?? Colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
              </View>
              {item.badge ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* ── Appearance ──────────────────────────────────────────────── */}
          <View style={styles.appearanceSection}>
            <View style={styles.appearanceHeader}>
              <View style={[styles.menuIcon, { backgroundColor: C.primary + '18' }]}>
                <Ionicons name="contrast-outline" size={20} color={C.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: C.textPrimary }]}>Appearance</Text>
                <Text style={styles.menuSub}>Choose your preferred theme</Text>
              </View>
            </View>
            <View style={styles.themeToggleRow}>
              {(['system', 'light', 'dark'] as const).map((mode) => {
                const isActive = state.themeMode === mode;
                const icon = mode === 'system' ? 'phone-portrait-outline' : mode === 'light' ? 'sunny-outline' : 'moon-outline';
                const label = mode === 'system' ? 'Auto' : mode === 'light' ? 'Light' : 'Dark';
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeBtn,
                      isActive && { backgroundColor: C.primary, borderColor: C.primary },
                    ]}
                    onPress={() => dispatch({ type: 'SET_THEME_MODE', payload: mode })}
                  >
                    <Ionicons name={icon as any} size={16} color={isActive ? '#fff' : C.textMuted} />
                    <Text style={[styles.themeBtnText, isActive && { color: '#fff' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: '#e5393520' }]}>
              <Ionicons name="log-out-outline" size={20} color="#e53935" />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  avatarLarge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.borderStrong,
    position: 'relative',
  },
  avatarLargeText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  verifiedBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.verified,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.background,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  profilePhone: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  creditsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  creditsText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  creditsDots: { flexDirection: 'row', gap: 4, flex: 1 },
  creditDot: { width: 16, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  creditDotFilled: { backgroundColor: '#FFB300' },
  creditsCount: { color: '#FFB300', fontSize: 12, fontWeight: '700' },

  menuList: { paddingHorizontal: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  menuSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badgePill: {
    backgroundColor: Colors.primaryGlow, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#e53935' },

  // Appearance
  appearanceSection: { paddingVertical: 10 },
  appearanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  themeToggleRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceBackground,
  },
  themeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
});
