import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AppStateProvider } from './src/contexts/AppStateContext';
import { OnboardingOverlay } from './src/components/OnboardingOverlay';
import { MainLayout } from './src/layouts/MainLayout';

const ONBOARDING_KEY = 'naturalens-onboarding-seen';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const { theme, tokens } = useTheme();

  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      setOnboardingComplete(!!v);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded || onboardingComplete === null) {
    return <View style={{ flex: 1, backgroundColor: tokens.colors.bg }} />;
  }

  return (
    <>
      {!onboardingComplete && (
        <OnboardingOverlay onComplete={() => setOnboardingComplete(true)} />
      )}
      <MainLayout />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
