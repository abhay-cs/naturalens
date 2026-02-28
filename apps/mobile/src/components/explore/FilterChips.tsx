import { useRef } from 'react';
import { StyleSheet, ScrollView, Text, Pressable, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export type FilterId = 'all' | 'birds' | 'insects' | 'flora';

const FILTERS: { id: FilterId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All Species', icon: 'paw' },
  { id: 'birds', label: 'Birds', icon: 'leaf' },
  { id: 'insects', label: 'Insects', icon: 'bug' },
  { id: 'flora', label: 'Flora', icon: 'flower' },
];

interface FilterChipsProps {
  active: FilterId;
  onSelect: (id: FilterId) => void;
}

function Chip({
  filter,
  isActive,
  onPress,
}: {
  filter: (typeof FILTERS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? colors.primary : colors.surfaceMuted,
            borderRadius: rad.pill,
            borderWidth: isActive ? 0 : 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: sp.lg,
            height: 36,
          },
        ]}
      >
        <Ionicons
          name={filter.icon}
          size={16}
          color={isActive ? '#fff' : colors.textSecondary}
        />
        <Text
          style={[
            typo.caption,
            {
              color: isActive ? '#fff' : colors.textSecondary,
              marginLeft: sp.sm,
            },
          ]}
        >
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function FilterChips({ active, onSelect }: FilterChipsProps) {
  const { tokens } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { gap: tokens.spacing.sm }]}
    >
      {FILTERS.map((f) => (
        <Chip
          key={f.id}
          filter={f}
          isActive={active === f.id}
          onPress={() => onSelect(f.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
