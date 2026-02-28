import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';
import { HarmonyCard } from '../components/ui/HarmonyCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';

export function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const { tokens } = useTheme();
  const { colors, shadows: sh, radius: rad, spacing: sp, motion } = tokens;

  const scale = useRef(new Animated.Value(1)).current;

  const {
    filterDetections,
    detectorOptions,
    setFrameResults,
    setInitError,
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

  if (!permission) {
    return (
      <View style={containerStyle}>
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[containerStyle, styles.centerContent]}>
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

  return (
    <View style={containerStyle}>
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
      <View style={styles.overlay} pointerEvents="box-none">
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
});
