import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { HomeSearchBar } from '../components/home/HomeSearchBar';
import { HabitatChips } from '../components/home/HabitatChips';
import { SightingCard } from '../components/home/SightingCard';
import { RecentSightingCard } from '../components/home/RecentSightingCard';
import { SPECIES } from '../data/collectionSpecies';
import { RECENT_SIGHTINGS } from '../data/recentSightings';
import type { HabitatId } from '../types';

export function HomeScreen() {
  const [search, setSearch] = useState('');
  const [activeHabitat, setActiveHabitat] = useState<HabitatId>('all');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp } = tokens;
  const { setSelectedSpecies, favoriteSpeciesIds, toggleFavorite } = useAppState();

  const filteredSpecies = useMemo(() => {
    let list = SPECIES;
    if (activeHabitat !== 'all') {
      list = list.filter((s) => s.habitat === activeHabitat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeHabitat, search]);

  const columnGap = sp.md;
  const horizontalPad = sp.lg;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const isFavorite = (speciesId: string) =>
    favoriteSpeciesIds.includes(speciesId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        paddingTop: insets.top + sp.lg,
        paddingHorizontal: horizontalPad,
        paddingBottom: 100 + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting + notification */}
      <View style={styles.header}>
        <Text style={[typo.titleLg, { color: colors.textMain }]}>
          Hi, Explorer 👋
        </Text>
        <TouchableOpacity hitSlop={12} style={styles.bell}>
          <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: sp.lg }}>
        <HomeSearchBar value={search} onChangeText={setSearch} />
      </View>

      <View style={{ marginTop: sp.lg }}>
        <HabitatChips active={activeHabitat} onSelect={setActiveHabitat} />
      </View>

      {/* Featured species grid */}
      <View style={[styles.section, { marginTop: sp.xl }]}>
        <View style={[styles.grid, { gap: columnGap }]}>
          {filteredSpecies.slice(0, 6).map((species) => (
            <View key={species.id} style={{ width: cardWidth, marginBottom: columnGap }}>
              <SightingCard
                species={species}
                isFavorite={isFavorite(species.id) || species.isFavorite}
                onFavoritePress={() => toggleFavorite(species.id)}
                onPress={() => setSelectedSpecies(species)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Sightings */}
      <View style={[styles.section, { marginTop: sp['2xl'] }]}>
        <View style={styles.sectionHeader}>
          <Text style={[typo.titleSm, { color: colors.textMain }]}>
            Recent Sightings
          </Text>
          <TouchableOpacity>
            <Text style={[typo.bodySm, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: sp.md, paddingRight: horizontalPad }}
          style={styles.recentScroll}
        >
          {RECENT_SIGHTINGS.map((sighting) => {
            const species = SPECIES.find((s) => s.id === sighting.speciesId);
            return (
              <RecentSightingCard
                key={sighting.id}
                sighting={sighting}
                isFavorite={isFavorite(sighting.speciesId)}
                onFavoritePress={() => toggleFavorite(sighting.speciesId)}
                onPress={species ? () => setSelectedSpecies(species) : undefined}
              />
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bell: {
    padding: 4,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentScroll: {
    maxHeight: 180,
  },
});
