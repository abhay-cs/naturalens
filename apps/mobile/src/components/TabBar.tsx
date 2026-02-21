import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { TabId } from '../contexts/AppStateContext';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'camera', label: 'Camera', icon: 'camera' },
  { id: 'media', label: 'Media', icon: 'images' },
  { id: 'map', label: 'Map', icon: 'map' },
];

interface TabBarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

export function TabBar({ active, onSelect }: TabBarProps) {
  const { neo } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: neo.surface, borderTopColor: neo.border }]}>
      {TABS.map(({ id, label, icon }) => {
        const isActive = active === id;
        const color = isActive ? neo.accent : neo.text;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.tab, isActive && { backgroundColor: 'transparent' }]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={28} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 2,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Figtree_600SemiBold',
    marginTop: 4,
  },
});
