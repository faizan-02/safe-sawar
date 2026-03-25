import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { FemaleColorsLight, AppTheme, getTheme } from './colors';
import { useAppStore } from '../store/appStore';

const ThemeContext = createContext<AppTheme>(FemaleColorsLight);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { state } = useAppStore();
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const isDark =
    state.themeMode === 'dark' ||
    (state.themeMode === 'system' && systemScheme === 'dark');

  const theme = getTheme(state.selectedGender, isDark);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
