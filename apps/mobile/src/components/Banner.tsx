import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, SemanticColors, Spacing, BorderRadii, Typography } from '../theme/tokens';

export type BannerTone = 'neutral' | 'warning' | 'danger' | 'success';

interface BannerProps {
  message: string;
  tone?: BannerTone;
  onDismiss?: () => void;
}

/**
 * A line of status text — offline, rate-limited, failed, recovered.
 *
 * The four tones are the only place in the mobile app permitted to spend a semantic hue
 * (`packages/design/README.md`); page chrome stays black and white. `neutral` doesn't
 * spend one at all — being offline is a condition, not a fault, and it gets the same grey
 * surface as any other panel.
 *
 * The message is the copy `detector.ts` produced, verbatim. Per `docs/DESIGN.md` §5a
 * these strings are written to be read by a person, so nothing here reformats or
 * truncates them.
 */
export function Banner({ message, tone = 'neutral', onDismiss }: BannerProps) {
  const palette = TONES[tone];

  return (
    <TouchableOpacity
      activeOpacity={onDismiss ? 0.7 : 1}
      onPress={onDismiss}
      disabled={!onDismiss}
      accessibilityRole={onDismiss ? 'button' : 'text'}
      accessibilityLabel={onDismiss ? `${message}. Tap to dismiss.` : message}
    >
      <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        <Text style={[styles.text, { color: palette.fg }]}>{message}</Text>
      </View>
    </TouchableOpacity>
  );
}

const TONES: Record<BannerTone, { bg: string; border: string; fg: string }> = {
  neutral: {
    bg: Colors.surface,
    border: Colors.border,
    fg: Colors.fg,
  },
  warning: {
    bg: SemanticColors.warningSoft,
    border: SemanticColors.warningBorder,
    fg: SemanticColors.warning,
  },
  danger: {
    bg: SemanticColors.dangerSoft,
    border: SemanticColors.dangerBorder,
    fg: SemanticColors.danger,
  },
  success: {
    bg: SemanticColors.successSoft,
    border: SemanticColors.successBorder,
    fg: SemanticColors.success,
  },
};

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: BorderRadii.input,
    paddingVertical: Spacing.m - 4,
    paddingHorizontal: Spacing.m - 2,
  },
  text: {
    ...Typography.small,
  },
});
