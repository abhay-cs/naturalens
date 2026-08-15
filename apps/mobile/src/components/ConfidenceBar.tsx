import { View, Text, StyleSheet } from 'react-native';
import { Colors, InvertedColors, Spacing, Typography } from '../theme/tokens';

interface ConfidenceBarProps {
  /** Confidence, 0 to 1 — the range `Detection.score` is clamped to. */
  score: number;
  /** `light` for a white page, `dark` for the viewfinder. */
  tone?: 'light' | 'dark';
}

/**
 * CONFIDENCE ————————————— 92%, over a 2px rule that fills to match.
 *
 * A bar, not a colour: the score is self-reported by the model and uncalibrated
 * (`docs/DESIGN.md` §3), so a green/amber spectrum would dress a hint up as a measurement.
 * Length is honest about being a rough quantity in a way that hue is not.
 *
 * The `tone` prop is why this replaced `ConfidenceIndicator`, which was white-on-dark only
 * and had to be hacked onto a dark chip to appear on the find detail.
 */
export function ConfidenceBar({ score, tone = 'light' }: ConfidenceBarProps) {
  const palette = tone === 'dark' ? InvertedColors : Colors;
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);

  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: palette.muted }]}>Confidence</Text>
        <Text style={[styles.label, { color: palette.fg }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: palette.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: palette.fg }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.label,
  },
  track: {
    height: 2,
    marginTop: Spacing.s,
  },
  fill: {
    height: 2,
  },
});
