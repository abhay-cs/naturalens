import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, Typography, NAV_HEIGHT } from '../theme/spacing';
import { Card } from '../components/Card';
import { useAppState } from '../contexts/AppStateContext';
import { formatRelativeTime } from '../lib/time';
import type { HistoryEntry } from '../types';

function HistoryRow({
  entry,
  onPress,
}: {
  entry: HistoryEntry;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.row}>
        {/* Falls back to the full photo only until the thumbnail backfill reaches this row. */}
        <Image
          source={{ uri: entry.thumbUri ?? entry.photoUri }}
          style={styles.thumbnail}
        />

        <View style={styles.rowText}>
          <Text style={styles.label} numberOfLines={1}>
            {entry.label}
          </Text>
          <Text style={styles.meta}>
            {Math.round(entry.score * 100)}% · {formatRelativeTime(entry.timestamp)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </Card>
    </TouchableOpacity>
  );
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, historyLoading, setSelectedEntryId } = useAppState();

  // The tab bar floats over the list, so the last row has to be scrolled clear of it by
  // hand — otherwise it sits underneath and looks cut off.
  const bottomClearance = insets.bottom + Spacing.l + NAV_HEIGHT + Spacing.m;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detections</Text>
      </View>

      {historyLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item }) => (
            <HistoryRow entry={item} onPress={() => setSelectedEntryId(item.id)} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomClearance }]}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>
                No animals detected yet — tap the camera tab to get started.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.l,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    gap: Spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.m,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadii.medium,
    backgroundColor: Colors.surface,
  },
  rowText: { flex: 1, gap: Spacing.xs },
  label: { ...Typography.subtitle, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary },
});
