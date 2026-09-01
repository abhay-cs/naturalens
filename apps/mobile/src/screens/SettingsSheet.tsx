import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, View, Text, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme/tokens';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { useAppState } from '../contexts/AppStateContext';
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
 * There is now a signed-in address, so this shows it — but the rest of what the prototype
 * wanted here, sync counts and a cloud library, still does not exist. The rule this screen
 * was written under holds: say the true things and nothing else. So the address sits above
 * a line that states plainly that nothing leaves the phone, and the sync row it would
 * otherwise want is that sentence instead of a number.
 */
export function SettingsSheet({ visible, onClose, findCount }: SettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAppState();
  const [locationOn, setLocationOn] = useState<boolean | null>(null);

  /**
   * Confirmed, because signing out drops you back to the onboarding intro — the session is
   * what gates the app, so there is no halfway state to land in. The finds stay put: they
   * are local to the device and were never tied to an identity (`docs/DESIGN.md` §4).
   */
  function confirmSignOut() {
    Alert.alert('Sign out?', 'Your finds stay on this phone. You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut();
        },
      },
    ]);
  }

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
            <View style={styles.identityText}>
              <Text style={styles.name}>Naturalens</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {session?.email ?? 'Not signed in'}
              </Text>
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
          <Row label="Sync" value="Nothing leaves this phone" />

          {/* `quiet`, not `destructive`. Signing out destroys nothing — the finds stay on the
              phone — and `destructive` spends `SemanticColors.danger`, which §6 rations to
              status pills and overlays. "Delete find" earns that hue; this does not. */}
          {session && <Button title="Sign out" onPress={confirmSignOut} variant="quiet" />}

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
  // Bounded so a long address truncates rather than pushing the mark off the sheet.
  identityText: {
    flex: 1,
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
    marginTop: Spacing.m,
  },
});
