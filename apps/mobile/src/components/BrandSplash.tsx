import { useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../theme/colors';

/** How much of the screen's height the owl fills. */
const MARK_HEIGHT = 0.42;

/** The mark is tall and narrow — cropped tight to the ink, so this is the real shape. */
const MARK_ASPECT = 0.5433;

/** Time the mark holds at full size before handing off to the app. */
const HOLD_MS = 600;

interface BrandSplashProps {
  /** Fired once the splash has fully faded out, so it can be unmounted. */
  onDone: () => void;
}

/**
 * Shown between the native splash and the camera. Same owl, same tan ground as the
 * native splash, so the two read as one moment rather than two screens.
 */
export function BrandSplash({ onDone }: BrandSplashProps) {
  const { height } = useWindowDimensions();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(fade, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [opacity, scale, fade, onDone]);

  const markHeight = height * MARK_HEIGHT;

  return (
    <Animated.View style={[styles.container, { opacity: fade }]} pointerEvents="none">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../../assets/mark.png')}
          style={{ height: markHeight, width: markHeight * MARK_ASPECT }}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
