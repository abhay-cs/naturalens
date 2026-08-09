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
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadii.large,
    padding: Spacing.l,
  },
  elevated: {
    backgroundColor: Colors.white,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  outline: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
});
