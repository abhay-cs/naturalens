import { useRef } from 'react';
import { StyleSheet, View, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { TabId } from '../contexts/AppStateContext';

/** Main pill nav: 4 tabs only; camera is a separate disconnected button */
const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap; iconActive?: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', icon: 'home-outline', iconActive: 'home' },
  { id: 'map', icon: 'location-outline', iconActive: 'location' },
  { id: 'favorites', icon: 'heart-outline', iconActive: 'heart' },
  { id: 'profile', icon: 'person-outline', iconActive: 'person' },
];

const FLOATING_BAR = {
  background: 'rgba(28, 28, 28, 0.98)',
  activeCircle: '#FFFFFF',
  inactiveCircle: 'rgba(70, 70, 70, 0.95)',
  iconColor: '#FFFFFF',
  activeIconColor: '#1A1A1A',
};

const CAMERA_PILL_BG = '#0D0D0D';

interface TabBarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

function TabItem({
  id,
  icon,
  iconActive,
  isActive,
  onSelect,
}: {
  id: TabId;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onSelect: (id: TabId) => void;
}) {
  const { tokens } = useTheme();
  const { motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;
  const iconName = (isActive && iconActive ? iconActive : icon) as keyof typeof Ionicons.glyphMap;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.88,
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
      <Animated.View
        style={[
          styles.tabInner,
          {
            backgroundColor: isActive ? FLOATING_BAR.activeCircle : FLOATING_BAR.inactiveCircle,
            transform: [{ scale }],
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={24}
          color={isActive ? FLOATING_BAR.activeIconColor : FLOATING_BAR.iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <View style={[styles.container, { backgroundColor: FLOATING_BAR.background }]}>
      {TABS.map(({ id, icon, iconActive }) => (
        <TabItem
          key={id}
          id={id}
          icon={icon}
          iconActive={iconActive}
          isActive={active === id}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

/** Disconnected camera button: same dark style, sits to the right of the pill, slightly higher */
interface CameraNavButtonProps {
  isActive: boolean;
  onPress: () => void;
}

export function CameraNavButton({ isActive, onPress }: CameraNavButtonProps) {
  const { tokens } = useTheme();
  const { motion } = tokens;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.88,
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cameraBtnWrap}
    >
      <Animated.View
        style={[
          styles.cameraBtn,
          {
            backgroundColor: CAMERA_PILL_BG,
            transform: [{ scale }],
          },
        ]}
      >
        <Ionicons
          name={isActive ? 'camera' : 'camera-outline'}
          size={22}
          color={FLOATING_BAR.iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 3,
    height: 68,
    maxWidth: 299,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    width: 66,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnWrap: {
    marginLeft: 14,
    width: 68,
    height: 68,
  },
  cameraBtn: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
