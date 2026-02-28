import { useRef } from 'react';
import { StyleSheet, View, Pressable, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { TabId } from '../contexts/AppStateContext';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'explore', label: 'Explore', icon: 'map-outline' },
  { id: 'identify', label: 'Identify', icon: 'camera-outline' },
  { id: 'collection', label: 'Collection', icon: 'albums-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
];

interface TabBarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

function TabItem({
  id,
  label,
  icon,
  isActive,
  onSelect,
}: {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onSelect: (id: TabId) => void;
}) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;
  const color = isActive ? colors.primary : colors.textSecondary;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.92,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.durationShort,
      easing: motion.easingStandard,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      style={styles.tab}
      onPress={() => onSelect(id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {isActive && (
          <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        )}
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[typo.caption, { color, marginTop: sp.xs }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ active, onSelect }: TabBarProps) {
  const { tokens } = useTheme();
  const { colors, spacing: sp } = tokens;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          paddingVertical: sp.sm,
        },
      ]}
    >
      {TABS.map(({ id, label, icon }) => (
        <TabItem
          key={id}
          id={id}
          label={label}
          icon={icon}
          isActive={active === id}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
});
