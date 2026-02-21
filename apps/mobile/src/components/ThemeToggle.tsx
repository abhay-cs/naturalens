import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  /** Use white icons (e.g. on dark overlay) */
  light?: boolean;
}

export function ThemeToggle({ light }: ThemeToggleProps) {
  const { theme, setTheme, neo, neoShadowSm } = useTheme();
  const color = light ? '#fff' : neo.text;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: light ? 'rgba(0,0,0,0.35)' : neo.surface,
          borderColor: light ? neo.border : neo.border,
          borderWidth: 2,
          ...neoShadowSm,
        },
      ]}
      onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {theme === 'light' ? (
        <Ionicons name="moon" size={20} color={color} />
      ) : (
        <Ionicons name="sunny" size={20} color={color} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
