import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const slides = [
  {
    id: 1,
    emoji: '🛡️',
    title: 'Your Safety,\nOur Priority',
    subtitle: 'Safe-Sawar is Pakistan\'s first women-only carpooling platform',
    description: 'Every rider is CNIC-verified through NADRA. Travel with confidence knowing everyone has been authenticated.',
    color: Colors.primary,
    highlights: ['NADRA CNIC Verification', 'Biometric Authentication', 'Women-Only Platform'],
  },
  {
    id: 2,
    emoji: '🤝',
    title: 'Join Your\nInstitution Circle',
    subtitle: 'Travel with women from your university or hospital',
    description: 'Join circles of verified women from UET, PIMS, NUST and more. Vouch for friends to build a trusted network.',
    color: '#9C27B0',
    highlights: ['Institution-Based Trust', 'Vouch for Friends', '5 Trust Credits to Start'],
  },
  {
    id: 3,
    emoji: '📡',
    title: 'Emergency SOS\nEven Offline',
    subtitle: 'Mesh network protection when internet fails',
    description: 'Our unique mesh network technology sends SOS alerts through nearby Safe-Sawar devices when you\'re offline.',
    color: Colors.verified,
    highlights: ['Bluetooth Mesh Network', 'Location Sharing', 'Auto Alerts to Contacts'],
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToSlide = (index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      navigation.replace('BiometricVerification');
    }
  };

  const handleSkip = () => {
    navigation.replace('BiometricVerification');
  };

  const slide = slides[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View
            style={[
              styles.illustrationBg,
              { backgroundColor: slide.color + '15' },
            ]}
          >
            <View
              style={[
                styles.illustrationInner,
                { borderColor: slide.color + '40' },
              ]}
            >
              <Text style={styles.illustrationEmoji}>{slide.emoji}</Text>
            </View>
          </View>

          {/* Decorative elements */}
          <View style={[styles.decorDot1, { backgroundColor: slide.color }]} />
          <View style={[styles.decorDot2, { backgroundColor: slide.color }]} />
          <View style={[styles.decorDot3, { backgroundColor: slide.color }]} />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {/* Highlights */}
          <View style={styles.highlightsContainer}>
            {slide.highlights.map((highlight, i) => (
              <View key={i} style={styles.highlightItem}>
                <View style={[styles.highlightDot, { backgroundColor: slide.color }]} />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              style={[
                styles.dot,
                i === currentSlide
                  ? [styles.dotActive, { backgroundColor: slide.color }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: slide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentSlide === slides.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
            size={20}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  illustrationBg: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 72,
  },
  decorDot1: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 10,
    right: 60,
    opacity: 0.6,
  },
  decorDot2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: 10,
    left: 70,
    opacity: 0.4,
  },
  decorDot3: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 30,
    left: 50,
    opacity: 0.3,
  },
  textContainer: {
    flex: 1,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 21,
  },
  slideDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  highlightsContainer: {
    gap: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.surfaceBackground,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  nextButtonText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
