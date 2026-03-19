export const Colors = {
  // Backgrounds
  background: '#1A0010',
  cardBackground: '#2D0018',
  surfaceBackground: '#3D0022',
  overlayBackground: 'rgba(26, 0, 16, 0.92)',

  // Primary accents
  primary: '#E91E8C',
  primaryDark: '#C2185B',
  primaryLight: '#F06292',
  primaryGlow: 'rgba(233, 30, 140, 0.3)',

  // Secondary maroon
  secondary: '#8B0036',
  secondaryDark: '#4A0020',
  secondaryLight: '#AD1457',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D4A0C0',
  textMuted: '#9E7090',
  textOnPrimary: '#FFFFFF',

  // Status colors
  verified: '#00C853',
  verifiedLight: 'rgba(0, 200, 83, 0.2)',
  warning: '#FFB300',
  warningLight: 'rgba(255, 179, 0, 0.2)',
  error: '#F44336',
  errorLight: 'rgba(244, 67, 54, 0.2)',
  sosRed: '#FF1744',
  sosRedGlow: 'rgba(255, 23, 68, 0.4)',

  // UI elements
  border: 'rgba(233, 30, 140, 0.25)',
  borderStrong: 'rgba(233, 30, 140, 0.5)',
  inputBackground: 'rgba(45, 0, 24, 0.8)',
  shadow: 'rgba(233, 30, 140, 0.15)',

  // Map
  routeColor: '#E91E8C',
  markerBackground: '#E91E8C',

  // Gradients (used as arrays)
  gradientPrimary: ['#E91E8C', '#C2185B'],
  gradientBackground: ['#1A0010', '#2D0018'],
  gradientCard: ['#2D0018', '#4A0020'],
  gradientSOS: ['#FF1744', '#B71C1C'],
};

export type ColorKeys = keyof typeof Colors;
