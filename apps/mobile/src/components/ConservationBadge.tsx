import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadii, Typography } from '../theme/tokens';
import { ConservationForms } from '../theme/conservation';
import type { ConservationStatus } from '../types';

interface ConservationBadgeProps {
  status: ConservationStatus;
}

/**
 * An IUCN category as a small pill — `BorderRadii.input`, never the full pill, which
 * belongs to the screen's one primary action.
 *
 * Outline at the safe end, filled at the severe end. See `ConservationForms` for why the
 * rank is carried by form rather than by seven colours.
 */
export function ConservationBadge({ status }: ConservationBadgeProps) {
  const { form, color } = ConservationForms[status];
  const filled = form === 'filled';

  return (
    <View
      style={[
        styles.badge,
        filled ? { backgroundColor: color } : { borderWidth: 1, borderColor: color },
      ]}
    >
      <Text style={[styles.label, { color: filled ? Colors.bg : color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadii.input,
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.s + 1,
  },
  label: {
    ...Typography.label,
  },
});
