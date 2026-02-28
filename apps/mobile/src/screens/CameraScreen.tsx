import { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';
import { HarmonyCard } from '../components/ui/HarmonyCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';

/** Bottom padding for capture FAB when navbar is hidden in camera mode */
const FAB_BOTTOM_PADDING = 40;

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
function degreesToCardinal(deg: number): string {
  const i = Math.round(deg / 45) % 8;
  return CARDINALS[i];
}

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [heading, setHeading] = useState<number | null>(null);
  const { tokens } = useTheme();

  // Location badge: resolve current position to a place name (e.g. "Montreal, QC")
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      setLocationLoading(true);
      setLocationLabel(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled || status !== 'granted') {
          setLocationLoading(false);
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const [first] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (cancelled || !first) {
          setLocationLoading(false);
          return;
        }
        const city = first.city ?? first.subregion ?? null;
        const region = first.region ?? first.country ?? null;
        const label = [city, region].filter(Boolean).join(', ') || first.country || 'Unknown';
        setLocationLabel(label);
      } catch {
        if (!cancelled) setLocationLabel(null);
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Optional compass: heading in degrees (0 = North), from magnetometer
  const magnetometerSub = useRef<{ remove: () => void } | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Magnetometer.isAvailableAsync().then((available) => {
      if (!available) return;
      Magnetometer.setUpdateInterval(200);
      magnetometerSub.current = Magnetometer.addListener((data) => {
        const { x, y } = data;
        const angle = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
        setHeading(Math.round(angle));
      });
    });
    return () => {
      magnetometerSub.current?.remove();
      magnetometerSub.current = null;
    };
  }, []);
  const { colors, shadows: sh, radius: rad, spacing: sp, motion } = tokens;

  const scale = useRef(new Animated.Value(1)).current;

  const {
    filterDetections,
    detectorOptions,
    setFrameResults,
    setInitError,
    setActiveTab,
  } = useAppState();

  const captureAndDetect = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;

    setCapturing(true);
    setInitError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      const raw = await detectInImage({ uri: photo.uri }, detectorOptions);
      const filtered = filterDetections(raw);
      setFrameResults({ detections: filtered });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Detection failed. Try again.';
      setInitError(msg);
      setFrameResults(null);
    } finally {
      setCapturing(false);
    }
  }, [
    cameraReady,
    capturing,
    detectorOptions,
    filterDetections,
    setFrameResults,
    setInitError,
  ]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.surface,
      borderRadius: rad.lg,
      ...sh.md,
      overflow: 'hidden' as const,
    },
  ];

  const backButton = (
    <TouchableOpacity
      onPress={() => setActiveTab('home')}
      style={[styles.backBtn, { top: insets.top + sp.sm - 50, left: sp.lg }]}
      hitSlop={12}
    >
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
  );

  if (!permission) {
    return (
      <View style={containerStyle}>
        {backButton}
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[containerStyle, styles.centerContent]}>
        {backButton}
        <HarmonyCard bordered style={{ margin: sp.lg }}>
          <Text style={[tokens.typography.titleSm, { color: colors.textMain, textAlign: 'center' }]}>
            Camera not available
          </Text>
          <Text style={[tokens.typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm }]}>
            Camera preview is not available on web. Use a physical device or simulator.
          </Text>
        </HarmonyCard>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[containerStyle, styles.centerContent]}>
        {backButton}
        <HarmonyCard bordered style={{ margin: sp.lg, alignItems: 'center' }}>
          <Text style={[tokens.typography.titleSm, { color: colors.textMain, textAlign: 'center' }]}>
            Camera permission is required
          </Text>
          <Text style={[tokens.typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm }]}>
            Allow NaturaLens to access your camera to detect wildlife.
          </Text>
          <PrimaryButton
            title="Grant permission"
            onPress={requestPermission}
            style={{ marginTop: sp.lg }}
          />
        </HarmonyCard>
      </View>
    );
  }

  const headingLabel = heading != null ? `${degreesToCardinal(heading)} ${heading}°` : null;

  return (
    <View style={containerStyle}>
      {backButton}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      )}
      <View
        style={[
          styles.contextBadges,
          { top: insets.top + sp.sm, right: sp.lg },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.contextPill}>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : locationLabel ? (
            <>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.contextPillText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </>
          ) : null}
        </View>
        {headingLabel != null && (
          <View style={[styles.contextPill, styles.compassPill]}>
            <Ionicons name="compass-outline" size={14} color="#fff" />
            <Text style={styles.contextPillText}>{headingLabel}</Text>
          </View>
        )}
      </View>
      <View
        style={[
          styles.overlay,
          { paddingBottom: insets.bottom + FAB_BOTTOM_PADDING },
        ]}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />
        <View style={styles.fabWrap}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              style={[
                styles.fab,
                {
                  backgroundColor: colors.surface,
                  ...sh.md,
                  opacity: capturing ? 0.6 : 1,
                },
              ]}
              onPress={captureAndDetect}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!cameraReady || capturing}
            >
              {capturing ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <View style={[styles.fabInner, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 300 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  fabWrap: { alignItems: 'center', zIndex: 1 },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  backBtn: {
    position: 'absolute',
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBadges: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'flex-end',
    gap: 6,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.65)',
    maxWidth: 180,
  },
  compassPill: {
    maxWidth: 90,
  },
  contextPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
