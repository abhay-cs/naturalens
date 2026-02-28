import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onMyLocation?: () => void;
  onLayers?: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onMyLocation, onLayers }: MapControlsProps) {
  const { tokens } = useTheme();
  const { colors, radius: rad, shadows: sh, spacing: sp } = tokens;

  const btnStyle = {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.zoomGroup,
          {
            backgroundColor: colors.surface,
            borderRadius: rad.md,
            ...sh.sm,
          },
        ]}
      >
        <TouchableOpacity style={btnStyle} onPress={onZoomIn} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
        <TouchableOpacity style={btnStyle} onPress={onZoomOut} activeOpacity={0.7}>
          <Ionicons name="remove" size={22} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          btnStyle,
          {
            backgroundColor: colors.surface,
            borderRadius: rad.md,
            ...sh.sm,
          },
        ]}
        onPress={onMyLocation}
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          btnStyle,
          {
            backgroundColor: colors.surface,
            borderRadius: rad.md,
            ...sh.sm,
            marginTop: sp.sm,
          },
        ]}
        onPress={onLayers}
        activeOpacity={0.7}
      >
        <Ionicons name="layers-outline" size={20} color={colors.textMain} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: 'center',
  },
  zoomGroup: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    width: 24,
    alignSelf: 'center',
  },
});
