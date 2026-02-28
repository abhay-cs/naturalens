import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lightColors,
  darkColors,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  type Tokens,
} from '../theme';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

const STORAGE_KEY = 'naturalens-theme';
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  tokens: Tokens;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(() => 'light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      } else {
        setThemeState(systemScheme === 'dark' ? 'dark' : 'light');
      }
      setLoaded(true);
    });
  }, [systemScheme]);

  const setTheme = useCallback(async (t: Theme) => {
    setThemeState(t);
    await AsyncStorage.setItem(STORAGE_KEY, t);
  }, []);

  const resolvedTheme: Theme = loaded ? theme : (systemScheme === 'dark' ? 'dark' : 'light');

  const value: ThemeContextValue = useMemo(() => {
    const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
    return {
      theme: resolvedTheme,
      setTheme,
      isDark: resolvedTheme === 'dark',
      tokens: { colors, typography, spacing, radius, shadows, motion },
    };
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
