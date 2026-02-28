import { useRef } from 'react';
import { StyleSheet, Text, View, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { SpeciesCategory } from '../../types';

const CATEGORY_STYLES: Record<SpeciesCategory, { bg: string; text: string; label: string }> = {
  mammal: { bg: 'rgba(74,124,89,0.12)', text: '#4A7C59', label: 'Mammal' },
  bird: { bg: 'rgba(59,130,246,0.10)', text: '#3B82F6', label: 'Bird' },
  insect: { bg: 'rgba(234,88,12,0.10)', text: '#EA580C', label: 'Insect' },
  flora: { bg: 'rgba(34,197,94,0.12)', text: '#16A34A', label: 'Flora' },
  reptile: { bg: 'rgba(13,148,136,0.10)', text: '#0D9488', label: 'Reptile' },
};

interface Props {
  label: string;
  category: SpeciesCategory;
  imageUrl: string;
  isFavorite: boolean;
  onPress?: () => void;
}

export function SpeciesCard({ label, category, imageUrl, isFavorite, onPress }: Props) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;
  const catStyle = CATEGORY_STYLES[category];

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
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.imageWrapper}>
          <View
            style={[
              styles.imageFrame,
              {
                borderColor: colors.surface,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 16,
                elevation: 4,
              },
            ]}
          >
            <Image source={{ uri: imageUrl }} style={styles.image} />
          </View>
          {isFavorite && (
            <View
              style={[
                styles.starBadge,
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="star" size={12} color="#F59E0B" />
            </View>
          )}
        </View>

        <Text
          style={[typo.titleSm, { color: colors.textMain, textAlign: 'center', marginTop: sp.sm }]}
          numberOfLines={1}
        >
          {label}
        </Text>

        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: catStyle.bg,
              borderRadius: rad.pill,
              marginTop: sp.xs,
              paddingHorizontal: sp.sm,
              paddingVertical: 2,
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: catStyle.text }]}>
            {catStyle.label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
  },
  pressable: {
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  starBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    alignSelf: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Figtree_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
