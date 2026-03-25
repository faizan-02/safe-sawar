// ─── Shared base (semantic tokens that don't change with theme) ──────────────
const base = {
  textOnPrimary: '#FFFFFF',   // text ON top of a colored/primary background
  verified: '#00C853',
  verifiedLight: 'rgba(0,200,83,0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.15)',
  sosRed: '#EF4444',
  sosRedGlow: 'rgba(239,68,68,0.35)',
  gradientSOS: ['#EF4444', '#DC2626'] as string[],
};

// ─── Female – Light ───────────────────────────────────────────────────────────
export const FemaleColorsLight = {
  ...base,
  isDark: false,
  background: '#FFF5F7',
  cardBackground: '#FFFFFF',
  surfaceBackground: '#FCE4EC',
  overlayBackground: 'rgba(255,245,247,0.97)',
  primary: '#E91E63',
  primaryDark: '#C2185B',
  primaryLight: '#F06292',
  primaryGlow: 'rgba(233,30,99,0.1)',
  secondary: '#AD1457',
  secondaryDark: '#880E4F',
  secondaryLight: '#F48FB1',
  textPrimary: '#1A1A2E',
  textSecondary: '#4A4A6A',
  textMuted: '#8888AA',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(233,30,99,0.3)',
  inputBackground: '#FAFAFA',
  shadow: 'rgba(233,30,99,0.12)',
  routeColor: '#E91E63',
  markerBackground: '#E91E63',
  gradientPrimary: ['#E91E63', '#F06292'] as string[],
  gradientBackground: ['#FFF5F7', '#FCE4EC'] as string[],
  gradientCard: ['#FCE4EC', '#F8BBD0'] as string[],
};

// ─── Female – Dark ────────────────────────────────────────────────────────────
export const FemaleColorsDark = {
  ...base,
  isDark: true,
  background: '#1C0014',
  cardBackground: '#2A1020',
  surfaceBackground: '#38182E',
  overlayBackground: 'rgba(26,0,16,0.95)',
  primary: '#E91E63',
  primaryDark: '#C2185B',
  primaryLight: '#F06292',
  primaryGlow: 'rgba(233,30,99,0.25)',
  secondary: '#AD1457',
  secondaryDark: '#880E4F',
  secondaryLight: '#F48FB1',
  textPrimary: '#F9FAFB',
  textSecondary: '#D4A0C0',
  textMuted: '#9E7090',
  border: 'rgba(233,30,99,0.2)',
  borderStrong: 'rgba(233,30,99,0.45)',
  inputBackground: 'rgba(45,0,24,0.8)',
  shadow: 'rgba(233,30,99,0.15)',
  routeColor: '#E91E63',
  markerBackground: '#E91E63',
  gradientPrimary: ['#E91E63', '#C2185B'] as string[],
  gradientBackground: ['#1A0010', '#2D0018'] as string[],
  gradientCard: ['#2D0018', '#4A0020'] as string[],
};

// ─── Male – Light ─────────────────────────────────────────────────────────────
export const MaleColorsLight = {
  ...base,
  isDark: false,
  background: '#F0F7FF',
  cardBackground: '#FFFFFF',
  surfaceBackground: '#E3F2FD',
  overlayBackground: 'rgba(240,247,255,0.97)',
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  primaryGlow: 'rgba(21,101,192,0.1)',
  secondary: '#0288D1',
  secondaryDark: '#01579B',
  secondaryLight: '#64B5F6',
  textPrimary: '#1A1A2E',
  textSecondary: '#3A4A6A',
  textMuted: '#7788AA',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(21,101,192,0.3)',
  inputBackground: '#F8FAFF',
  shadow: 'rgba(21,101,192,0.12)',
  routeColor: '#1565C0',
  markerBackground: '#1565C0',
  gradientPrimary: ['#1565C0', '#42A5F5'] as string[],
  gradientBackground: ['#F0F7FF', '#E3F2FD'] as string[],
  gradientCard: ['#E3F2FD', '#BBDEFB'] as string[],
};

// ─── Male – Dark ──────────────────────────────────────────────────────────────
export const MaleColorsDark = {
  ...base,
  isDark: true,
  background: '#011520',
  cardBackground: '#0A1E2E',
  surfaceBackground: '#102840',
  overlayBackground: 'rgba(0,17,31,0.95)',
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  primaryGlow: 'rgba(21,101,192,0.25)',
  secondary: '#0288D1',
  secondaryDark: '#01579B',
  secondaryLight: '#64B5F6',
  textPrimary: '#F0F7FF',
  textSecondary: '#90B8D8',
  textMuted: '#507090',
  border: 'rgba(21,101,192,0.2)',
  borderStrong: 'rgba(21,101,192,0.45)',
  inputBackground: 'rgba(0,26,46,0.8)',
  shadow: 'rgba(21,101,192,0.15)',
  routeColor: '#1565C0',
  markerBackground: '#1565C0',
  gradientPrimary: ['#1565C0', '#0D47A1'] as string[],
  gradientBackground: ['#00111F', '#001829'] as string[],
  gradientCard: ['#001829', '#002444'] as string[],
};

export type AppTheme = typeof FemaleColorsLight;
export type ColorKeys = keyof AppTheme;

// Convenience aliases — "FemaleColors" / "MaleColors" = light variants
export const FemaleColors = FemaleColorsLight;
export const MaleColors = MaleColorsLight;

export const getTheme = (
  gender: 'male' | 'female',
  isDark: boolean,
): AppTheme => {
  if (gender === 'male') return isDark ? MaleColorsDark : MaleColorsLight;
  return isDark ? FemaleColorsDark : FemaleColorsLight;
};

// Backward-compat alias (female-light = default for StyleSheet.create)
export const Colors = FemaleColorsLight;
