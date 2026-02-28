import { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { SightingCard } from '../components/home/SightingCard';
import { SPECIES } from '../data/collectionSpecies';

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp } = tokens;
  const { favoriteSpeciesIds, toggleFavorite, setSelectedSpecies } = useAppState();

  const favorites = useMemo(
    () => SPECIES.filter((s) => favoriteSpeciesIds.includes(s.id) || s.isFavorite),
    [favoriteSpeciesIds]
  );

  const columnGap = sp.md;
  const horizontalPad = sp.lg;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const isFavorite = (speciesId: string) => favoriteSpeciesIds.includes(speciesId);

  const renderItem = ({ item }: { item: (typeof favorites)[number] }) => (
    <View style={{ width: cardWidth, marginBottom: columnGap }}>
      <SightingCard
        species={item}
        isFavorite={isFavorite(item.id) || item.isFavorite}
        onFavoritePress={() => toggleFavorite(item.id)}
        onPress={() => setSelectedSpecies(item)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: columnGap }}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: insets.top + sp.lg,
          paddingBottom: 100 + insets.bottom,
        }}
        ListHeaderComponent={
          <Text style={[typo.titleLg, { color: colors.textMain, marginBottom: sp.xl }]}>
            Favorites
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={56} color={colors.textSecondary} />
            <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.lg, textAlign: 'center' }]}>
              No favorites yet
            </Text>
            <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs, textAlign: 'center' }]}>
              Tap the heart on species cards to save them here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
