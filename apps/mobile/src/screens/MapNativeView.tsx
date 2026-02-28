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

function PhotoMarker({ initial, primary, surface }: { initial: string; primary: string; surface: string }) {
  return (
    <View style={[styles.photoMarker, { backgroundColor: surface }]}>
      <Text style={[styles.photoInitial, { color: primary }]}>{initial}</Text>
    </View>
  );
}

function ClusterMarker({ count, primary }: { count: number; primary: string }) {
  return (
    <View style={[styles.clusterMarker, { backgroundColor: primary }]}>
      <Text style={styles.clusterText}>{count}</Text>
    </View>
  );
}

export function MapNativeView() {
  const { tokens } = useTheme();
  const { colors, radius: rad, spacing: sp, typography: typo } = tokens;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={DEFAULT_REGION}>
        {DUMMY_CAPTURES.map((capture) => {
          const topDetection = capture.detections[0];
          const initial = (topDetection?.label ?? 'U')[0];
          const isCluster = capture.detections.length > 1;

          return (
            <Marker
              key={capture.id}
              coordinate={{ latitude: capture.lat, longitude: capture.lng }}
            >
              {isCluster ? (
                <ClusterMarker count={capture.detections.length} primary={colors.primary} />
              ) : (
                <PhotoMarker initial={initial} primary={colors.primary} surface={colors.surface} />
              )}
              <Callout>
                <View
                  style={[
                    styles.callout,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: rad.lg,
                    },
                  ]}
                >
                  <Text style={[typo.titleSm, { color: colors.textMain }]}>
                    {topDetection?.label ?? 'Unknown'}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: colors.primarySoft, borderRadius: rad.pill }]}>
                    <Text style={[typo.caption, { color: colors.primary, fontWeight: '700' }]}>SPECIES</Text>
                  </View>
                  <Text style={[typo.caption, { color: colors.textSecondary, marginTop: sp.xs }]}>
                    {sourceLabel(capture.source)} · {formatTimestamp(capture.timestamp)}
                  </Text>
                  {topDetection && (
                    <View style={[styles.barRow, { marginTop: sp.sm }]}>
                      <View style={[styles.barBg, { backgroundColor: colors.borderSubtle, borderRadius: rad.pill }]}>
                        <View
                          style={{
                            height: '100%',
                            width: `${Math.round(topDetection.score * 100)}%`,
                            backgroundColor: colors.success,
                            borderRadius: rad.pill,
                          }}
                        />
                      </View>
                      <Text style={[typo.caption, { color: colors.success, fontWeight: '700', marginLeft: sp.xs }]}>
                        {Math.round(topDetection.score * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  photoMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  photoInitial: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
  },
  clusterMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  clusterText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
    color: '#fff',
  },
  callout: {
    minWidth: 200,
    padding: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    width: 60,
    height: 4,
    overflow: 'hidden',
  },
});
