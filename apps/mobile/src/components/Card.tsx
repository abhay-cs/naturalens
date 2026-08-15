import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Spacing, BorderRadii } from '../theme/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'panel' | 'outline';
}

/**
 * A panel — `BorderRadii.panel` (8px), the only rounded rectangle in the system.
 *
 * `panel` is the grey inset used to hold species detail on a white page. `outline` is
 * white with a hairline rule, for cards that float over something (the map header, the
 * pin preview) where a grey fill would disappear into the terrain.
 *
 * Neither casts a shadow by default. Depth in Volume One comes from contrast and space;
 * the two places that do lift — the tab pill and the pin preview — add it themselves.
 */
export function Card({ children, variant = 'panel', style, ...rest }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadii.panel,
    padding: Spacing.l,
  },
  panel: {
    backgroundColor: Colors.surface,
  },
  outline: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
