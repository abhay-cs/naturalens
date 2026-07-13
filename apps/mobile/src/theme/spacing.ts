export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const BorderRadii = {
  small: 8,
  medium: 16,
  large: 24,
  pill: 999,
};

/**
 * How tall the floating tab bar pill is, excluding the bottom safe-area inset.
 *
 * The camera runs full-bleed underneath it, so anything the camera puts near the bottom has
 * to clear this by hand — there is no layout flow to do it for them. Shared so the pill's
 * height and the space reserved for it can't drift apart.
 */
export const NAV_HEIGHT = 72;

// Weight comes from the family, not fontWeight: a custom font exposes each weight as its
// own family, and fontWeight can't pick between them (it silently no-ops on Android). The
// three families here are the three loaded in App.tsx — adding a token with a fourth weight
// means loading that weight too, or it falls back to the system face.
export const Typography = {
  h1: { fontFamily: 'Figtree_700Bold', fontSize: 32, lineHeight: 40 },
  h2: { fontFamily: 'Figtree_700Bold', fontSize: 24, lineHeight: 32 },
  h3: { fontFamily: 'Figtree_600SemiBold', fontSize: 18, lineHeight: 26 },
  subtitle: { fontFamily: 'Figtree_600SemiBold', fontSize: 16, lineHeight: 24 },
  body: { fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'Figtree_400Regular', fontSize: 14, lineHeight: 20 },
};
