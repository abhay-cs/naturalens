import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SearchBar } from '../components/explore/SearchBar';
import { FilterChips, type FilterId } from '../components/explore/FilterChips';
import { MapControls } from '../components/explore/MapControls';
import { ObservationCard } from '../components/explore/ObservationCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { DUMMY_CAPTURES } from '../data/dummyCaptures';
import { MapScreen } from './MapScreen';

export function ExploreScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { spacing: sp } = tokens;

  const captures = DUMMY_CAPTURES;
  const speciesCount = new Set(captures.flatMap((c) => c.detections.map((d) => d.label))).size;
  const selectedCapture = captures[selectedIndex] ?? captures[0];

  return (
    <View style={styles.container}>
      {/* Full-screen map background */}
      <View style={StyleSheet.absoluteFill}>
        <MapScreen />
      </View>

      {/* Floating top bar */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + sp.sm, paddingHorizontal: sp.lg }]}>
        <SearchBar speciesCount={speciesCount} />
        <View style={{ marginTop: sp.sm }}>
          <FilterChips active={activeFilter} onSelect={setActiveFilter} />
        </View>
      </View>

      {/* Right-side map controls */}
      <View style={[styles.mapControls, { right: sp.lg }]}>
        <MapControls />
        <View style={{ marginTop: sp.sm }}>
          <ThemeToggle />
        </View>
      </View>

      {/* Bottom observation card */}
      {selectedCapture && (
        <View style={[styles.bottomOverlay, { paddingHorizontal: sp.lg, paddingBottom: sp.sm }]}>
          <ObservationCard capture={selectedCapture} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mapControls: {
    position: 'absolute',
    top: '45%',
    zIndex: 10,
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
