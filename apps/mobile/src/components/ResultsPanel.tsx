import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { Detection, FrameResults } from '../types';

type FrameLike = FrameResults | {
  detections?: Detection[];
  timestamp?: number;
  frameIndex?: number;
};

interface ResultsPanelProps {
  frame?: FrameLike | null;
  detections?: Detection[];
  emptyMessage?: string;
  /** Compact style for camera tab (floating card) */
  compact?: boolean;
  /** Optional dismiss callback – when provided, shows an X button (compact only) */
  onDismiss?: () => void;
}

export function ResultsPanel({
  frame,
  detections: propDetections,
  emptyMessage = 'No bears detected (above threshold).',
  compact = false,
  onDismiss,
}: ResultsPanelProps) {
  const { neo, neoShadow } = useTheme();
  const detections = propDetections ?? frame?.detections ?? [];

  if (detections.length === 0) {
    return (
      <View
        style={[
          styles.container,
          compact
            ? [
                styles.compact,
                { backgroundColor: neo.surface, borderColor: neo.border, borderWidth: 2, ...neoShadow },
              ]
            : { borderTopColor: neo.border },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: neo.text }]}>Results</Text>
          {compact && onDismiss && (
            <TouchableOpacity onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color={neo.text} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.empty, { color: neo.text }]}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        compact
          ? [
              styles.compact,
              { backgroundColor: neo.surface, borderColor: neo.border, borderWidth: 2, ...neoShadow },
            ]
          : { borderTopColor: neo.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: neo.text }]}>Results</Text>
          <Text style={[styles.stat, { color: neo.accent }]}>
            {detections.length} detection{detections.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {compact && onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={12}>
            <Ionicons name="close" size={22} color={neo.text} />
          </TouchableOpacity>
        )}
      </View>
      {frame?.timestamp != null && !compact && (
        <Text style={[styles.meta, { color: neo.text }]}>
          Frame {frame.frameIndex ?? '—'} · {frame.timestamp?.toFixed(1)}s
        </Text>
      )}
      <ScrollView
        style={compact ? styles.compactScroll : undefined}
        nestedScrollEnabled
        showsVerticalScrollIndicator={compact}
      >
      {detections.map((d, i) => (
        <View
          key={i}
          style={[
            compact ? styles.rowCompact : styles.row,
            {
              backgroundColor: compact ? 'transparent' : neo.surface,
              borderColor: neo.border,
              borderWidth: compact ? 0 : 2,
              ...(compact ? {} : neoShadow),
            },
          ]}
        >
          <Text style={[styles.label, { color: neo.text }]}>{d.label}</Text>
          <Text style={[styles.score, { color: neo.accent }]}>{(d.score * 100).toFixed(1)}%</Text>
          <Text style={[styles.bbox, { color: neo.text }]}>
            x:{d.bbox.x.toFixed(0)} y:{d.bbox.y.toFixed(0)} w:{d.bbox.w.toFixed(0)} h:
            {d.bbox.h.toFixed(0)}
          </Text>
        </View>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 0,
    borderTopWidth: 1,
  },
  compact: {
    borderRadius: 12,
    padding: 12,
    maxHeight: 120,
    borderTopWidth: 0,
  },
  compactScroll: {
    maxHeight: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
  },
  stat: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  meta: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 12,
  },
  empty: {
    fontSize: 15,
    fontFamily: 'Figtree_400Regular',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  rowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  score: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  bbox: {
    fontSize: 12,
    fontFamily: 'Figtree_400Regular',
  },
});
