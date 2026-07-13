import { useCallback } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../contexts/AppStateContext';
import { Spacing } from '../theme/spacing';
import { CameraDetectionScreen } from '../screens/CameraDetectionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SpeciesDetailScreen } from '../screens/SpeciesDetailScreen';
import { BottomNavigation } from '../components/BottomNavigation';
import { ErrorBanner } from '../components/ErrorBanner';

export function MainLayout() {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    setActiveTab,
    initError,
    setInitError,
    selectedEntry,
    setSelectedEntryId,
    deleteHistoryEntry,
  } = useAppState();

  const closeDetail = useCallback(() => setSelectedEntryId(null), [setSelectedEntryId]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteHistoryEntry(id);
        setSelectedEntryId(null);
      } catch {
        setInitError('Could not delete that find. Try again.');
      }
    },
    [deleteHistoryEntry, setSelectedEntryId, setInitError]
  );

  return (
    <View style={styles.container}>
      {/* Screens fill the window and own their own safe area — the camera runs full-bleed
          under the status bar and the tab bar, and History insets itself. */}
      {activeTab === 'camera' ? <CameraDetectionScreen /> : <HistoryScreen />}

      {/* Floats rather than sitting in flow: in flow it would shove the viewfinder down. */}
      {initError && (
        <View
          style={[styles.errorWrap, { top: insets.top + Spacing.s }]}
          pointerEvents="box-none"
        >
          <ErrorBanner message={initError} onDismiss={() => setInitError(null)} />
        </View>
      )}

      <View
        style={[
          styles.navWrap,
          { paddingBottom: insets.bottom + Spacing.l },
        ]}
        pointerEvents="box-none"
      >
        <BottomNavigation activeTab={activeTab} onSelect={setActiveTab} />
      </View>

      {/* A Modal rather than an absolute-fill View: onRequestClose is what makes Android's
          hardware back button close the detail instead of backgrounding the app. */}
      <Modal
        visible={selectedEntry !== null}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        {selectedEntry && (
          <SpeciesDetailScreen
            entry={selectedEntry}
            onClose={closeDetail}
            onDelete={handleDelete}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  navWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.l,
  },
});
