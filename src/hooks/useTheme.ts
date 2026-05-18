import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DarkColors, LightColors, ColorPalette } from '../constants/colors';

export type Theme = 'dark' | 'light';

type ThemeContextType = {
  theme: Theme;
  colors: ColorPalette;
  toggleTheme: () => void;
};

const THEME_KEY = '@albanian/theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: DarkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const colors = useMemo(() => theme === 'dark' ? DarkColors : LightColors, [theme]);

  const value = useMemo(() => ({ theme, colors, toggleTheme }), [theme, colors, toggleTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useColors(): ColorPalette {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  return useContext(ThemeContext);
}
