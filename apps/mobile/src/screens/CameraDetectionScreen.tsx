import { useRef, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, InvertedColors, Spacing, Typography } from '../theme/tokens';
import { Display } from '../theme/type';
import { bottomClearance, SHUTTER_SIZE, SHUTTER_CORE } from '../theme/layout';
import { Button } from '../components/Button';
import { BannerStack } from '../components/BannerStack';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ConservationBadge } from '../components/ConservationBadge';
import { OwlMark } from '../components/OwlMark';
import { CameraOffIcon } from '../components/icons';
import { Sheet } from '../components/Sheet';
import { useAppState } from '../contexts/AppStateContext';
import { detectInImage, toneOf } from '../lib/detector';
import { getCurrentFindLocation, requestLocationPermission } from '../lib/location';
import type { Detection, FindLocation } from '../types';

/** Ink over the viewfinder — a dark surface, so the inverted half of the palette. */
const OVER_LENS = InvertedColors;

/** Chip and sheet grounds. Not tokens: these are scrims over live video, tuned by eye. */
const CHIP_SCRIM = 'rgba(0,0,0,0.55)';
const VIEWFINDER = '#111111';

export function CameraDetectionScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  // What we just captured — screen-local, since nothing else needs to read it until it's
  // saved. `detection` stays null for "no animal here", which is an answer, not a failure.
  const [detection, setDetection] = useState<Detection | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<FindLocation | undefined>(undefined);

  // Only ask for location once per session, and only after the user has actually taken a
  // photo — a permission sheet on launch, before there's anything to attach a place to,
  // is a prompt with no context.
  const askedForLocation = useRef(false);

  const { pushBanner, addHistoryEntry, setActiveTab } = useAppState();

  const hasResult = photoUri !== null;
  const clearance = bottomClearance(insets.bottom);

  const captureAndDetect = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;

    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      // Identify first. Location is garnish, and making the user wait on a GPS fix before
      // seeing what they photographed would be the wrong trade.
      const results = await detectInImage(photo.uri);

      setDetection(results[0] ?? null);
      setPhotoUri(photo.uri);

      if (!askedForLocation.current) {
        askedForLocation.current = true;
        await requestLocationPermission();
      }
      setLocation(await getCurrentFindLocation());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Detection failed. Try again.';
      pushBanner(message, toneOf(err));
      setDetection(null);
      setPhotoUri(null);
      setLocation(undefined);
    } finally {
      setCapturing(false);
    }
  }, [cameraReady, capturing, pushBanner]);

  const retake = useCallback(() => {
    setDetection(null);
    setPhotoUri(null);
    setLocation(undefined);
  }, []);

  const saveDiscovery = useCallback(async () => {
    if (!detection || !photoUri || saving) return;

    setSaving(true);

    try {
      await addHistoryEntry(detection, photoUri, location);

      setDetection(null);
      setPhotoUri(null);
      setLocation(undefined);
      setActiveTab('finds');
    } catch (err) {
      pushBanner(err instanceof Error ? err.message : 'Could not save. Try again.', 'danger');
    } finally {
      setSaving(false);
    }
  }, [detection, photoUri, location, saving, addHistoryEntry, setActiveTab, pushBanner]);

  // Screen 09 — the camera is the whole product, so this is a page, not an alert.
  if (permission && !permission.granted) {
    return (
      <View style={styles.permissionPage}>
        <View style={[styles.permissionBody, { paddingTop: insets.top }]}>
          <CameraOffIcon size={30} color={Colors.fg} />
          <Text style={styles.permissionTitle}>Naturalens needs the camera</Text>
          <Text style={styles.permissionCopy}>
            Point it at an animal and we'll name the species. The photo is sent to identify it,
            then saved on this phone.
          </Text>
        </View>
        <View style={[styles.permissionAction, { bottom: clearance + Spacing.l }]}>
          <Button title="Grant permission" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.viewfinder, styles.center]}>
        <Text style={styles.warmupCopy}>Camera preview is not available on web.</Text>
      </View>
    );
  }

  // Reads out the same state the body of the screen is showing — a chip saying "Ready"
  // over a "Preparing lens…" spinner is two answers to one question.
  const status = capturing
    ? 'Identifying'
    : hasResult
      ? 'Result'
      : cameraReady
        ? 'Ready'
        : 'Preparing';

  return (
    <View style={styles.viewfinder}>
      {/* Permission is still resolving on the very first launch — render the dark ground
          rather than a flash of white before the viewfinder arrives. */}
      {permission && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      )}

      {/* The still we actually analysed. Showing the result over a live feed would be
          naming a frame the user can no longer see. */}
      {photoUri && <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} />}

      <View style={[styles.topBar, { top: insets.top + Spacing.m }]} pointerEvents="box-none">
        <OwlMark size={26} color={OVER_LENS.fg} />
        <Text style={styles.statusChip}>{status}</Text>
      </View>

      <View
        style={[styles.bannerWrap, { top: insets.top + Spacing.xxl }]}
        pointerEvents="box-none"
      >
        <BannerStack />
      </View>

      {/* Screen 05 — the viewfinder is black until the sensor warms up, which reads as a
          crash rather than a wait unless we say something. */}
      {!cameraReady && !hasResult && (
        <View style={[styles.center, StyleSheet.absoluteFill]} pointerEvents="none">
          <Text style={styles.warmupTitle}>Preparing lens…</Text>
          <View style={styles.warmupTrack}>
            <View style={styles.warmupFill} />
          </View>
          <Text style={styles.warmupCopy}>Getting the camera ready.</Text>
        </View>
      )}

      {!hasResult ? (
        <View style={[styles.shutterCluster, { bottom: clearance + Spacing.xl }]}>
          <TouchableOpacity
            style={[styles.shutter, capturing && styles.shutterBusy]}
            onPress={captureAndDetect}
            disabled={!cameraReady || capturing}
            accessibilityRole="button"
            accessibilityLabel={capturing ? 'Identifying' : 'Identify what the camera sees'}
            activeOpacity={0.8}
          >
            <View style={styles.shutterCore} />
          </TouchableOpacity>
          <Text style={styles.shutterHint}>
            {capturing ? 'Identifying…' : 'Tap to identify'}
          </Text>
        </View>
      ) : (
        <Sheet style={styles.resultSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            bounces={false}
          >
            {detection ? (
              <>
                <Text style={styles.resultLabel}>Identified</Text>
                <Text style={styles.speciesName}>{detection.label}</Text>
                <ConfidenceBar score={detection.score} />
                <View style={styles.rule} />
                <Text style={styles.description}>{detection.info.description}</Text>
                <View style={styles.factRow}>
                  <Fact label="Habitat" value={detection.info.habitat} />
                  <Fact label="Diet" value={detection.info.diet} />
                </View>
                <View style={styles.badgeWrap}>
                  <ConservationBadge status={detection.info.conservationStatus} />
                </View>
                <Button
                  title={saving ? 'Saving…' : 'Save Discovery'}
                  onPress={saveDiscovery}
                  disabled={saving}
                  style={styles.primaryAction}
                />
                <Button title="Retake" variant="quiet" onPress={retake} disabled={saving} />
              </>
            ) : (
              /* Screen 08. The `isAnimal` guard is load-bearing — shown a chair, the model
                 will happily describe the upholstery. This is what it looks like when it
                 holds. */
              <>
                <Text style={styles.resultLabel}>Result</Text>
                <Text style={styles.speciesName}>No animal here</Text>
                <Text style={styles.description}>Nothing we could identify in this photo.</Text>
                <Button title="Retake" onPress={retake} style={styles.primaryAction} />
              </>
            )}
          </ScrollView>
        </Sheet>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewfinder: {
    flex: 1,
    backgroundColor: VIEWFINDER,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: {
    position: 'absolute',
    left: Spacing.l,
    right: Spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    ...Typography.label,
    color: OVER_LENS.muted,
    backgroundColor: CHIP_SCRIM,
    paddingVertical: 5,
    paddingHorizontal: Spacing.s,
    overflow: 'hidden',
  },
  bannerWrap: {
    position: 'absolute',
    left: Spacing.l,
    right: Spacing.l,
  },

  warmupTitle: {
    ...Display.status,
    color: OVER_LENS.fg,
  },
  warmupTrack: {
    width: 132,
    height: 2,
    backgroundColor: OVER_LENS.border,
    marginTop: Spacing.l - 4,
  },
  warmupFill: {
    width: 64,
    height: 2,
    backgroundColor: OVER_LENS.fg,
  },
  warmupCopy: {
    ...Typography.small,
    color: OVER_LENS.muted,
    marginTop: Spacing.m,
    textAlign: 'center',
    paddingHorizontal: Spacing.l,
  },

  shutterCluster: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.m,
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBusy: {
    opacity: 0.5,
  },
  shutterCore: {
    width: SHUTTER_CORE,
    height: SHUTTER_CORE,
    borderRadius: SHUTTER_CORE / 2,
    backgroundColor: OVER_LENS.fg,
  },
  shutterHint: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.7)',
  },

  resultSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
  },
  resultLabel: {
    ...Typography.label,
    color: Colors.caption,
  },
  speciesName: {
    ...Display.species,
    color: Colors.fg,
    marginTop: Spacing.xs + 2,
    marginBottom: Spacing.l - 4,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.l - 2,
  },
  description: {
    ...Typography.small,
    color: Colors.fg,
    lineHeight: 22,
  },
  factRow: {
    flexDirection: 'row',
    gap: Spacing.l,
    marginTop: Spacing.l - 4,
  },
  fact: {
    flex: 1,
  },
  factLabel: {
    ...Typography.label,
    color: Colors.caption,
  },
  factValue: {
    ...Typography.small,
    fontSize: 13,
    color: Colors.fg,
    marginTop: 5,
  },
  badgeWrap: {
    marginTop: Spacing.m + 2,
  },
  primaryAction: {
    marginTop: Spacing.l,
  },

  permissionPage: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  permissionBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
  },
  permissionTitle: {
    ...Display.prompt,
    color: Colors.fg,
    marginTop: Spacing.l + 2,
    marginBottom: Spacing.m - 2,
  },
  permissionCopy: {
    ...Typography.small,
    color: Colors.muted,
  },
  permissionAction: {
    position: 'absolute',
    left: Spacing.l,
    right: Spacing.l,
  },
});
