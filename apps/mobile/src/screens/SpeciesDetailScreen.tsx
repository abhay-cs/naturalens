import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, Typography } from '../theme/spacing';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { ConservationBadge } from '../components/ConservationBadge';
import { useAppState } from '../contexts/AppStateContext';
import { formatRelativeTime } from '../lib/time';
import type { HistoryEntry } from '../types';

interface SpeciesDetailScreenProps {
  entry: HistoryEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export function SpeciesDetailScreen({
  entry,
  onClose,
  onDelete,
}: SpeciesDetailScreenProps) {
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

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete this find?',
      `"${entry.label}" and its photo will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  }, [entry.id, entry.label, onDelete]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <Image source={{ uri: entry.photoUri }} style={styles.photo} resizeMode="cover" />

        <View style={styles.body}>
          <Text style={styles.label}>{entry.label}</Text>
          <Text style={styles.meta}>{formatRelativeTime(entry.timestamp)}</Text>

          <View style={styles.confidenceWrap}>
            <ConfidenceIndicator score={Math.round(entry.score * 100)} />
          </View>

          {entry.info && (
            <Card style={styles.infoCard}>
              <ConservationBadge status={entry.info.conservationStatus} />
              <Text style={styles.description}>{entry.info.description}</Text>
              <Fact label="Habitat" value={entry.info.habitat} />
              <Fact label="Diet" value={entry.info.diet} />
            </Card>
          )}

          {missingInfo && !lookupFailed && (
            <Card style={[styles.infoCard, styles.infoCardCentered]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.noInfo}>Looking up {entry.label}…</Text>
            </Card>
          )}

          {missingInfo && lookupFailed && (
            <Card style={[styles.infoCard, styles.infoCardCentered]}>
              <Text style={styles.noInfo}>
                Couldn't look up {entry.label}. Check your connection.
              </Text>
              <TouchableOpacity onPress={retryLookup} style={styles.retry}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </Card>
          )}

          <Button
            title="Delete"
            variant="danger"
            onPress={confirmDelete}
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>

      {/* Above the ScrollView so it stays put while the photo scrolls under it. Inset by
          hand rather than with SafeAreaView — inside a Modal that's the reliable way. */}
      <View
        style={[styles.closeWrap, { top: insets.top + Spacing.s }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={onClose}
          style={styles.close}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  photo: {
    width: '100%',
    height: 360,
    backgroundColor: Colors.surface,
  },
  body: {
    padding: Spacing.l,
    gap: Spacing.xs,
  },
  label: { ...Typography.h2, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  confidenceWrap: {
    alignSelf: 'flex-start',
    marginTop: Spacing.s,
    // ConfidenceIndicator is built for the camera's dark sheet, where white-on-dark reads
    // fine. On this white page it needs a dark backing to stay legible.
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadii.medium,
  },
  infoCard: {
    marginTop: Spacing.l,
    gap: Spacing.m,
  },
  infoCardCentered: { alignItems: 'center' },
  description: { ...Typography.body, color: Colors.textPrimary },
  noInfo: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  retry: { paddingVertical: Spacing.xs },
  retryText: { ...Typography.subtitle, color: Colors.primary },
  fact: { gap: 2 },
  factLabel: { ...Typography.caption, color: Colors.textSecondary },
  factValue: { ...Typography.subtitle, color: Colors.textPrimary },
  deleteButton: { marginTop: Spacing.xl },
  closeWrap: {
    position: 'absolute',
    left: Spacing.m,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
