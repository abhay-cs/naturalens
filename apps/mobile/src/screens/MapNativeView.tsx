import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { DUMMY_CAPTURES } from '../data/dummyCaptures';
import { useTheme } from '../contexts/ThemeContext';
import type { Capture } from '../types';

const DEFAULT_REGION = {
  latitude: 45.5,
  longitude: -73.5,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

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

function NeoMarkerPin({ borderColor, shadowColor, highlight }: { borderColor: string; shadowColor: string; highlight: string }) {
  return (
    <View
      style={[
        styles.pin,
        {
          backgroundColor: highlight,
          borderColor,
          shadowColor,
        },
      ]}
    />
  );
}

export function MapNativeView() {
  const { neo, neoShadow } = useTheme();

  return (
    <View style={[styles.container, { borderColor: neo.border, borderWidth: 2, borderRadius: 12, overflow: 'hidden', ...neoShadow }]}>
      <MapView style={styles.map} initialRegion={DEFAULT_REGION}>
        {DUMMY_CAPTURES.map((capture) => (
          <Marker
            key={capture.id}
            coordinate={{ latitude: capture.lat, longitude: capture.lng }}
            title={`${capture.detections.length} detection(s)`}
          >
            <NeoMarkerPin borderColor={neo.border} shadowColor={neo.shadow} highlight={neo.highlight} />
            <Callout>
              <View
                style={[
                  styles.callout,
                  {
                    backgroundColor: neo.accentPurple,
                    borderColor: neo.border,
                    borderWidth: 2,
                    ...neoShadow,
                  },
                ]}
              >
                <Text style={[styles.calloutTitle, { color: neo.textInv }]}>
                  {capture.detections.length} detection(s)
                </Text>
                <Text style={[styles.calloutRow, { color: neo.textInv }]}>
                  <Text style={styles.bold}>Animals:</Text>{' '}
                  {capture.detections.map((d) => d.label).join(', ') || '—'}
                </Text>
                <Text style={[styles.calloutRow, { color: neo.textInv }]}>
                  <Text style={styles.bold}>Source:</Text> {sourceLabel(capture.source)}
                </Text>
                <Text style={[styles.calloutRow, { color: neo.textInv }]}>
                  <Text style={styles.bold}>When:</Text> {formatTimestamp(capture.timestamp)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pin: {
    width: 24,
    height: 24,
    marginLeft: 2,
    marginTop: 2,
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  map: { width: '100%', height: '100%', borderRadius: 10 },
  callout: {
    minWidth: 180,
    padding: 12,
    borderRadius: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 8,
  },
  calloutRow: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 4,
  },
  bold: { fontWeight: '700', fontFamily: 'Figtree_700Bold' },
});
