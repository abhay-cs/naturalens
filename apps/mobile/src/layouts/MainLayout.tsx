import { useCallback, type ComponentType } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState, type TabId } from '../contexts/AppStateContext';
import { Spacing } from '../theme/tokens';
import { NAV_INSET } from '../theme/layout';
import { CameraDetectionScreen } from '../screens/CameraDetectionScreen';
import { FindsScreen } from '../screens/FindsScreen';
import { MapScreen } from '../screens/MapScreen';
import { SpeciesDetailScreen } from '../screens/SpeciesDetailScreen';
import { BottomNavigation, type NavChrome } from '../components/BottomNavigation';

const SCREENS: Record<TabId, ComponentType> = {
  camera: CameraDetectionScreen,
  finds: FindsScreen,
  map: MapScreen,
};

/**
 * How the tab pill separates itself from each screen. The camera and the map are
 * full-bleed and busy, so the pill lifts off them; Finds is a white page where a shadow
 * would be the only soft edge on screen.
 */
const NAV_CHROME: Record<TabId, NavChrome> = {
  camera: 'floating',
  finds: 'bordered',
  map: 'floating',
};

export function MainLayout() {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    setActiveTab,
    pushBanner,
    selectedEntry,
    setSelectedEntryId,
    setSelectedPinId,
    deleteHistoryEntry,
  } = useAppState();

  const closeDetail = useCallback(() => setSelectedEntryId(null), [setSelectedEntryId]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteHistoryEntry(id);
        setSelectedEntryId(null);
        setSelectedPinId(null);
      } catch {
        pushBanner('Could not delete that find. Try again.', 'danger');
      }
    },
    [deleteHistoryEntry, setSelectedEntryId, setSelectedPinId, pushBanner],
  );

  const Screen = SCREENS[activeTab];

  return (
    <View style={styles.container}>
      {/* Screens fill the window and own their own safe area — the camera and map run
          full-bleed under the status bar, and Finds insets itself. Each screen also places
          its own banner stack, since the right spot for it differs on all three. */}
      <Screen />

      {/* Floats rather than sitting in flow: in flow it would shove the viewfinder down. */}
      <View
        style={[styles.navWrap, { paddingBottom: insets.bottom + NAV_INSET }]}
        pointerEvents="box-none"
      >
        <BottomNavigation
          activeTab={activeTab}
          onSelect={setActiveTab}
          chrome={NAV_CHROME[activeTab]}
        />
      </View>

      {/* A Modal rather than an absolute-fill View: onRequestClose is what makes Android's
          hardware back button close the detail instead of backgrounding the app. */}
      <Modal visible={selectedEntry !== null} animationType="slide" onRequestClose={closeDetail}>
        {selectedEntry && (
          <SpeciesDetailScreen entry={selectedEntry} onClose={closeDetail} onDelete={handleDelete} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.l,
  },
});
