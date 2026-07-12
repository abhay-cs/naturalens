import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../contexts/AppStateContext';
import { Colors } from '../theme/colors';
import { CameraDetectionScreen } from '../screens/CameraDetectionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { BottomNavigation } from '../components/BottomNavigation';
import { ErrorBanner } from '../components/ErrorBanner';

export function MainLayout() {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab, initError, setInitError } = useAppState();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
      edges={['top']}
    >
      {initError && (
        <ErrorBanner message={initError} onDismiss={() => setInitError(null)} />
      )}

      <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {activeTab === 'camera' ? <CameraDetectionScreen /> : <HistoryScreen />}
      </View>

      <View style={[styles.navWrap, { paddingBottom: insets.bottom + 24 }]}>
        <BottomNavigation activeTab={activeTab} onSelect={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  navWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
