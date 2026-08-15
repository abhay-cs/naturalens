import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';

interface SkeletonLinesProps {
  /** Line widths as percentages, longest first. The default reads as a short paragraph. */
  widths?: number[];
  /** Bar colour — override when the skeleton sits on `surface` rather than `bg`. */
  color?: string;
}

/**
 * Placeholder text — flat bars, no shimmer.
 *
 * The ragged last line is what makes it read as a paragraph rather than a loading widget.
 * Nothing animates: this stands in for species detail that is genuinely waiting on a
 * network call that may never arrive, and a pulse would promise progress we can't see.
 */
export function SkeletonLines({ widths = [100, 92, 54], color = Colors.surface }: SkeletonLinesProps) {
  return (
    <View style={styles.stack}>
      {widths.map((width, i) => (
        <View key={i} style={[styles.line, { width: `${width}%`, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 9,
  },
  line: {
    height: 11,
  },
});
