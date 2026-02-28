import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface HarmonyCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use shadows.md instead of shadows.sm */
  elevated?: boolean;
  /** Add internal padding (default true) */
  padded?: boolean;
  /** Show 1px borderSubtle border */
  bordered?: boolean;
}

export function HarmonyCard({
  children,
  style,
  elevated = false,
  padded = true,
  bordered = false,
}: HarmonyCardProps) {
  const { tokens } = useTheme();
  const { colors, radius: rad, shadows: sh, spacing: sp } = tokens;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: rad.lg,
          ...(elevated ? sh.md : sh.sm),
          ...(bordered && { borderWidth: 1, borderColor: colors.borderSubtle }),
          ...(padded && { padding: sp.lg }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
