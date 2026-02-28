import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { HarmonyCard } from '../components/ui/HarmonyCard';
import { SPECIES } from '../data/collectionSpecies';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;
  const { favoriteSpeciesIds } = useAppState();

  const favoritesCount = new Set([
    ...favoriteSpeciesIds,
    ...SPECIES.filter((s) => s.isFavorite).map((s) => s.id),
  ]).size;
  const speciesCount = SPECIES.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, padding: sp.lg, paddingTop: insets.top + sp.lg }]}>
      <HarmonyCard elevated style={{ alignItems: 'center', paddingVertical: sp.xl }}>
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
          Explorer
        </Text>
        <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs, textAlign: 'center' }]}>
          Your observations and settings will appear here.
        </Text>
        <View style={[styles.statsRow, { marginTop: sp.xl, gap: sp.xl }]}>
          <View style={styles.stat}>
            <Text style={[typo.titleMd, { color: colors.primary }]}>{speciesCount}</Text>
            <Text style={[typo.caption, { color: colors.textSecondary }]}>Species</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[typo.titleMd, { color: colors.primary }]}>{favoritesCount}</Text>
            <Text style={[typo.caption, { color: colors.textSecondary }]}>Favorites</Text>
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
