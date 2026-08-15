import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadii, Typography } from '../theme/tokens';
import { NAV_HEIGHT } from '../theme/layout';
import { CameraIcon, FindsIcon, MapIcon } from './icons';
import type { TabId } from '../contexts/AppStateContext';

/** How the pill separates itself from what's underneath it. */
export type NavChrome = 'floating' | 'bordered';

interface BottomNavigationProps {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
  chrome?: NavChrome;
}

const TABS: { id: TabId; label: string; Icon: typeof CameraIcon }[] = [
  { id: 'camera', label: 'Camera', Icon: CameraIcon },
  { id: 'finds', label: 'Finds', Icon: FindsIcon },
  { id: 'map', label: 'Map', Icon: MapIcon },
];

/**
 * The tab pill.
 *
 * Labelled, because three destinations is one more than an icon alone can carry — and
 * "Finds" as two stacked rows is not a glyph anyone recognises cold.
 *
 * Chrome varies with what's behind it: over the viewfinder or the map it needs a shadow to
 * lift off a busy surface; on a white page a shadow would be the only soft edge on screen,
 * so it takes a hairline border instead.
 */
export function BottomNavigation({ activeTab, onSelect, chrome = 'bordered' }: BottomNavigationProps) {
  return (
    <View style={[styles.bar, chrome === 'floating' ? styles.floating : styles.bordered]}>
      {TABS.map(({ id, label, Icon }) => {
        const active = id === activeTab;
        const color = active ? Colors.fg : Colors.caption;

        return (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            activeOpacity={0.7}
          >
            <Icon color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: NAV_HEIGHT,
    borderRadius: BorderRadii.pill,
    backgroundColor: Colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  floating: {
    shadowColor: Colors.fg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.fg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  label: {
    ...Typography.label,
    // Tracking in the ramp is absolute px against an 11px label; at 9 it has to come down
    // with the size or the word falls apart. 0.14em, same ratio.
    fontSize: 9,
    letterSpacing: 1.26,
  },
});
