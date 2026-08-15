import { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadii, Motion } from '../theme/tokens';

interface SheetProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The bottom sheet — result, settings.
 *
 * Rounded on the top two corners only (`BorderRadii.panel`); the bottom runs off the
 * screen, so rounding it would draw a corner against nothing. The 34×2 handle is a grab
 * affordance the sheet doesn't honour yet — it reads as dismissible, which it is, by the
 * button inside it.
 *
 * Entrance is the system's `enter` motion: rise `Motion.rise` px while fading in. The
 * generated easing is a CSS `cubic-bezier` string, which React Native's `Animated` can't
 * take, so its four control points are restated below — keep them in step with
 * `motion.easing` in tokens.json.
 */
export function Sheet({ children, style }: SheetProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: Motion.enter,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [Motion.rise, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <View style={styles.handle} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: BorderRadii.panel,
    borderTopRightRadius: BorderRadii.panel,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m + Spacing.xs,
    paddingBottom: Spacing.l + Spacing.xs,
  },
  handle: {
    width: 34,
    height: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.l - 2,
  },
});
