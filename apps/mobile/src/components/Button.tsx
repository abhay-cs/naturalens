import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { BorderRadii, Typography } from '../theme/spacing';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'glass' && styles.glass,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.textPrimary,
          variant === 'secondary' && styles.textSecondary,
          variant === 'glass' && styles.textGlass,
          variant === 'danger' && styles.textDanger,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.fg,
    borderRadius: BorderRadii.pill,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.fg,
    borderRadius: BorderRadii.input,
  },
  glass: {
    backgroundColor: Colors.bg,
    borderRadius: BorderRadii.pill,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.fg,
    borderRadius: BorderRadii.input,
  },
  disabled: { opacity: 0.4 },
  text: Typography.button,
  textPrimary: { color: Colors.bg },
  textSecondary: { color: Colors.fg },
  textGlass: { color: Colors.fg },
  textDanger: { color: Colors.fg },
});
