import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { BorderRadii, Spacing, Typography } from '../theme/spacing';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color={Colors.fg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.m,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.s,
    borderRadius: BorderRadii.panel,
    backgroundColor: Colors.fg,
    borderWidth: 1,
    borderColor: Colors.fg,
  },
  text: {
    ...Typography.caption,
    flex: 1,
    color: Colors.bg,
  },
});
