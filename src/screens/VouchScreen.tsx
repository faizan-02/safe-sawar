import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { useAppStore, Contact } from '../store/appStore';

function ContactRow({
  contact,
  onVouch,
  trustCredits,
}: {
  contact: Contact;
  onVouch: (contact: Contact) => void;
  trustCredits: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const vouchAnim = useRef(new Animated.Value(0)).current;

  const handleVouch = () => {
    if (contact.isVouched) return;
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onVouch(contact);
  };

  return (
    <Animated.View style={[styles.contactRow, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.contactAvatarContainer}>
        <Text style={styles.contactAvatar}>{contact.emoji}</Text>
        {contact.isVouched && (
          <View style={styles.vouchedBadge}>
            <Ionicons name="checkmark" size={8} color={Colors.textPrimary} />
          </View>
        )}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        {contact.circle && (
          <View style={styles.contactCircleBadge}>
            <Ionicons name="shield-checkmark" size={9} color={Colors.primary} />
            <Text style={styles.contactCircleText}>{contact.circle}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.vouchButton,
          contact.isVouched && styles.vouchedButton,
          !contact.isVouched && trustCredits === 0 && styles.vouchButtonDisabled,
        ]}
        onPress={handleVouch}
        disabled={contact.isVouched || trustCredits === 0}
      >
        {contact.isVouched ? (
          <>
            <Ionicons name="checkmark-circle" size={14} color={Colors.verified} />
            <Text style={styles.vouchedText}>Vouched</Text>
          </>
        ) : trustCredits === 0 ? (
          <Text style={styles.vouchButtonDisabledText}>No Credits</Text>
        ) : (
          <>
            <Ionicons name="heart" size={14} color={Colors.textPrimary} />
            <Text style={styles.vouchButtonText}>Vouch</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function VouchScreen() {
  const { state, dispatch } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVouching, setIsVouching] = useState(false);
  const [confirmContact, setConfirmContact] = useState<Contact | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const trustCredits = state.user?.trustCredits ?? 5;

  const filteredContacts = state.contacts.filter(contact => {
    if (!searchQuery) return true;
    return (
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
    );
  });

  const handleVouchPress = useCallback((contact: Contact) => {
    if (trustCredits === 0) {
      Alert.alert(
        'No Trust Credits',
        'You have used all your Trust Credits. Earn more by completing rides and being vouched by others.',
        [{ text: 'OK' }]
      );
      return;
    }
    setConfirmContact(contact);
    setShowConfirmModal(true);
  }, [trustCredits]);

  const confirmVouch = useCallback(async () => {
    if (!confirmContact) return;
    setShowConfirmModal(false);
    setIsVouching(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    dispatch({ type: 'VOUCH_FOR_CONTACT', payload: confirmContact.id });
    dispatch({ type: 'DECREMENT_TRUST_CREDITS' });
    setIsVouching(false);

    Alert.alert(
      'Vouched! 🎉',
      `You've vouched for ${confirmContact.name}. She can now join your circles and be visible to other trusted women in your network.\n\nTrust Credits remaining: ${trustCredits - 1}`,
      [{ text: 'Great!' }]
    );
  }, [confirmContact, dispatch, trustCredits]);

  const vouchedCount = state.contacts.filter(c => c.isVouched).length;

  const creditColor = trustCredits === 0
    ? Colors.error
    : trustCredits <= 2
    ? Colors.warning
    : Colors.verified;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vouch for Friends</Text>
          <Text style={styles.headerSubtitle}>Build trusted networks of women</Text>
        </View>
      </View>

      {/* Trust credits banner */}
      <View style={[styles.creditsBanner, { borderColor: creditColor + '50' }]}>
        <View style={[styles.creditsCircle, { backgroundColor: creditColor + '15' }]}>
          <Text style={[styles.creditsNumber, { color: creditColor }]}>{trustCredits}</Text>
        </View>
        <View style={styles.creditsInfo}>
          <Text style={styles.creditsTitle}>Trust Credits Remaining</Text>
          <Text style={styles.creditsSubtitle}>
            {trustCredits > 0
              ? `You can vouch for ${trustCredits} more woman${trustCredits > 1 ? 'en' : ''}`
              : 'Complete rides to earn more credits'}
          </Text>
        </View>
        <View style={styles.creditsHelp}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'About Trust Credits',
                'Trust Credits are used to vouch for other women in the network.\n\n• You start with 5 credits\n• Earn more by completing rides\n• Earn more when others vouch for you\n• Credits cannot be purchased'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{vouchedCount}</Text>
          <Text style={styles.statLabel}>Women Vouched</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{state.contacts.length}</Text>
          <Text style={styles.statLabel}>Contacts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {state.contacts.filter(c => c.circle).length}
          </Text>
          <Text style={styles.statLabel}>In Circles</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts by name or phone..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
        <Text style={styles.infoText}>
          Vouching confirms you personally know and trust this woman in real life.
        </Text>
      </View>

      {/* Contact list */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ContactRow
            contact={item}
            onVouch={handleVouchPress}
            trustCredits={trustCredits}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No contacts found</Text>
            <Text style={styles.emptyText}>Try a different search</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            <TouchableOpacity style={styles.inviteButton}>
              <Ionicons name="person-add" size={16} color={Colors.primary} />
              <Text style={styles.inviteButtonText}>Invite a Friend to Safe-Sawar</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Vouch confirmation modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{confirmContact?.emoji}</Text>
            <Text style={styles.modalTitle}>Vouch for {confirmContact?.name}?</Text>
            <Text style={styles.modalMessage}>
              By vouching, you confirm that {confirmContact?.name} is a trustworthy woman you know personally.
              This will cost 1 Trust Credit.
            </Text>

            <View style={styles.modalCreditInfo}>
              <Ionicons name="heart" size={14} color={Colors.primary} />
              <Text style={styles.modalCreditText}>
                {trustCredits} → {trustCredits - 1} Trust Credits
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmVouch}>
                <Ionicons name="heart" size={16} color={Colors.textPrimary} />
                <Text style={styles.modalConfirmText}>Vouch Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      {isVouching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Processing vouch...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
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
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  creditsCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  creditsInfo: {
    flex: 1,
  },
  creditsTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  creditsSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  creditsHelp: {},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 8,
    padding: 10,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  contactAvatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  contactAvatar: {
    fontSize: 32,
    lineHeight: 44,
  },
  vouchedBadge: {
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
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  contactPhone: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  contactCircleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  contactCircleText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  vouchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  vouchedButton: {
    backgroundColor: Colors.verifiedLight,
    borderWidth: 1,
    borderColor: Colors.verified + '50',
  },
  vouchButtonDisabled: {
    backgroundColor: Colors.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vouchButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  vouchedText: {
    color: Colors.verified,
    fontSize: 12,
    fontWeight: '700',
  },
  vouchButtonDisabledText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  listFooter: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  inviteButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    width: '100%',
    maxWidth: 340,
  },
  modalEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  modalCreditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  modalCreditText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 6,
  },
  modalConfirmText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 0, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
