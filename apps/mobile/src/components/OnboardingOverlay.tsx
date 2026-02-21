import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

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
  const { neo, neoShadow, neoShadowLg } = useTheme();

  const handleComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    onComplete();
  }, [onComplete]);

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: neo.surface,
              borderColor: neo.border,
              borderWidth: 2,
              ...neoShadowLg,
            },
          ]}
        >
          {slideIndex === 0 && (
            <View style={styles.slide}>
              <Text style={[styles.title, { color: neo.text }]}>NaturaLens</Text>
              <Text style={[styles.tagline, { color: neo.text }]}>
                Spot wildlife in photos and videos
              </Text>
              <TouchableOpacity
                style={[
                  styles.cta,
                  {
                    backgroundColor: neo.accent,
                    borderColor: neo.border,
                    borderWidth: 2,
                    ...neoShadow,
                  },
                ]}
                onPress={() => setSlideIndex(1)}
                activeOpacity={0.9}
              >
                <Text style={[styles.ctaText, { color: neo.textInv }]}>Get started</Text>
              </TouchableOpacity>
            </View>
          )}
          {slideIndex === 1 && (
            <View style={styles.slide}>
              <Text style={[styles.subtitle, { color: neo.text }]}>How it works</Text>
              <View style={styles.featureGrid}>
                {FEATURES.map(({ icon, label, desc }) => (
                  <View
                    key={label}
                    style={[
                      styles.featureCard,
                      {
                        backgroundColor: neo.accentAlt,
                        borderColor: neo.border,
                        borderWidth: 2,
                        ...neoShadow,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureIcon,
                        {
                          backgroundColor: neo.surface,
                          borderRadius: 12,
                        },
                      ]}
                    >
                      <Ionicons name={icon} size={24} color={neo.accent} />
                    </View>
                    <Text style={[styles.featureLabel, { color: neo.text }]}>{label}</Text>
                    <Text style={[styles.featureDesc, { color: neo.text }]}>{desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {slideIndex === 2 && (
            <View style={styles.slide}>
              <Text style={[styles.subtitle, { color: neo.text }]}>You're all set</Text>
              <Text style={[styles.tagline, { color: neo.text }]}>
                Start detecting wildlife with your camera or uploads.
              </Text>
              <TouchableOpacity
                style={[
                  styles.cta,
                  {
                    backgroundColor: neo.accent,
                    borderColor: neo.border,
                    borderWidth: 2,
                    ...neoShadow,
                  },
                ]}
                onPress={handleComplete}
                activeOpacity={0.9}
              >
                <Text style={[styles.ctaText, { color: neo.textInv }]}>Start detecting wildlife</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.nav}>
            {slideIndex > 0 ? (
              <TouchableOpacity onPress={() => setSlideIndex((i) => i - 1)}>
                <Text style={[styles.navBtn, { color: neo.accent }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            {slideIndex === 1 ? (
              <TouchableOpacity onPress={() => setSlideIndex(2)}>
                <Text style={[styles.navBtn, { color: neo.accent, fontWeight: '600' }]}>Next</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === slideIndex ? neo.accent : neo.border },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    borderRadius: 16,
    padding: 36,
    width: '100%',
    maxWidth: 400,
  },
  slide: { alignItems: 'center' },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'Figtree_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Figtree_400Regular',
    lineHeight: 24,
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  featureGrid: { width: '100%', gap: 12, marginTop: 20 },
  featureCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navBtn: {
    fontSize: 16,
    fontFamily: 'Figtree_600SemiBold',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
