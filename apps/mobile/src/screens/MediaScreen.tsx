import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';
import { HarmonyCard } from '../components/ui/HarmonyCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';

export function MediaScreen() {
  const [processing, setProcessing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;

  const {
    filterDetections,
    detectorOptions,
    setFrameResults,
    setInitError,
    setVideoDetections,
    setVideoFrameMeta,
  } = useAppState();

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const { uri } = result.assets[0];
    setImageUri(uri);
    setProcessing(true);
    setInitError(null);

    try {
      const raw = await detectInImage({ uri }, detectorOptions);
      const filtered = filterDetections(raw);
      setFrameResults({ detections: filtered });
      setVideoDetections(null);
      setVideoFrameMeta(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Detection failed. Try again.';
      setInitError(msg);
      setFrameResults(null);
    } finally {
      setProcessing(false);
    }
  }, [
    detectorOptions,
    filterDetections,
    setFrameResults,
    setInitError,
    setVideoDetections,
    setVideoFrameMeta,
  ]);

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    setInitError(null);
    setVideoDetections(null);
    setVideoFrameMeta(null);
    setFrameResults(null);
    setInitError(
      'Video frame detection requires a development build. Use Image upload for now.'
    );
  }, [setInitError, setVideoDetections, setVideoFrameMeta, setFrameResults]);

  return (
    <HarmonyCard elevated style={styles.wrapper} padded={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: sp.lg, paddingBottom: sp['2xl'] }}
      >
        <View style={{ marginBottom: sp.xl }}>
          <Text style={[typo.titleSm, { color: colors.textMain }]}>Upload image</Text>
          <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs }]}>
            Select a photo to analyze for wildlife.
          </Text>
          <PrimaryButton
            title={processing ? 'Detecting…' : 'Select image (JPG/PNG)'}
            onPress={pickImage}
            disabled={processing}
            loading={processing}
            style={{ marginTop: sp.md, alignSelf: 'flex-start' }}
          />
          {imageUri && (
            <View
              style={[
                styles.previewWrap,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: rad.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginTop: sp.lg,
                  ...sh.sm,
                },
              ]}
            >
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            </View>
          )}
        </View>

        <View>
          <Text style={[typo.titleSm, { color: colors.textMain }]}>Upload video</Text>
          <SecondaryButton
            title="Select video"
            onPress={pickVideo}
            style={{ marginTop: sp.md, alignSelf: 'flex-start' }}
          />
          <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.sm }]}>
            Video frame detection requires a dev build. Coming soon.
          </Text>
        </View>
      </ScrollView>
    </HarmonyCard>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 0 },
  container: { flex: 1 },
  previewWrap: {
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 220,
  },
});
