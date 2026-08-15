import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Motion, Typography } from '../theme/tokens';
import { Display } from '../theme/type';
import { OwlMark } from './OwlMark';

interface BrandSplashProps {
  onDone: () => void;
}

/**
 * Screen 01 — the mark, the wordmark, and the volume.
 *
 * Shares its white ground and its mark with the native splash, so the handoff reads as one
 * moment rather than two screens (`docs/DESIGN.md` §6). The native splash shows a static
 * owl on white; this fades the same owl in over it, holds, and lifts.
 *
 * Timings come from `Motion`: `enter` to arrive, `enter + stagger` to hold, `state` to
 * leave. Scale overshoots slightly on the way in — `Easing.back` — which is the one place
 * the system permits a flourish.
 */
export function BrandSplash({ onDone }: BrandSplashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: Motion.enter,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: Motion.enter + Motion.stagger * 2,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(Motion.enter + Motion.stagger * 2),
      Animated.timing(opacity, {
        toValue: 0,
        duration: Motion.state,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [opacity, scale, onDone]);

  return (
    <Animated.View style={[styles.fill, { opacity }]} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <OwlMark size={88} color={Colors.fg} />
        </Animated.View>
        <Text style={styles.wordmark}>Naturalens</Text>
      </View>
      <Text style={styles.volume}>Volume One</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    zIndex: 10,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.l,
  },
  wordmark: {
    ...Display.splash,
    color: Colors.fg,
  },
  volume: {
    ...Typography.label,
    position: 'absolute',
    bottom: Spacing.xl + Spacing.m,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: Colors.caption,
  },
});
