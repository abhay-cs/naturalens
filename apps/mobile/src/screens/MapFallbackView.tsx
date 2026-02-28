import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { DUMMY_CAPTURES } from '../data/dummyCaptures';
import { useTheme } from '../contexts/ThemeContext';
import { HarmonyCard } from '../components/ui/HarmonyCard';
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
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp } = tokens;

  return (
    <HarmonyCard elevated style={styles.wrapper} padded={false}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: sp.lg, paddingBottom: sp['2xl'] }}>
        <Text style={[typo.titleLg, { color: colors.textMain }]}>Map</Text>
        <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs, marginBottom: sp.lg }]}>
          Run a development build for native maps. In Expo Go, captures are listed below:
        </Text>
        {DUMMY_CAPTURES.map((capture) => (
          <HarmonyCard key={capture.id} bordered style={{ marginBottom: sp.md, padding: sp.md }}>
            <Text style={[typo.titleSm, { color: colors.textMain }]}>
              {capture.detections.length} detection(s) @ {capture.lat.toFixed(2)}, {capture.lng.toFixed(2)}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: sp.xs }]}>
              {capture.detections.map((d) => d.label).join(', ') || '—'}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: sp.xs }]}>
              {sourceLabel(capture.source)} · {formatTimestamp(capture.timestamp)}
            </Text>
          </HarmonyCard>
        ))}
      </ScrollView>
    </HarmonyCard>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 12 },
  container: { flex: 1 },
});
