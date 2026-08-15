import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadii, Typography } from '../theme/tokens';
import { Display } from '../theme/type';
import { DETAIL_MEDIA_HEIGHT } from '../theme/layout';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ConservationBadge } from '../components/ConservationBadge';
import { SkeletonLines } from '../components/SkeletonLines';
import { CloseIcon } from '../components/icons';
import { useAppState } from '../contexts/AppStateContext';
import { formatRelativeTime } from '../lib/time';
import { formatCoords } from '../lib/location';
import type { HistoryEntry } from '../types';

interface SpeciesDetailScreenProps {
  entry: HistoryEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

/** Screens 15, 16 — one find, full size. */
export function SpeciesDetailScreen({ entry, onClose, onDelete }: SpeciesDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { backfillSpeciesInfo } = useAppState();
  const [lookupFailed, setLookupFailed] = useState(false);

  const missingInfo = !entry.info;

  // Finds saved before species info existed have none. Species facts follow from the label
  // rather than the photo, so we can just go and get them — once, then it's persisted.
  useEffect(() => {
    if (!missingInfo || lookupFailed) return;

    let cancelled = false;

    backfillSpeciesInfo(entry.id, entry.label).catch(() => {
      // Offline, most likely. Leave the retry to the user rather than hammering the API.
      if (!cancelled) setLookupFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [missingInfo, lookupFailed, entry.id, entry.label, backfillSpeciesInfo]);

  const retryLookup = useCallback(() => setLookupFailed(false), []);

  const openInMaps = useCallback(() => {
    if (!entry.location) return;
    const { lat, lon } = entry.location;
    const label = encodeURIComponent(entry.label);
    // Apple Maps takes `maps:`; Android's geo: URI takes a label in the query.
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${lat},${lon}`
        : `geo:${lat},${lon}?q=${lat},${lon}(${label})`;

    Linking.openURL(url).catch(() => undefined);
  }, [entry.location, entry.label]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete this find?',
      `"${entry.label}" and its photo will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
      ],
    );
  }, [entry.id, entry.label, onDelete]);

  const when = formatRelativeTime(entry.timestamp);
  const where = entry.location?.place ?? (entry.location ? null : 'not geotagged');

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <Image source={{ uri: entry.photoUri }} style={styles.photo} resizeMode="cover" />

        <View style={styles.body}>
          <Text style={styles.name}>{entry.label}</Text>
          <Text style={styles.meta}>{where ? `${when} · ${where}` : when}</Text>

          {entry.location && (
            <TouchableOpacity
              style={styles.locationRow}
              onPress={openInMaps}
              accessibilityRole="button"
              accessibilityLabel={`Open ${entry.label}'s location in maps`}
              activeOpacity={0.7}
            >
              {/* A glyph, not a live map — one MapView per find detail is a lot of machinery
                  to say "somewhere with a road through it". */}
              <View style={styles.miniMap}>
                <View style={styles.miniRoad} />
                <View style={styles.miniCross} />
                <View style={styles.miniDot} />
              </View>
              <View>
                <Text style={styles.coords}>{formatCoords(entry.location)}</Text>
                <Text style={styles.openInMap}>Open in map</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.confidence}>
            <ConfidenceBar score={entry.score} />
          </View>

          <Card style={styles.panel}>
            {entry.info ? (
              <>
                <Text style={styles.description}>{entry.info.description}</Text>
                <View style={styles.panelRule} />
                <View style={styles.facts}>
                  <Fact label="Habitat" value={entry.info.habitat} />
                  <Fact label="Diet" value={entry.info.diet} />
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>Status</Text>
                    <ConservationBadge status={entry.info.conservationStatus} />
                  </View>
                </View>
              </>
            ) : (
              /* Screen 16. The skeleton stays put whether we're mid-lookup or the lookup
                 failed — what changes is whether there's a way out underneath it. */
              <>
                <SkeletonLines widths={[100, 88, 46]} color={Colors.border} />
                {lookupFailed && (
                  <>
                    <View style={styles.panelRule} />
                    <View style={styles.retryRow}>
                      <Text style={styles.retryCopy}>
                        Couldn't reach Naturalens. Your find is saved on this phone.
                      </Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={retryLookup}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                      >
                        <Text style={styles.retryLabel}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </Card>

          <Button title="Delete find" variant="destructive" onPress={confirmDelete} />
        </View>
      </ScrollView>

      {/* Absolute, and manually inset: this lives inside a Modal, which is outside the
          SafeAreaView tree the rest of the app sits in. */}
      <TouchableOpacity
        style={[styles.close, { top: insets.top + Spacing.s }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        activeOpacity={0.8}
      >
        <CloseIcon size={15} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingBottom: Spacing.xl,
  },
  photo: {
    width: '100%',
    height: DETAIL_MEDIA_HEIGHT,
    // Square — the photo is the record, and rounding it would make it a card.
    borderRadius: BorderRadii.media,
    backgroundColor: Colors.surface,
  },
  body: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.l,
  },
  name: {
    ...Display.find,
    color: Colors.fg,
  },
  meta: {
    ...Typography.small,
    fontSize: 12,
    color: Colors.caption,
    marginTop: Spacing.xs + 2,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m - 2,
    marginTop: Spacing.m + 2,
  },
  miniMap: {
    width: 84,
    height: 64,
    backgroundColor: '#F2F2F0',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  miniRoad: {
    position: 'absolute',
    left: -10,
    top: 26,
    width: 120,
    height: 1,
    backgroundColor: '#E2E2E0',
    transform: [{ rotate: '-10deg' }],
  },
  miniCross: {
    position: 'absolute',
    left: 38,
    top: 0,
    width: 1,
    height: 64,
    backgroundColor: '#E2E2E0',
  },
  miniDot: {
    position: 'absolute',
    left: 44,
    top: 28,
    width: 8,
    height: 8,
    backgroundColor: Colors.fg,
  },
  coords: {
    ...Typography.small,
    fontSize: 12,
    color: Colors.muted,
  },
  openInMap: {
    ...Typography.small,
    fontSize: 12,
    color: Colors.fg,
    marginTop: 2,
  },

  confidence: {
    marginTop: Spacing.l - 2,
  },
  panel: {
    marginTop: Spacing.l - 2,
    marginBottom: Spacing.l - 2,
    padding: Spacing.m + 2,
  },
  description: {
    ...Typography.small,
    color: Colors.fg,
    lineHeight: 22,
  },
  panelRule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.m,
  },
  facts: {
    gap: Spacing.m - 4,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  factLabel: {
    ...Typography.label,
    width: 74,
    color: Colors.caption,
  },
  factValue: {
    ...Typography.small,
    fontSize: 13,
    flex: 1,
    color: Colors.fg,
  },

  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.m,
  },
  retryCopy: {
    ...Typography.small,
    fontSize: 13,
    flex: 1,
    color: Colors.muted,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: Colors.fg,
    borderRadius: BorderRadii.input,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m - 2,
  },
  retryLabel: {
    ...Typography.label,
    color: Colors.fg,
  },

  close: {
    position: 'absolute',
    left: Spacing.m + 4,
    width: 36,
    height: 36,
    // Square, like the media it sits on.
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
