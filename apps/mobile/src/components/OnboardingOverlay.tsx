import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HarmonyCard } from './ui/HarmonyCard';
import { PrimaryButton } from './ui/PrimaryButton';

const ONBOARDING_KEY = 'naturalens-onboarding-seen';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const FEATURES = [
  {
    id: 'camera',
    icon: 'camera' as const,
    label: 'Camera',
    desc: 'Capture live and detect wildlife in real time.',
  },
  {
    id: 'media',
    icon: 'images' as const,
    label: 'Media',
    desc: 'Upload images or videos to analyze for wildlife.',
  },
];

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const { tokens } = useTheme();
  const { colors, typography: typo, spacing: sp, radius: rad } = tokens;

  const handleComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    onComplete();
  }, [onComplete]);

  return (
    <Modal visible animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <HarmonyCard elevated style={styles.modal}>
          {slideIndex === 0 && (
            <View style={styles.slide}>
              <Text style={[typo.titleLg, { color: colors.textMain, textAlign: 'center' }]}>
                NaturaLens
              </Text>
              <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm }]}>
                Spot wildlife in photos and videos
              </Text>
              <PrimaryButton
                title="Get started"
                onPress={() => setSlideIndex(1)}
                style={{ marginTop: sp.xl }}
              />
            </View>
          )}

          {slideIndex === 1 && (
            <View style={styles.slide}>
              <Text style={[typo.titleMd, { color: colors.textMain, textAlign: 'center' }]}>
                How it works
              </Text>
              <View style={[styles.featureGrid, { marginTop: sp.xl, gap: sp.md }]}>
                {FEATURES.map(({ icon, label, desc }) => (
                  <View
                    key={label}
                    style={[
                      styles.featureCard,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: rad.md,
                        padding: sp.lg,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureIcon,
                        {
                          backgroundColor: colors.primarySoft,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Ionicons name={icon} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[typo.titleSm, { color: colors.textMain }]}>{label}</Text>
                      <Text style={[typo.bodySm, { color: colors.textSecondary, marginTop: sp.xs }]}>
                        {desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {slideIndex === 2 && (
            <View style={styles.slide}>
              <Text style={[typo.titleMd, { color: colors.textMain, textAlign: 'center' }]}>
                You're all set
              </Text>
              <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm }]}>
                Start detecting wildlife with your camera or uploads.
              </Text>
              <PrimaryButton
                title="Start detecting wildlife"
                onPress={handleComplete}
                style={{ marginTop: sp.xl }}
              />
            </View>
          )}

          <View style={[styles.nav, { marginTop: sp.xl }]}>
            {slideIndex > 0 ? (
              <TouchableOpacity onPress={() => setSlideIndex((i) => i - 1)}>
                <Text style={[typo.bodySm, { color: colors.primary }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            {slideIndex === 1 ? (
              <TouchableOpacity onPress={() => setSlideIndex(2)}>
                <Text style={[typo.bodySm, { color: colors.primary, fontWeight: '600' }]}>
                  Next
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>

          <View style={[styles.dots, { marginTop: sp.lg, gap: sp.sm }]}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === slideIndex ? colors.primary : colors.borderSubtle,
                  },
                ]}
              />
            ))}
          </View>
        </HarmonyCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
  },
  slide: { alignItems: 'center' },
  featureGrid: { width: '100%' },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
