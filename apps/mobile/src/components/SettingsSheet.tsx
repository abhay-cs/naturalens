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
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;

  if (!open) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: rad.lg,
              borderTopRightRadius: rad.lg,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
              paddingHorizontal: sp.xl,
              paddingTop: sp.lg,
              paddingBottom: 40,
            },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderSubtle, borderRadius: rad.pill }]} />

          <Text style={[typo.titleMd, { color: colors.textMain, marginBottom: sp.xl }]}>
            Detection settings
          </Text>

          <View style={{ marginBottom: sp.lg }}>
            <View style={styles.sliderLabelRow}>
              <Text style={[typo.titleSm, { color: colors.textMain }]}>Threshold</Text>
              <Text style={[typo.titleSm, { color: colors.textMain }]}>
                {scoreThreshold.toFixed(2)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={0.9}
              step={0.05}
              value={scoreThreshold}
              onValueChange={setScoreThreshold}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.borderSubtle}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.titleSm, { color: colors.textMain }]}>Bears only</Text>
              <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs }]}>
                Filter results to show only bear detections.
              </Text>
            </View>
            <Switch
              value={showOnlyBears}
              onValueChange={setShowOnlyBears}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor="#fff"
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
    justifyContent: 'flex-end',
  },
  sheet: {},
  handle: {
    width: 36,
    height: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slider: { width: '100%', height: 40 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
