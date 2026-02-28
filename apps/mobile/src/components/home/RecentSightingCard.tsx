import { useRef } from 'react';
import { StyleSheet, View, Image, Pressable, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Sighting } from '../../types';

interface RecentSightingCardProps {
  sighting: Sighting;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

const CARD_WIDTH = 140;
const CARD_HEIGHT = 160;

export function RecentSightingCard({
  sighting,
  onPress,
  isFavorite,
  onFavoritePress,
}: RecentSightingCardProps) {
  const { tokens } = useTheme();
  const { typography: typo, spacing: sp, radius: rad, motion } = tokens;
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
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: rad.lg, transform: [{ scale }] }]}>
        <Image source={{ uri: sighting.imageUrl }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.gradient}
          pointerEvents="none"
        />
        {onFavoritePress && (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              onFavoritePress();
            }}
            style={[styles.heart, { top: sp.xs, right: sp.xs }]}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#EF4444' : '#fff'}
            />
          </Pressable>
        )}
        <View style={[styles.footer, { padding: sp.sm }]} pointerEvents="none">
          <Text style={[typo.caption, { color: '#fff', fontWeight: '600' }]} numberOfLines={1}>
            {sighting.label}
          </Text>
          <View style={styles.regionRow}>
            <Ionicons name="location" size={10} color="rgba(255,255,255,0.85)" />
            <Text style={[typo.caption, { color: 'rgba(255,255,255,0.85)', marginLeft: 4, fontSize: 10 }]} numberOfLines={1}>
              {sighting.region}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  card: {
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
    height: '50%',
  },
  heart: {
    position: 'absolute',
    zIndex: 2,
    padding: 2,
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
