import { useEffect, useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme/tokens';
import { Sheet } from '../components/Sheet';
import { OwlMark } from '../components/OwlMark';
import { hasLocationPermission } from '../lib/location';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  findCount: number;
}

/**
 * What the app knows about itself.
 *
 * The prototype put an account here — signed-in identity, sync counts. There is no
 * account and nothing syncs, so rather than draw a shell of one, this says the true
 * things: how many finds are on this phone, and whether location tagging is on.
 */
export function SettingsSheet({ visible, onClose, findCount }: SettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const [locationOn, setLocationOn] = useState<boolean | null>(null);

  // Re-checked on each open — the user may have changed it in system settings since last
  // time, and a stale "Off" here would send them back to a switch they already flipped.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    hasLocationPermission().then((granted) => {
      if (!cancelled) setLocationOn(granted);
    });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.anchor} pointerEvents="box-none">
        <Sheet style={{ paddingBottom: insets.bottom + Spacing.l }}>
          <View style={styles.identity}>
            <OwlMark size={44} color={Colors.fg} />
            <View>
              <Text style={styles.name}>Naturalens</Text>
              <Text style={styles.sub}>Everything stays on this phone</Text>
            </View>
          </View>

          <View style={styles.rule} />

          <Row label="Finds on this device" value={String(findCount)} />
          <Row
            label="Location tagging"
            value={locationOn === null ? '—' : locationOn ? 'On' : 'Off'}
            onPress={locationOn === false ? () => Linking.openSettings() : undefined}
            hint={locationOn === false ? 'Open settings' : undefined}
          />

          <Text style={styles.volume}>Naturalens · Volume One</Text>
        </Sheet>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  hint,
  onPress,
}: {
  label: string;
  value: string;
  hint?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{hint ?? value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  name: {
    ...Typography.h3,
    color: Colors.fg,
  },
  sub: {
    ...Typography.small,
    fontSize: 12,
    color: Colors.caption,
    marginTop: 3,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.l - 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.s - 2,
  },
  rowLabel: {
    ...Typography.small,
    fontSize: 13,
    color: Colors.muted,
  },
  rowValue: {
    ...Typography.small,
    fontSize: 13,
    color: Colors.fg,
  },
  volume: {
    ...Typography.label,
    color: Colors.caption,
    textAlign: 'center',
    marginTop: Spacing.l + Spacing.xs,
  },
});
