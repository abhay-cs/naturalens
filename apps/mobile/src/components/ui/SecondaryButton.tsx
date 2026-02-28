import { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function SecondaryButton({ title, onPress, disabled, loading, style }: SecondaryButtonProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, radius: rad, shadows: sh, spacing: sp, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: pressed ? colors.borderSubtle : colors.surfaceMuted,
            borderRadius: rad.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: sp.lg,
            paddingVertical: sp.md,
            ...sh.sm,
            opacity: disabled || loading ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text style={[typo.titleSm, { color: colors.primary }]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
