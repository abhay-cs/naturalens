import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, Typography } from '../theme/spacing';
import { Card } from '../components/Card';
import { useAppState } from '../contexts/AppStateContext';
import type { HistoryEntry } from '../types';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;

  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 2 * DAY) return 'Yesterday';

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <Card style={styles.row}>
      <Image source={{ uri: entry.photoUri }} style={styles.thumbnail} />

      <View style={styles.rowText}>
        <Text style={styles.label} numberOfLines={1}>
          {entry.label}
        </Text>
        <Text style={styles.meta}>
          {Math.round(entry.score * 100)}% · {formatRelativeTime(entry.timestamp)}
        </Text>
      </View>
    </Card>
  );
}

export function HistoryScreen() {
  const { history, historyLoading } = useAppState();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
            renderItem={({ item }) => <HistoryRow entry={item} />}
            contentContainerStyle={styles.listContent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
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
    paddingBottom: Spacing.xxxl,
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
