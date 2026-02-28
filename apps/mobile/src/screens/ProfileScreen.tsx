import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HarmonyCard } from '../components/ui/HarmonyCard';

export function ProfileScreen() {
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, padding: sp.lg }]}>
      <HarmonyCard elevated style={{ alignItems: 'center', paddingVertical: sp['2xl'] }}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primarySoft,
              borderRadius: rad.pill,
            },
          ]}
        >
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={[typo.titleLg, { color: colors.textMain, marginTop: sp.lg }]}>
          Profile
        </Text>
        <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs, textAlign: 'center' }]}>
          Your observations and settings will appear here.
        </Text>
      </HarmonyCard>

      <HarmonyCard bordered style={{ marginTop: sp.lg }}>
        <View style={styles.settingsRow}>
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          <Text style={[typo.body, { color: colors.textMain, marginLeft: sp.md, flex: 1 }]}>
            Settings
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </HarmonyCard>

      <HarmonyCard bordered style={{ marginTop: sp.md }}>
        <View style={styles.settingsRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[typo.body, { color: colors.textMain, marginLeft: sp.md, flex: 1 }]}>
            About NaturaLens
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </HarmonyCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
