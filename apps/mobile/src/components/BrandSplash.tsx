import { useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Motion } from '../theme/typography';

/** How much of the screen's height the owl fills. */
const MARK_HEIGHT = 0.28;

/** Time the mark holds at full opacity before handing off to the app. */
const HOLD_MS = 600;

interface BrandSplashProps {
  /** Fired once the splash has fully faded out, so it can be unmounted. */
  onDone: () => void;
}

/**
 * Shown between the native splash and the camera. Same line owl, same white
 * ground as the native splash, so the two read as one moment.
 */
export function BrandSplash({ onDone }: BrandSplashProps) {
  const { height } = useWindowDimensions();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(Motion.rise)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: Motion.enter,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: Motion.enter,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(fade, {
        toValue: 0,
        duration: Motion.state * 2,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [opacity, translateY, fade, onDone]);

  const markSize = height * MARK_HEIGHT;

  return (
    <Animated.View style={[styles.container, { opacity: fade }]} pointerEvents="none">
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Image
          source={require('../../assets/mark.png')}
          style={{ height: markSize, width: markSize }}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.splashBackground,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
