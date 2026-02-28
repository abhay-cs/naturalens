import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SpeciesDetailScreen } from '../screens/SpeciesDetailScreen';
import { TabBar, CameraNavButton } from '../components/TabBar';
import { ResultsPanel } from '../components/ResultsPanel';
import { SettingsSheet } from '../components/SettingsSheet';
import { ErrorBanner } from '../components/ErrorBanner';
import { ThemeToggle } from '../components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

export function MainLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { colors, shadows: sh, spacing: sp } = tokens;

  const {
    activeTab,
    setActiveTab,
    scoreThreshold,
    setScoreThreshold,
    showOnlyBears,
    setShowOnlyBears,
    initError,
    setInitError,
    displayFrame,
    displayDetections,
    setFrameResults,
    selectedSpecies,
    setSelectedSpecies,
  } = useAppState();

  const isHome = activeTab === 'home';
  const isMap = activeTab === 'map';
  const isCamera = activeTab === 'camera';
  const isFavorites = activeTab === 'favorites';
  const isProfile = activeTab === 'profile';

  const showFloatingActions = isProfile;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={isHome || isMap ? [] : ['top']}
    >
      {showFloatingActions && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: isCamera ? 'rgba(15,23,42,0.6)' : colors.surface,
                borderWidth: 1,
                borderColor: isCamera ? 'transparent' : colors.borderSubtle,
                ...sh.sm,
              },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={isCamera ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.floatingBtn,
              {
                backgroundColor: isCamera ? 'rgba(15,23,42,0.6)' : colors.surface,
                borderWidth: 1,
                borderColor: isCamera ? 'transparent' : colors.borderSubtle,
                ...sh.sm,
              },
            ]}
          >
            <ThemeToggle light={isCamera} />
          </View>
        </View>
      )}

      {initError && (
        <ErrorBanner message={initError} onDismiss={() => setInitError(null)} />
      )}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scoreThreshold={scoreThreshold}
        setScoreThreshold={setScoreThreshold}
        showOnlyBears={showOnlyBears}
        setShowOnlyBears={setShowOnlyBears}
      />

      <View style={[styles.content, (isCamera || isHome || isMap) && styles.contentFullscreen]}>
        {isHome && <HomeScreen />}
        {isMap && <ExploreScreen />}
        {isCamera && <CameraScreen />}
        {isFavorites && <FavoritesScreen />}
        {isProfile && <ProfileScreen />}
      </View>

      {selectedSpecies && (
        <SpeciesDetailScreen
          species={selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      )}

      {isCamera && (
        <View
          style={[
            styles.resultsWrap,
            {
              position: 'absolute',
              bottom: 260 + insets.bottom,
              left: 0,
              right: 0,
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              paddingHorizontal: sp.lg,
              paddingBottom: 0,
            },
          ]}
        >
          {(displayDetections?.length ?? 0) > 0 && (
            <ResultsPanel
              frame={displayFrame ?? undefined}
              detections={displayDetections ?? undefined}
              emptyMessage="No bears detected (above threshold)."
              compact
              onDismiss={() => setFrameResults(null)}
            />
          )}
        </View>
      )}

      {!isCamera && (
        <View
          style={[
            styles.tabBarWrap,
            {
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={styles.tabBarRow}>
            <TabBar active={activeTab} onSelect={setActiveTab} />
            <CameraNavButton
              isActive={false}
              onPress={() => setActiveTab('camera')}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingActions: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  contentFullscreen: { minHeight: 300 },
  resultsWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 100,
    elevation: 8,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: 60,
  },
});
