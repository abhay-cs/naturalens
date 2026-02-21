import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { neo, neoShadow } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: neo.border,
          borderWidth: 2,
          ...neoShadow,
        },
      ]}
    >
      <Text style={[styles.text, { color: neo.error }]}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={20} color={neo.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  text: { flex: 1, fontSize: 14, fontFamily: 'Figtree_400Regular' },
});
