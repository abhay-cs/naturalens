import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import type { Species } from '../types';

interface SpeciesDetailScreenProps {
  species: Species;
  onClose: () => void;
}

const HERO_HEIGHT_RATIO = 0.42;

export function SpeciesDetailScreen({ species, onClose }: SpeciesDetailScreenProps) {
  const [observationNotes, setObservationNotes] = useState('');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;
  const { favoriteSpeciesIds, toggleFavorite } = useAppState();

  const heroHeight = height * HERO_HEIGHT_RATIO;
  const isFavorite = favoriteSpeciesIds.includes(species.id) || species.isFavorite;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image source={{ uri: species.imageUrl }} style={styles.heroImage} resizeMode="cover" />
            <View style={[styles.heroOverlay, { paddingTop: insets.top + sp.sm, paddingHorizontal: sp.lg, paddingBottom: sp.lg }]}>
              <View style={styles.heroTopRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                  hitSlop={12}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleFavorite(species.id)}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                  hitSlop={12}
                >
                  <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#EF4444' : '#fff'} />
                </TouchableOpacity>
              </View>
              <View style={styles.heroFooter}>
                <Text style={[typo.titleLg, { color: '#fff' }]}>{species.label}</Text>
                <View style={styles.regionRow}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={[typo.bodySm, { color: 'rgba(255,255,255,0.9)', marginLeft: sp.xs }]}>
                    {species.region}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Content card */}
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderTopLeftRadius: rad.xl, borderTopRightRadius: rad.xl, padding: sp.xl, marginTop: -20 }]}>
            {/* About This Species */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={20} color={colors.primary} />
                <Text style={[typo.titleSm, { color: colors.textMain, marginLeft: sp.sm }]}>
                  About This Species
                </Text>
              </View>
              <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.sm, lineHeight: 22 }]}>
                {species.description}
              </Text>
            </View>

            {/* Observation Guide */}
            <View style={[styles.section, { marginTop: sp.xl }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
                <Text style={[typo.titleSm, { color: colors.textMain, marginLeft: sp.sm }]}>
                  Observation Guide
                </Text>
              </View>
              <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.sm, lineHeight: 22 }]}>
                {species.observationGuide}
              </Text>
            </View>

            {/* Your Observation */}
            <View style={[styles.section, { marginTop: sp.xl }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <Text style={[typo.titleSm, { color: colors.textMain, marginLeft: sp.sm }]}>
                  Your Observation
                </Text>
              </View>
              <TextInput
                style={[
                  typo.bodySm,
                  {
                    marginTop: sp.sm,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: rad.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    paddingHorizontal: sp.md,
                    paddingVertical: sp.md,
                    color: colors.textMain,
                    minHeight: 88,
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="Add notes about behavior, movement, or ..."
                placeholderTextColor={colors.textSecondary + '99'}
                value={observationNotes}
                onChangeText={setObservationNotes}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom action bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              paddingHorizontal: sp.lg,
              paddingTop: sp.md,
              paddingBottom: insets.bottom + sp.md,
            },
          ]}
        >
          <TouchableOpacity style={styles.bottomIcon}>
            <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon}>
            <Ionicons name="flag-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <PrimaryButton title="+ Add New Sighting" onPress={() => {}} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFooter: {},
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contentCard: {
    flex: 1,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  bottomIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
