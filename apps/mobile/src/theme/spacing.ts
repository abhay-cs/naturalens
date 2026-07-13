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
