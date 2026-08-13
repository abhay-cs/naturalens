import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, Typography } from '../theme/spacing';

interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
}

export function ConfidenceIndicator({ score }: ConfidenceIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{clamped}% Match</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  text: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.9,
  },
  barBackground: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadii.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.white,
  },
});
