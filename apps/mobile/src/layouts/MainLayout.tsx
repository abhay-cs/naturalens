import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { ExploreScreen } from '../screens/ExploreScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TabBar } from '../components/TabBar';
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
  } = useAppState();

  const isExplore = activeTab === 'explore';
  const isIdentify = activeTab === 'identify';
  const isCollection = activeTab === 'collection';
  const isProfile = activeTab === 'profile';

  const showFloatingActions = isIdentify;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={isExplore ? [] : ['top']}
    >
      {showFloatingActions && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: isIdentify ? 'rgba(15,23,42,0.6)' : colors.surface,
                borderWidth: 1,
                borderColor: isIdentify ? 'transparent' : colors.borderSubtle,
                ...sh.sm,
              },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={isIdentify ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.floatingBtn,
              {
                backgroundColor: isIdentify ? 'rgba(15,23,42,0.6)' : colors.surface,
                borderWidth: 1,
                borderColor: isIdentify ? 'transparent' : colors.borderSubtle,
                ...sh.sm,
              },
            ]}
          >
            <ThemeToggle light={isIdentify} />
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

      <View style={[styles.content, (isIdentify || isExplore) && styles.contentFullscreen]}>
        {isExplore && <ExploreScreen />}
        {isIdentify && <CameraScreen />}
        {isCollection && <CollectionScreen />}
        {isProfile && <ProfileScreen />}
      </View>

      {isIdentify && (
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

      <View
        style={[
          styles.tabBarWrap,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSubtle,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </View>
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
    borderTopWidth: 1,
    paddingBottom: 0,
  },
});
