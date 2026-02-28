import { useRef } from 'react';
import { StyleSheet, View, Image, Pressable, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Species } from '../../types';

interface SightingCardProps {
  species: Species;
  onPress: () => void;
  onFavoritePress?: () => void;
  /** Used by FavoritesScreen to derive isFavorite from context */
  isFavorite?: boolean;
}

export function SightingCard({ species, onPress, onFavoritePress, isFavorite }: SightingCardProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const favorited = isFavorite ?? species.isFavorite;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.98,
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
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.card, { borderRadius: rad.lg, transform: [{ scale }] }]}>
        <Image source={{ uri: species.imageUrl }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
          pointerEvents="none"
        />
        {onFavoritePress && (
          <Pressable
            hitSlop={12}
            onPress={(e) => {
              e.stopPropagation();
              onFavoritePress();
            }}
            style={[styles.heart, { top: sp.sm, right: sp.sm }]}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={favorited ? '#EF4444' : '#fff'}
            />
          </Pressable>
        )}
        <View style={[styles.footer, { padding: sp.md }]} pointerEvents="none">
          <Text style={[typo.titleSm, { color: '#fff' }]} numberOfLines={1}>
            {species.label}
          </Text>
          <View style={styles.regionRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={[typo.caption, { color: 'rgba(255,255,255,0.9)', marginLeft: sp.xs }]} numberOfLines={1}>
              {species.region}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 180,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  heart: {
    position: 'absolute',
    zIndex: 2,
    padding: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});
