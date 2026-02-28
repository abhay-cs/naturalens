import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(239,68,68,0.06)',
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: rad.md,
          padding: sp.md,
          marginHorizontal: sp.lg,
          marginVertical: sp.sm,
        },
      ]}
    >
      <Text style={[typo.bodySm, { color: colors.danger, flex: 1 }]}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
