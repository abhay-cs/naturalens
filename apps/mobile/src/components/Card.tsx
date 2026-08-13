import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii } from '../theme/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'outline';
}

export function Card({
  children,
  style,
  variant = 'flat',
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.panel,
    padding: Spacing.l,
  },
  elevated: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
