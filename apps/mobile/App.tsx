import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
// Per-weight subpaths, not the package root. Importing the root pulls in that family's
// whole index, and Metro then bundles every .ttf it references — nine weights of Outfit and
// eighteen of Archivo, about 2.5MB of fonts nothing renders.
import { Outfit_200ExtraLight } from '@expo-google-fonts/outfit/200ExtraLight';
import { Outfit_300Light } from '@expo-google-fonts/outfit/300Light';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider, useAppState } from './src/contexts/AppStateContext';
import { MainLayout } from './src/layouts/MainLayout';
import { BrandSplash } from './src/components/BrandSplash';
import { Colors, RequiredFontFamilies } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

/**
 * Keyed by family name so this map can be checked against `RequiredFontFamilies` — the
 * generated list of every family the type ramp actually names. Add a weight to
 * tokens.json and the assertion below fails until the module is imported here, which is
 * the whole point: the load list cannot silently drift from the ramp.
 */
const FONTS = {
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
};

const missing = RequiredFontFamilies.filter((family) => !(family in FONTS));
if (missing.length > 0) {
  throw new Error(
    `Type ramp names fonts that App.tsx does not load: ${missing.join(', ')}. ` +
      `Import them from @expo-google-fonts and add them to FONTS.`,
  );
}

function AppContent() {
  const [brandingDone, setBrandingDone] = useState(false);
  const { activeTab } = useAppState();

  const [fontsLoaded] = useFonts(FONTS);

  // Hold the native splash until the fonts are in, so no screen renders in the system
  // face and then snaps to Outfit/Archivo.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Same ground as the native splash — anything else flashes on the handoff.
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  // The camera and the map both run full-bleed under the status bar. The camera is a dark
  // viewfinder that swallows dark icons; the map is pale and needs them dark, like the
  // rest of the app.
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
