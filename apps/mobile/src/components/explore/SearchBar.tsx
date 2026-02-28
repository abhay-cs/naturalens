import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchBarProps {
  speciesCount: number;
  onFilterPress?: () => void;
  onListPress?: () => void;
}

export function SearchBar({ speciesCount, onFilterPress, onListPress }: SearchBarProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: rad.pill,
          ...sh.md,
          paddingLeft: sp.lg,
          paddingRight: sp.sm,
          paddingVertical: sp.md,
        },
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={[typo.titleSm, { color: colors.textMain }]}>My Observations</Text>
        <Text style={[typo.caption, { color: colors.primary }]}>
          {speciesCount} Species Identified
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.iconBtn, { borderRadius: rad.pill }]}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: rad.pill,
            },
          ]}
          onPress={onListPress}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
