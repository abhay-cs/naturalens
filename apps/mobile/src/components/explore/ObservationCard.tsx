import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PrimaryButton } from '../ui/PrimaryButton';
import type { Capture } from '../../types';

interface ObservationCardProps {
  capture: Capture;
  onDetails?: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function categoryLabel(label: string): string {
  const lower = label.toLowerCase();
  if (['bear', 'fox', 'deer', 'wolf', 'rabbit'].includes(lower)) return 'MAMMAL';
  if (['eagle', 'owl', 'robin', 'hawk'].includes(lower)) return 'BIRD';
  return 'SPECIES';
}

export function ObservationCard({ capture, onDetails }: ObservationCardProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;

  const topDetection = capture.detections[0];
  if (!topDetection) return null;

  const confidence = topDetection.score;
  const category = categoryLabel(topDetection.label);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: rad.lg,
          ...sh.md,
          padding: sp.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.thumbnail,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: rad.md,
            },
          ]}
        >
          <Ionicons name="paw" size={32} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[typo.titleMd, { color: colors.textMain, flex: 1 }]}>
              {topDetection.label}
            </Text>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </View>

          <View style={[styles.metaRow, { marginTop: sp.xs }]}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primarySoft,
                  borderRadius: rad.pill,
                  paddingHorizontal: sp.sm,
                  paddingVertical: 2,
                },
              ]}
            >
              <Text style={[typo.caption, { color: colors.primary, fontWeight: '700' }]}>
                {category}
              </Text>
            </View>
            <View style={styles.dateWrap}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={[typo.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {formatDate(capture.timestamp)}
              </Text>
            </View>
          </View>

          <View style={[styles.bottomRow, { marginTop: sp.md }]}>
            <View>
              <Text
                style={[
                  typo.caption,
                  {
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: '600',
                  },
                ]}
              >
                Confidence
              </Text>
              <View style={[styles.barRow, { marginTop: sp.xs }]}>
                <View
                  style={[
                    styles.barBg,
                    { backgroundColor: colors.borderSubtle, borderRadius: rad.pill },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.success,
                        borderRadius: rad.pill,
                        width: `${Math.round(confidence * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    typo.caption,
                    { color: colors.success, fontWeight: '700', marginLeft: sp.sm },
                  ]}
                >
                  {Math.round(confidence * 100)}%
                </Text>
              </View>
            </View>

            <PrimaryButton title="Details" onPress={onDetails ?? (() => {})} style={styles.detailsBtn} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {},
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    width: 60,
    height: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  detailsBtn: {
    minWidth: 90,
  },
});
