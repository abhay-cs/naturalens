import { useRef } from 'react';
import { StyleSheet, ScrollView, Text, Pressable, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { HabitatId } from '../../types';

const HABITAT_CHIPS: { id: HabitatId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'forest', label: 'Forest', icon: 'leaf' },
  { id: 'ocean', label: 'Ocean', icon: 'water' },
  { id: 'desert', label: 'Desert', icon: 'sunny' },
  { id: 'urban', label: 'Urban', icon: 'business' },
  { id: 'wetland', label: 'Wetland', icon: 'leaf-outline' },
];

interface HabitatChipsProps {
  active: HabitatId;
  onSelect: (id: HabitatId) => void;
}

function Chip({
  habitat,
  isActive,
  onPress,
}: {
  habitat: (typeof HABITAT_CHIPS)[number];
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
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderRadius: rad.pill,
            borderWidth: 1,
            borderColor: isActive ? colors.primary : colors.borderSubtle,
            paddingHorizontal: sp.lg,
            height: 36,
          },
        ]}
      >
        <Ionicons
          name={habitat.icon}
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
          {habitat.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HabitatChips({ active, onSelect }: HabitatChipsProps) {
  const { tokens } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { gap: tokens.spacing.sm }]}
    >
      {HABITAT_CHIPS.map((h) => (
        <Chip
          key={h.id}
          habitat={h}
          isActive={active === h.id}
          onPress={() => onSelect(h.id)}
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
