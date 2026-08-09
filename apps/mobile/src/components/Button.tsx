import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/spacing';

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
      activeOpacity={0.8}
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
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  glass: { backgroundColor: Colors.white },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  disabled: { opacity: 0.6 },
  text: Typography.subtitle,
  textPrimary: { color: Colors.white },
  textSecondary: { color: Colors.primary },
  textGlass: { color: Colors.textPrimary },
  textDanger: { color: Colors.error },
});
