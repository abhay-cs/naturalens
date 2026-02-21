import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { CameraScreen } from '../screens/CameraScreen';
import { MediaScreen } from '../screens/MediaScreen';
import { MapScreen } from '../screens/MapScreen';
import { TabBar } from '../components/TabBar';
import { ResultsPanel } from '../components/ResultsPanel';
import { SettingsSheet } from '../components/SettingsSheet';
import { ErrorBanner } from '../components/ErrorBanner';
import { ThemeToggle } from '../components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

export function MainLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { neo, neoShadowSm } = useTheme();

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

  const isCamera = activeTab === 'camera';
  const isMap = activeTab === 'map';
  const isMedia = activeTab === 'media';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: neo.bg }]} edges={['top']}>
      {(isCamera || isMap || isMedia) && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderWidth: 2,
                borderColor: neo.border,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.floatingBtn, { backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 2, borderColor: neo.border }]}>
            <ThemeToggle light />
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

      <View style={[styles.content, isCamera && styles.contentFullscreen]}>
        {activeTab === 'camera' && <CameraScreen />}
        {activeTab === 'media' && <MediaScreen />}
        {activeTab === 'map' && <MapScreen />}
      </View>

      {activeTab !== 'map' && (
        <View
          style={[
            styles.resultsWrap,
            isCamera
              ? {
                  position: 'absolute',
                  bottom: 260 + insets.bottom,
                  left: 0,
                  right: 0,
                  backgroundColor: 'transparent',
                  borderTopWidth: 0,
                  paddingHorizontal: 16,
                  paddingBottom: 0,
                }
              : {
                  backgroundColor: neo.bg,
                  borderTopColor: neo.border,
                  paddingBottom: 80 + insets.bottom,
                },
          ]}
        >
          {(activeTab !== 'camera' || (displayDetections?.length ?? 0) > 0) && (
            <ResultsPanel
              frame={displayFrame ?? undefined}
              detections={displayDetections ?? undefined}
              emptyMessage="No bears detected (above threshold)."
              compact={isCamera}
              onDismiss={isCamera ? () => setFrameResults(null) : undefined}
            />
          )}
        </View>
      )}

      <View
        style={[
          styles.tabBarWrap,
          {
            backgroundColor: neo.surface,
            borderTopColor: neo.border,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'Figtree_700Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingActions: {
    position: 'absolute',
    top: 69,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderTopWidth: 2,
    paddingBottom: 0,
  },
});
