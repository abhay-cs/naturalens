import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';

export function MediaScreen() {
  const [processing, setProcessing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { neo, neoShadow, neoShadowLg } = useTheme();

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
    <View style={[styles.wrapper, { borderColor: neo.border, borderWidth: 2, borderRadius: 12, overflow: 'hidden', ...neoShadow }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: neo.bg }]}
        contentContainerStyle={styles.content}
      >
      <View style={styles.section}>
        <Text style={[styles.heading, { color: neo.text }]}>Upload Image</Text>
        <TouchableOpacity
          style={[
            styles.btn,
            {
              backgroundColor: neo.accent,
              borderColor: neo.border,
              borderWidth: 2,
              ...neoShadow,
              opacity: processing ? 0.6 : 1,
            },
          ]}
          onPress={pickImage}
          disabled={processing}
        >
          <Text style={[styles.btnText, { color: neo.textInv }]}>
            {processing ? 'Detecting…' : 'Select Image (JPG/PNG)'}
          </Text>
        </TouchableOpacity>
        {imageUri && (
          <View
            style={[
              styles.previewWrap,
              {
                backgroundColor: neo.bg,
                borderColor: neo.border,
                borderWidth: 2,
                ...neoShadowLg,
              },
            ]}
          >
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.heading, { color: neo.text }]}>Upload Video</Text>
        <TouchableOpacity
          style={[
            styles.btnSecondary,
            {
              backgroundColor: neo.surface,
              borderColor: neo.border,
              borderWidth: 2,
              ...neoShadow,
            },
          ]}
          onPress={pickVideo}
        >
          <Text style={[styles.btnTextSecondary, { color: neo.text }]}>Select Video</Text>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: neo.text }]}>
          Video frame detection requires a dev build. Coming soon.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  btnTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  previewWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Figtree_400Regular',
    marginTop: 8,
  },
});
