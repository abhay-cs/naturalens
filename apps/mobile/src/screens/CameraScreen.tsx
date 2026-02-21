import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';

export function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const { neo, neoShadow } = useTheme();

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

  const borderedContainer = [
    styles.container,
    { borderColor: neo.border, borderWidth: 2, borderRadius: 12, overflow: 'hidden', ...neoShadow },
  ];

  if (!permission) {
    return (
      <View style={borderedContainer}>
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={neo.text} />
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[borderedContainer, styles.centerContent]}>
        <Text style={[styles.message, { color: neo.text }]}>
          Camera preview is not available on web. Use a physical device or simulator.
        </Text>
        <Text style={[styles.message, { color: neo.text, fontSize: 14, marginTop: 8 }]}>
          On iOS Simulator, the camera shows black (no camera hardware).
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[borderedContainer, styles.centerContent]}>
        <Text style={[styles.message, { color: neo.text }]}>Camera permission is required.</Text>
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: neo.accent,
              borderColor: neo.border,
              borderWidth: 2,
              ...neoShadow,
            },
          ]}
          onPress={requestPermission}
        >
          <Text style={[styles.ctaText, { color: neo.textInv }]}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={borderedContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
          <ActivityIndicator size="large" color={neo.text} />
        </View>
      )}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.fabWrap}>
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: neo.accent,
                borderColor: neo.border,
                borderWidth: 2,
                ...neoShadow,
                opacity: capturing ? 0.6 : 1,
              },
            ]}
            onPress={captureAndDetect}
            disabled={!cameraReady || capturing}
            activeOpacity={0.9}
          >
            {capturing ? (
              <ActivityIndicator color={neo.textInv} size="small" />
            ) : (
              <View style={[styles.fabInner, { backgroundColor: neo.textInv }]} />
            )}
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
    padding: 24,
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  fabWrap: { alignItems: 'center' },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
