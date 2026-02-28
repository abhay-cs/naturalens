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
  compact?: boolean;
  onDismiss?: () => void;
}

export function ResultsPanel({
  frame,
  detections: propDetections,
  emptyMessage = 'No bears detected (above threshold).',
  compact = false,
  onDismiss,
}: ResultsPanelProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;
  const detections = propDetections ?? frame?.detections ?? [];

  const compactContainer = [
    styles.compact,
    {
      backgroundColor: colors.surface,
      borderRadius: rad.lg,
      ...sh.md,
      padding: sp.md,
    },
  ];

  const standardContainer = [
    styles.container,
    { borderTopColor: colors.borderSubtle },
  ];

  if (detections.length === 0) {
    return (
      <View style={compact ? compactContainer : standardContainer}>
        <View style={styles.headerRow}>
          <Text style={[typo.titleSm, { color: colors.textMain }]}>Results</Text>
          {compact && onDismiss && (
            <TouchableOpacity onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[typo.bodySm, { color: colors.textSecondary }]}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={compact ? compactContainer : standardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={[typo.titleSm, { color: colors.textMain }]}>Results</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.primarySoft,
                borderRadius: rad.pill,
                paddingHorizontal: sp.md,
                paddingVertical: sp.xs,
              },
            ]}
          >
            <Text style={[typo.caption, { color: colors.primary }]}>
              {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {compact && onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {frame?.timestamp != null && !compact && (
        <Text style={[typo.caption, { color: colors.textSecondary, marginBottom: sp.md }]}>
          Frame {frame.frameIndex ?? '—'} · {frame.timestamp?.toFixed(1)}s
        </Text>
      )}
      <ScrollView
        style={compact ? styles.compactScroll : undefined}
        nestedScrollEnabled
        showsVerticalScrollIndicator={compact}
      >
        {detections.map((d, i) => {
          const scoreColor = d.score >= 0.7 ? colors.success : colors.danger;
          return compact ? (
            <View key={i} style={[styles.rowCompact, { paddingVertical: sp.sm }]}>
              <Text style={[typo.bodySm, { color: colors.textMain }]}>{d.label}</Text>
              <Text style={[typo.bodySm, { color: scoreColor, marginLeft: sp.sm }]}>
                {(d.score * 100).toFixed(1)}%
              </Text>
            </View>
          ) : (
            <View
              key={i}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: rad.md,
                  padding: sp.lg,
                  marginBottom: sp.sm,
                },
              ]}
            >
              <View style={styles.rowTop}>
                <Text style={[typo.titleSm, { color: colors.textMain }]}>{d.label}</Text>
                <Text style={[typo.bodySm, { color: scoreColor }]}>
                  {(d.score * 100).toFixed(1)}%
                </Text>
              </View>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: sp.xs }]}>
                x:{d.bbox.x.toFixed(0)} y:{d.bbox.y.toFixed(0)} w:{d.bbox.w.toFixed(0)} h:
                {d.bbox.h.toFixed(0)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  compact: {
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
    alignItems: 'center',
    gap: 8,
  },
  badge: {},
  row: {},
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
