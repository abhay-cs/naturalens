import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from './src/contexts/AppStateContext';
import { MainLayout } from './src/layouts/MainLayout';
import { BrandSplash } from './src/components/BrandSplash';
import { Colors } from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [brandingDone, setBrandingDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Hold the native splash until the fonts are in, so no screen renders in the system
  // face and then snaps to Figtree. These three weights are the ones Typography names.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Same tan as the native splash — anything else flashes on the handoff.
    return <View style={{ flex: 1, backgroundColor: Colors.cardBackground }} />;
  }

  return (
    <>
      <MainLayout />
      {!brandingDone && <BrandSplash onDone={() => setBrandingDone(true)} />}
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
