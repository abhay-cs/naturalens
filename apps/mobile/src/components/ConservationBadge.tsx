import { View, Text, StyleSheet } from 'react-native';
import { Colors, ConservationForms } from '../theme/colors';
import { Spacing, BorderRadii, Typography } from '../theme/spacing';
import type { ConservationStatus } from '../types';

interface ConservationBadgeProps {
  status: ConservationStatus;
}

export function ConservationBadge({ status }: ConservationBadgeProps) {
  const form = ConservationForms[status];
  const filled = form === 'filled';
  const muted = form === 'muted-outline';

  return (
    <View
      style={[
        styles.badge,
        filled && styles.filled,
        muted && styles.muted,
        !filled && !muted && styles.outline,
      ]}
    >
      <Text
        style={[
          styles.text,
          filled ? styles.textFilled : muted ? styles.textMuted : styles.textOutline,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Colors.fg,
  },
  filled: {
    backgroundColor: Colors.fg,
    borderColor: Colors.fg,
  },
  muted: {
    backgroundColor: 'transparent',
    borderColor: Colors.muted,
  },
  text: {
    ...Typography.caption,
  },
  textOutline: { color: Colors.fg },
  textFilled: { color: Colors.bg },
  textMuted: { color: Colors.muted },
});
