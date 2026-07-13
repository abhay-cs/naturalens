import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/spacing';
import { Button } from '../components/Button';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { useAppState } from '../contexts/AppStateContext';
import { detectInImage } from '../lib/detector';
import type { Detection } from '../types';

export function CameraDetectionScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  // What we just captured — screen-local, since nothing else needs to read it.
  const [detection, setDetection] = useState<Detection | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { setInitError, addHistoryEntry, setActiveTab } = useAppState();

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

      const results = await detectInImage(photo.uri);

      setDetection(results[0] ?? null);
      setPhotoUri(photo.uri);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Detection failed. Try again.';
      setInitError(msg);
      setDetection(null);
      setPhotoUri(null);
    } finally {
      setCapturing(false);
    }
  }, [cameraReady, capturing, setInitError]);

  const saveDiscovery = useCallback(async () => {
    if (!detection || !photoUri || saving) return;

    setSaving(true);

    try {
      await addHistoryEntry(detection, photoUri);

      setDetection(null);
      setPhotoUri(null);
      setActiveTab('history');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save. Try again.';
      setInitError(msg);
    } finally {
      setSaving(false);
    }
  }, [detection, photoUri, saving, addHistoryEntry, setActiveTab, setInitError]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.message}>
          Camera preview is not available on web. Use a physical device.
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.message}>Camera permission is required.</Text>
        <Button
          title="Grant permission"
          variant="primary"
          onPress={requestPermission}
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraBackground}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      </View>

      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Camera Detection</Text>
        </View>

        <View style={styles.fabWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.fab, capturing && styles.fabDisabled]}
            onPress={captureAndDetect}
            disabled={!cameraReady || capturing}
            activeOpacity={0.9}
          >
            {capturing ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <View style={styles.fabInner} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheetWrapper}>
          <View style={styles.bottomSheet}>
            <Text style={styles.detectionTitle}>{detection?.label ?? '—'}</Text>
            <Text style={styles.detectionSubtitle}>
              {detection ? 'detected' : 'Ready to scan'}
            </Text>

            {detection && (
              <>
                <View style={styles.confidenceWrap}>
                  <ConfidenceIndicator score={Math.round(detection.score * 100)} />
                </View>
                <Button
                  title={saving ? 'Saving…' : 'Save Discovery'}
                  variant="glass"
                  onPress={saveDiscovery}
                  disabled={saving}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand },
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3b6a75',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  message: {
    ...Typography.body,
    color: Colors.white,
    textAlign: 'center',
    padding: 24,
  },
  cta: { marginTop: 8 },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fabWrap: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabDisabled: { opacity: 0.6 },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.textSecondary,
  },
  bottomSheetWrapper: { padding: 24, paddingBottom: 40 },
  bottomSheet: {
    backgroundColor: 'rgba(5, 30, 25, 0.85)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
  },
  detectionTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  detectionSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  confidenceWrap: { marginTop: 16, marginBottom: 24 },
  actionButton: { width: '100%' },
});
