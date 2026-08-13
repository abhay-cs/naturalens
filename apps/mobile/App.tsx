import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
} from '@expo-google-fonts/outfit';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
} from '@expo-google-fonts/archivo';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider, useAppState } from './src/contexts/AppStateContext';
import { MainLayout } from './src/layouts/MainLayout';
import { BrandSplash } from './src/components/BrandSplash';
import { Colors } from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [brandingDone, setBrandingDone] = useState(false);
  const { activeTab } = useAppState();

  // Families must match RequiredFontFamilies from the generated tokens.
  const [fontsLoaded] = useFonts({
    Outfit_200ExtraLight,
    Outfit_300Light,
    Outfit_400Regular,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.splashBackground }} />;
  }

  // Camera is black chrome — light status icons. Everywhere else needs dark icons.
  const overCamera = brandingDone && activeTab === 'camera';

  return (
    <>
      <MainLayout />
      {!brandingDone && <BrandSplash onDone={() => setBrandingDone(true)} />}
      <StatusBar style={overCamera ? 'light' : 'dark'} />
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
