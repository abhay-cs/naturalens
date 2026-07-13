import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, Typography, NAV_HEIGHT } from '../theme/spacing';
import { Button } from '../components/Button';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { useAppState } from '../contexts/AppStateContext';
import { detectInImage } from '../lib/detector';
import type { Detection } from '../types';

export function CameraDetectionScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  // What we just captured — screen-local, since nothing else needs to read it.
  const [detection, setDetection] = useState<Detection | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { setInitError, addHistoryEntry, setActiveTab } = useAppState();

  // A photo is on screen, identified or not. The camera is frozen behind it either way.
  const hasResult = photoUri !== null;

  // The screen runs full-bleed under the floating tab bar, so anything we put at the bottom
  // has to clear the bar itself — there's no layout flow to do it for us.
  const bottomClearance = insets.bottom + Spacing.l + NAV_HEIGHT + Spacing.m;

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

      // An empty result means "no animal here", which is an answer, not a failure — so we
      // still freeze on the photo and let the user see what we looked at.
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

  const retake = useCallback(() => {
    setDetection(null);
    setPhotoUri(null);
    setInitError(null);
  }, [setInitError]);

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
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* The frame we actually identified, held still over the live preview. */}
      {photoUri && (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {/* Only while the camera is warming up — there's nothing else on screen to look at
          yet. The identify wait is signalled in the shutter instead, so it doesn't dim the
          viewfinder the user is still framing with. */}
      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, styles.warmup]} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}

      {!hasResult && (
        <View style={[styles.shutterWrap, { bottom: bottomClearance }]} pointerEvents="box-none">
          <Text style={styles.hint}>
            {capturing ? 'Identifying…' : 'Point at an animal'}
          </Text>

          <TouchableOpacity
            style={styles.shutter}
            onPress={captureAndDetect}
            disabled={!cameraReady || capturing}
            activeOpacity={0.9}
          >
            {capturing ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasResult && (
        <View style={[styles.sheetWrap, { bottom: bottomClearance }]} pointerEvents="box-none">
          <View style={styles.sheet}>
            {detection ? (
              <>
                <Text style={styles.species}>{detection.label}</Text>
                <Text style={styles.description} numberOfLines={3}>
                  {detection.info.description}
                </Text>

                <View style={styles.confidenceWrap}>
                  <ConfidenceIndicator score={Math.round(detection.score * 100)} />
                </View>

                <Button
                  title={saving ? 'Saving…' : 'Save Discovery'}
                  variant="glass"
                  onPress={saveDiscovery}
                  disabled={saving}
                  style={styles.save}
                />
              </>
            ) : (
              <>
                <Text style={styles.species}>No animal here</Text>
                <Text style={styles.description}>
                  Nothing we could identify in this photo.
                </Text>
              </>
            )}

            <TouchableOpacity onPress={retake} disabled={saving} style={styles.retake}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  warmup: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  message: {
    ...Typography.body,
    color: Colors.white,
    textAlign: 'center',
    padding: Spacing.l,
  },
  cta: { marginTop: Spacing.s },

  shutterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.m,
  },
  hint: {
    ...Typography.subtitle,
    color: Colors.white,
    opacity: 0.7,
    // The viewfinder is whatever the user is pointing at, so white text alone isn't safe.
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 3,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
  },

  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.l,
  },
  sheet: {
    backgroundColor: 'rgba(5, 30, 25, 0.85)',
    borderRadius: BorderRadii.large,
    padding: Spacing.l,
    alignItems: 'center',
  },
  species: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  confidenceWrap: { marginTop: Spacing.m, marginBottom: Spacing.l },
  save: { width: '100%' },
  retake: { paddingVertical: Spacing.s, marginTop: Spacing.xs },
  retakeText: {
    ...Typography.subtitle,
    color: Colors.white,
    opacity: 0.8,
  },
});
