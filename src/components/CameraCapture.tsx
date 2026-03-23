import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface CameraCaptureProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  facing?: 'front' | 'back';
  uri?: string;
  onCapture: (uri: string) => void;
}

export default function CameraCapture({
  label,
  icon = 'camera-outline',
  facing = 'back',
  uri,
  onCapture,
}: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handlePress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
        setShowCamera(false);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name={icon} size={28} color={Colors.primary} />
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
        {/* Edit overlay when photo exists */}
        {uri && (
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color={Colors.textPrimary} />
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.cameraLabel}>{label}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Capture button */}
          <View style={styles.captureRow}>
            {capturing ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.cardBackground,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  captureRow: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.textPrimary,
  },
});
