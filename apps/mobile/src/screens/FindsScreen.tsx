import { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadii, Typography } from '../theme/tokens';
import { Display } from '../theme/type';
import { bottomClearance, LIST_THUMB } from '../theme/layout';
import { BannerStack } from '../components/BannerStack';
import { OwlMark } from '../components/OwlMark';
import { useAppState } from '../contexts/AppStateContext';
import { formatRelativeTime } from '../lib/time';
import { SettingsSheet } from './SettingsSheet';
import type { HistoryEntry } from '../types';

/** Screens 10, 11, 18 — the log of what's been found. */
export function FindsScreen() {
  const insets = useSafeAreaInsets();
  const { history, historyLoading, setSelectedEntryId } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const clearance = bottomClearance(insets.bottom);
  const isEmpty = !historyLoading && history.length === 0;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Detections</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="About Naturalens"
        >
          <OwlMark size={17} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.banners}>
        <BannerStack />
      </View>

      {!isEmpty && (
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {history.length} {history.length === 1 ? 'find' : 'finds'}
          </Text>
        </View>
      )}

      {isEmpty ? (
        <View style={styles.empty}>
          <OwlMark size={40} color={Colors.border} />
          <Text style={styles.emptyCopy}>
            No animals detected yet — tap the camera tab to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FindRow entry={item} onPress={() => setSelectedEntryId(item.id)} />
          )}
          contentContainerStyle={{ paddingBottom: clearance }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        findCount={history.length}
      />
    </SafeAreaView>
  );
}

function FindRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  // Falls back to the full photo for finds saved before thumbnails existed — the backfill
  // in AppStateContext will catch up, and a slow row beats a blank one.
  const source = { uri: entry.thumbUri ?? entry.photoUri };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.label}, ${Math.round(entry.score * 100)} percent match`}
      activeOpacity={0.7}
    >
      <Image source={source} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.label}
        </Text>
        <Text style={styles.rowMeta}>
          {Math.round(entry.score * 100)}% · {formatRelativeTime(entry.timestamp)}
        </Text>
      </View>
      {/* Location can never be backfilled, so its absence is permanent and worth stating
          rather than leaving as an unexplained gap on the map. */}
      {!entry.location && <Text style={styles.rowFlag}>On phone</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
  },
  title: {
    ...Display.screen,
    color: Colors.fg,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banners: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
  },
  meta: {
    marginTop: Spacing.l,
    marginHorizontal: Spacing.l,
    paddingBottom: Spacing.m - 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaText: {
    ...Typography.label,
    color: Colors.caption,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.l - 4,
  },
  emptyCopy: {
    ...Typography.small,
    color: Colors.muted,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.m - 2,
    paddingHorizontal: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumb: {
    width: LIST_THUMB,
    height: LIST_THUMB,
    // Square: `BorderRadii.media` is 0. Photographs are documents, not chips.
    borderRadius: BorderRadii.media,
    backgroundColor: Colors.surface,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    ...Typography.subtitle,
    color: Colors.fg,
  },
  rowMeta: {
    ...Typography.small,
    fontSize: 12,
    color: Colors.caption,
    marginTop: 3,
  },
  rowFlag: {
    ...Typography.label,
    color: Colors.caption,
  },
});
