/** GENERATED — do not edit. Source: packages/design/tokens.json. Run: node packages/design/build/generate.mjs */


export const Colors = {
  bg: "#FFFFFF",
  fg: "#000000",
  muted: "#666666",
  caption: "#999999",
  border: "#E5E5E5",
  surface: "#F5F5F5",
  /** @deprecated Use fg — kept so existing imports keep compiling during migration */
  primary: "#000000",
  brand: "#000000",
  background: "#FFFFFF",
  cardBackground: "#F5F5F5",
  splashBackground: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  white: "#FFFFFF",
  error: "#000000",
} as const;

export const InvertedColors = {
  bg: "#000000",
  fg: "#FFFFFF",
  muted: "#999999",
  caption: "#666666",
  border: "#222222",
  surface: "#111111",
} as const;

/** Status / overlay only — do not use for page chrome */
export const SemanticColors = {
  success: "#2F6B4F",
  successSoft: "#E8F2EC",
  warning: "#8A6A1F",
  warningSoft: "#F5F0E0",
  danger: "#8B3A3A",
  dangerSoft: "#F5E8E8",
} as const;

export const Spacing = {
  hairline: 4,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
  xxl: 64,
  xxxl: 96,
} as const;

export const BorderRadii = {
  media: 0,
  input: 2,
  panel: 8,
  small: 8,
  medium: 8,
  large: 8,
  pill: 999,
} as const;

export const Motion = {
  enter: 480,
  state: 220,
  stagger: 60,
  rise: 8,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const Typography = {
  display: { fontFamily: "Outfit_200ExtraLight", fontSize: 46, lineHeight: 47, letterSpacing: -1.38 },
  h1: { fontFamily: "Outfit_300Light", fontSize: 34, lineHeight: 37, letterSpacing: -0.85 },
  h2: { fontFamily: "Outfit_400Regular", fontSize: 28, lineHeight: 32, letterSpacing: -0.42 },
  h3: { fontFamily: "Archivo_600SemiBold", fontSize: 18, lineHeight: 23, letterSpacing: -0.09 },
  body: { fontFamily: "Archivo_400Regular", fontSize: 16, lineHeight: 26 },
  small: { fontFamily: "Archivo_400Regular", fontSize: 14, lineHeight: 22 },
  label: { fontFamily: "Archivo_500Medium", fontSize: 11, lineHeight: 15, letterSpacing: 1.54, textTransform: "uppercase" as const },
  button: { fontFamily: "Archivo_500Medium", fontSize: 15, lineHeight: 15, letterSpacing: 0.3 },
  /** Alias — product screens used subtitle for 16px semibold */
  subtitle: { fontFamily: "Archivo_600SemiBold", fontSize: 16, lineHeight: 24 },
  /** Alias — product screens used caption for small body */
  caption: { fontFamily: "Archivo_400Regular", fontSize: 14, lineHeight: 20 },
} as const;

/** Font families the type ramp names — pass these to useFonts. */
export const RequiredFontFamilies = [
  "Archivo_400Regular",
  "Archivo_500Medium",
  "Archivo_600SemiBold",
  "Outfit_200ExtraLight",
  "Outfit_300Light",
  "Outfit_400Regular",
] as const;
