import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeName = 'light' | 'dark';

export interface ColorPalette {
  background: string;
  card: string;
  border: string;
  input: string;
  placeholder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  success: string;
  successBg: string;
  successBorder: string;
  warning: string;
  statusBarStyle: 'light' | 'dark';
}

const darkColors: ColorPalette = {
  background: '#020617',
  card: '#0f172a',
  border: '#1e293b',
  input: '#0b1220',
  placeholder: '#475569',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#10b981',
  accentBg: 'rgba(16, 185, 129, 0.08)',
  danger: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: 'rgba(239, 68, 68, 0.2)',
  success: '#34d399',
  successBg: 'rgba(16, 185, 129, 0.1)',
  successBorder: 'rgba(16, 185, 129, 0.2)',
  warning: '#f97316',
  statusBarStyle: 'light',
};

const lightColors: ColorPalette = {
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  input: '#f1f5f9',
  placeholder: '#94a3b8',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  accent: '#10b981',
  accentBg: 'rgba(16, 185, 129, 0.1)',
  danger: '#dc2626',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  dangerBorder: 'rgba(220, 38, 38, 0.2)',
  success: '#059669',
  successBg: 'rgba(5, 150, 105, 0.08)',
  successBorder: 'rgba(5, 150, 105, 0.2)',
  warning: '#ea580c',
  statusBarStyle: 'dark',
};

const THEME_STORAGE_KEY = 'apexlog_theme';

interface ThemeContextValue {
  theme: ThemeName;
  colors: ColorPalette;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(Appearance.getColorScheme() === 'light' ? 'light' : 'dark');

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    })();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      void SecureStore.setItemAsync(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme === 'dark' ? darkColors : lightColors,
      isDark: theme === 'dark',
      toggleTheme,
    }),
    [theme]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
