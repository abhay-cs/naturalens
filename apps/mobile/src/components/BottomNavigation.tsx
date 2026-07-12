import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import type { TabId } from '../contexts/AppStateContext';

const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'camera', icon: 'camera' },
  { id: 'history', icon: 'library' },
];

interface BottomNavigationProps {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}

export function BottomNavigation({ activeTab, onSelect }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
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
                color={isActive ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: Colors.white,
    borderRadius: 40,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: { padding: 8 },
});
