/**
 * Neobrutalism theme – matches web app styles.css
 * Light: --neo-bg #e5e5e5, --neo-surface #ffffff, --neo-border #000
 * Dark: --neo-bg #1a1a1a, --neo-surface #262626, --neo-border #fff
 */

export const lightTheme = {
  bg: '#e5e5e5',
  surface: '#ffffff',
  border: '#000000',
  shadow: '#000000',
  accent: '#ef4444',
  accentAlt: '#facc15',
  accentPurple: '#a855f7',
  highlight: '#84cc16',
  text: '#000000',
  textInv: '#ffffff',
  error: '#dc2626',
} as const;

export const darkTheme = {
  bg: '#1a1a1a',
  surface: '#262626',
  border: '#ffffff',
  shadow: '#ffffff',
  accent: '#ef4444',
  accentAlt: '#eab308',
  accentPurple: '#a855f7',
  highlight: '#84cc16',
  text: '#ffffff',
  textInv: '#000000',
  error: '#f87171',
} as const;

export type NeoTheme = typeof lightTheme | typeof darkTheme;

export const neoShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
};

export const neoShadowSm = {
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
};

export const neoShadowLg = {
  shadowColor: '#000',
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
};

export const neoShadowDark = {
  shadowColor: '#fff',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
};
