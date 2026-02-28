import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  light?: boolean;
}

export function ThemeToggle({ light }: ThemeToggleProps) {
  const { theme, setTheme, tokens } = useTheme();
  const { colors, shadows: sh, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.9,
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

  const color = light ? '#fff' : colors.textSecondary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.btn,
          light
            ? { backgroundColor: 'rgba(15,23,42,0.6)' }
            : {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                ...sh.sm,
              },
        ]}
        onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {theme === 'light' ? (
          <Ionicons name="moon" size={18} color={color} />
        ) : (
          <Ionicons name="sunny" size={18} color={color} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
