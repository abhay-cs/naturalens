import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, neoShadow, neoShadowSm, neoShadowLg, type NeoTheme } from '../theme';
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
  neo: NeoTheme;
  isDark: boolean;
  neoShadow: typeof neoShadow;
  neoShadowSm: typeof neoShadowSm;
  neoShadowLg: typeof neoShadowLg;
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
    const neo = resolvedTheme === 'dark' ? darkTheme : lightTheme;
    const shadowColor = resolvedTheme === 'dark' ? '#fff' : '#000';
    return {
      theme: resolvedTheme,
      setTheme,
      neo,
      isDark: resolvedTheme === 'dark',
      neoShadow: { ...neoShadow, shadowColor },
      neoShadowSm: { ...neoShadowSm, shadowColor },
      neoShadowLg: { ...neoShadowLg, shadowColor },
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
