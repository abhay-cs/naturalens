import { StyleSheet, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HomeSearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}

export function HomeSearchBar({
  value = '',
  onChangeText,
  placeholder = 'Search region, or species...',
}: HomeSearchBarProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: rad.lg,
          paddingHorizontal: sp.lg,
          paddingVertical: sp.md,
          ...sh.sm,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        style={[typo.bodySm, { color: colors.textMain, flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + '99'}
        value={value}
        onChangeText={onChangeText}
        editable={!!onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
