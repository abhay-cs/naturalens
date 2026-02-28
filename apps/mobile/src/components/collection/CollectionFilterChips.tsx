import { useRef } from 'react';
import { StyleSheet, ScrollView, Text, Pressable, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CollectionFilterId = 'recent' | 'rare' | 'biome' | 'endangered';

const FILTERS: { id: CollectionFilterId; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'rare', label: 'Rare' },
  { id: 'biome', label: 'By Biome' },
  { id: 'endangered', label: 'Endangered' },
];

interface Props {
  active: CollectionFilterId;
  onSelect: (id: CollectionFilterId) => void;
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
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderRadius: rad.pill,
            borderWidth: isActive ? 0 : 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: sp.xl,
            height: 36,
          },
        ]}
      >
        <Text
          style={[
            typo.caption,
            {
              color: isActive ? '#fff' : colors.textSecondary,
              fontWeight: '600',
            },
          ]}
        >
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function CollectionFilterChips({ active, onSelect }: Props) {
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
