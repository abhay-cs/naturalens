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

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, radius: rad, shadows: sh, spacing: sp, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
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
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
            borderRadius: rad.md,
            paddingHorizontal: sp.lg,
            paddingVertical: sp.md,
            ...sh.md,
            opacity: disabled || loading ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[typo.titleSm, styles.text]}>{title}</Text>
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
  text: {
    color: '#fff',
  },
});
