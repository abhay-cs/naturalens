import { View, Text, StyleSheet } from 'react-native';
import { Colors, ConservationColors } from '../theme/colors';
import { Spacing, BorderRadii, Typography } from '../theme/spacing';
import type { ConservationStatus } from '../types';

interface ConservationBadgeProps {
  status: ConservationStatus;
}

export function ConservationBadge({ status }: ConservationBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: ConservationColors[status] }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.pill,
  },
  text: {
    ...Typography.caption,
    color: Colors.white,
  },
});
