import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { detectInImage } from '../lib/detector';
import { CollectionFilterChips, type CollectionFilterId } from '../components/collection/CollectionFilterChips';
import { SpeciesCard } from '../components/collection/SpeciesCard';
import { COLLECTION_SPECIES, type CollectionSpecies } from '../data/collectionSpecies';

export function CollectionScreen() {
  const [activeFilter, setActiveFilter] = useState<CollectionFilterId>('recent');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad, shadows: sh } = tokens;

  const {
    filterDetections,
    detectorOptions,
    setFrameResults,
    setInitError,
    setVideoDetections,
    setVideoFrameMeta,
  } = useAppState();

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const { uri } = result.assets[0];
    setProcessing(true);
    setInitError(null);

    try {
      const raw = await detectInImage({ uri }, detectorOptions);
      const filtered = filterDetections(raw);
      setFrameResults({ detections: filtered });
      setVideoDetections(null);
      setVideoFrameMeta(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Detection failed. Try again.';
      setInitError(msg);
      setFrameResults(null);
    } finally {
      setProcessing(false);
    }
  }, [
    detectorOptions,
    filterDetections,
    setFrameResults,
    setInitError,
    setVideoDetections,
    setVideoFrameMeta,
  ]);

  const filtered = COLLECTION_SPECIES.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase()),
  );

  const columnGap = sp.xl;
  const horizontalPad = sp.lg;
  const cardWidth = (width - horizontalPad * 2 - columnGap) / 2;

  const renderItem = ({ item }: { item: CollectionSpecies }) => (
    <View style={{ width: cardWidth, marginBottom: sp.xl }}>
      <SpeciesCard
        label={item.label}
        category={item.category}
        imageUrl={item.imageUrl}
        isFavorite={item.isFavorite}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: columnGap }}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: 100 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + sp.lg, paddingBottom: sp.lg }}>
            {/* Title + sort button */}
            <View style={styles.headerRow}>
              <Text style={[typo.titleLg, { color: colors.textMain }]}>Collection</Text>
              <TouchableOpacity
                style={[
                  styles.sortBtn,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    ...sh.sm,
                  },
                ]}
              >
                <Ionicons name="filter" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.surface,
                  borderRadius: rad.lg,
                  marginTop: sp.xl,
                  ...sh.sm,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
              <TextInput
                style={[
                  typo.bodySm,
                  {
                    flex: 1,
                    color: colors.textMain,
                    marginLeft: sp.sm,
                    paddingVertical: sp.md,
                  },
                ]}
                placeholder="Search your field journal..."
                placeholderTextColor={colors.textSecondary + '66'}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filter chips */}
            <View style={{ marginTop: sp.lg }}>
              <CollectionFilterChips active={activeFilter} onSelect={setActiveFilter} />
            </View>

            {/* Grid spacer */}
            <View style={{ height: sp.lg }} />
          </View>
        }
      />

      {/* FAB - add photo */}
      <FAB onPress={pickImage} loading={processing} />
    </View>
  );
}

function FAB({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { tokens } = useTheme();
  const { colors, motion } = tokens;
  const insets = useSafeAreaInsets();
  const scale = new Animated.Value(1);

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          bottom: 80 + insets.bottom,
          backgroundColor: colors.primary,
          transform: [{ scale }],
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 16,
          elevation: 8,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.timing(scale, {
            toValue: 0.92,
            duration: motion.durationShort,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.timing(scale, {
            toValue: 1,
            duration: motion.durationShort,
            useNativeDriver: true,
          }).start()
        }
        style={styles.fabInner}
      >
        <Ionicons name={loading ? 'hourglass' : 'camera'} size={26} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
