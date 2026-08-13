import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing, BorderRadii, NAV_HEIGHT } from '../theme/spacing';
import type { TabId } from '../contexts/AppStateContext';

const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'camera', icon: 'camera' },
  { id: 'history', icon: 'library' },
];

interface BottomNavigationProps {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}

/** Just the pill. MainLayout decides where it sits. */
export function BottomNavigation({ activeTab, onSelect }: BottomNavigationProps) {
  return (
    <View style={styles.navBar}>
      {TABS.map(({ id, icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity
            key={id}
            style={styles.iconContainer}
            onPress={() => onSelect(id)}
          >
            <Ionicons
              name={icon}
              size={24}
              color={isActive ? Colors.fg : Colors.muted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: Colors.bg,
    borderRadius: BorderRadii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: { padding: Spacing.s },
});
