import { View, StyleSheet, ViewStyle } from 'react-native';
import { Spacing } from '../theme/tokens';
import { useAppState } from '../contexts/AppStateContext';
import { Banner } from './Banner';

interface BannerStackProps {
  style?: ViewStyle;
}

/**
 * Every current status message, oldest at the top.
 *
 * Placed by each screen rather than by `MainLayout`, because the right spot differs: over
 * the viewfinder it floats near the status bar, on Finds it sits under the header rule,
 * on the map it tucks below the header card. A single global position would be wrong on
 * two screens out of three.
 */
export function BannerStack({ style }: BannerStackProps) {
  const { banners, dismissBanner } = useAppState();

  if (banners.length === 0) return null;

  return (
    <View style={[styles.stack, style]}>
      {banners.map((banner) => (
        <Banner
          key={banner.id}
          message={banner.message}
          tone={banner.tone}
          onDismiss={() => dismissBanner(banner.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.s + 2,
  },
});
