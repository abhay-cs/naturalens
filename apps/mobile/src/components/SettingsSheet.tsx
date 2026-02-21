import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  scoreThreshold: number;
  setScoreThreshold: (v: number) => void;
  showOnlyBears: boolean;
  setShowOnlyBears: (v: boolean) => void;
}

export function SettingsSheet({
  open,
  onClose,
  scoreThreshold,
  setScoreThreshold,
  showOnlyBears,
  setShowOnlyBears,
}: SettingsSheetProps) {
  const { neo } = useTheme();

  if (!open) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[
            styles.sheet,
            {
              backgroundColor: neo.surface,
              borderColor: neo.border,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
            },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: neo.border }]} />
          <Text style={[styles.title, { color: neo.text }]}>Detection settings</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: neo.text }]}>Threshold</Text>
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={0.9}
                step={0.05}
                value={scoreThreshold}
                onValueChange={setScoreThreshold}
                minimumTrackTintColor={neo.accent}
                maximumTrackTintColor={neo.border}
                thumbTintColor={neo.accent}
              />
              <Text style={[styles.value, { color: neo.text }]}>
                {scoreThreshold.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={[styles.row, styles.toggleRow]}>
            <Text style={[styles.label, { color: neo.text }]}>Bears only</Text>
            <Switch
              value={showOnlyBears}
              onValueChange={setShowOnlyBears}
              trackColor={{ false: neo.border, true: neo.accent }}
              thumbColor={showOnlyBears ? neo.textInv : neo.surface}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
    marginBottom: 20,
  },
  row: { marginBottom: 16 },
  label: {
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 4,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slider: { flex: 1, height: 40 },
  value: {
    fontSize: 16,
    minWidth: 40,
    fontFamily: 'Figtree_600SemiBold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
