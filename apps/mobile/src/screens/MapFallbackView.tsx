import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { DUMMY_CAPTURES } from '../data/dummyCaptures';
import { useTheme } from '../contexts/ThemeContext';
import type { Capture } from '../types';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sourceLabel(source: Capture['source']): string {
  return source === 'camera' ? 'Camera' : source === 'image' ? 'Image' : 'Video';
}

export function MapFallbackView() {
  const { neo, neoShadow } = useTheme();

  return (
    <View style={[styles.wrapper, { borderColor: neo.border, borderWidth: 2, borderRadius: 12, overflow: 'hidden', ...neoShadow, backgroundColor: neo.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: neo.text }]}>Map</Text>
        <Text style={[styles.subtitle, { color: neo.text }]}>
          Run a development build for native maps. In Expo Go, captures are listed below:
        </Text>
        {DUMMY_CAPTURES.map((capture) => (
          <View
            key={capture.id}
            style={[
              styles.card,
              {
                backgroundColor: neo.surface,
                borderColor: neo.border,
                borderWidth: 2,
                ...neoShadow,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: neo.text }]}>
              {capture.detections.length} detection(s) @ {capture.lat.toFixed(2)}, {capture.lng.toFixed(2)}
            </Text>
            <Text style={[styles.row, { color: neo.text }]}>
              <Text style={styles.bold}>Animals:</Text>{' '}
              {capture.detections.map((d) => d.label).join(', ') || '—'}
            </Text>
            <Text style={[styles.row, { color: neo.text }]}>
              <Text style={styles.bold}>Source:</Text> {sourceLabel(capture.source)}
            </Text>
            <Text style={[styles.row, { color: neo.text }]}>
              <Text style={styles.bold}>When:</Text> {formatTimestamp(capture.timestamp)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 12 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
    marginBottom: 6,
  },
  row: {
    fontSize: 12,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 2,
  },
  bold: { fontWeight: '600', fontFamily: 'Figtree_600SemiBold' },
});
