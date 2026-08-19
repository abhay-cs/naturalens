import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, SemanticColors, Spacing, BorderRadii, Typography } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * The four actions Volume One draws.
 *
 * `primary` is the only pill on a screen — that's the radius rule from
 * `packages/design/README.md`, and it's what makes "Save Discovery" or "Grant permission"
 * unmistakable without needing a colour the system doesn't have. Everything secondary is
 * rectangular or plain text.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      activeOpacity={0.75}
    >
      <Text style={[styles.label, labelStyles[variant]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    height: 54,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.fg,
  },
  secondary: {
    height: 54,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.fg,
  },
  // No chrome at all — "Try another" under the primary pill, "Delete find" under a panel.
  quiet: {
    paddingVertical: Spacing.m,
  },
  destructive: {
    paddingVertical: Spacing.m,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...Typography.button,
    textAlign: 'center',
  },
});

const labelStyles = StyleSheet.create({
  primary: { color: Colors.bg },
  secondary: { color: Colors.fg },
  quiet: { ...Typography.small, color: Colors.muted },
  destructive: { ...Typography.small, color: SemanticColors.danger },
});
