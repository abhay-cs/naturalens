import { Easing } from 'react-native';

export const lightColors = {
  bg: '#F4F1EA',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F0',
  borderSubtle: '#DDD9D0',

  primary: '#4A7C59',
  primaryDark: '#3A6347',
  primarySoft: '#E8F0EB',

  textMain: '#1A1C1B',
  textSecondary: '#5F6560',

  success: '#22C55E',
  warning: '#D4940A',
  danger: '#DC3545',

  overlay: 'rgba(26,28,27,0.35)',
} as const;

export const darkColors = {
  bg: '#141716',
  surface: '#1E2120',
  surfaceMuted: '#171A18',
  borderSubtle: '#2A2E2B',

  primary: '#6E8F7A',
  primaryDark: '#5A7D66',
  primarySoft: '#1A2E22',

  textMain: '#F2F0EB',
  textSecondary: '#9CA396',

  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F97373',

  overlay: 'rgba(0,0,0,0.55)',
} as const;

export type ColorTokens = {
  readonly bg: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly borderSubtle: string;
  readonly primary: string;
  readonly primaryDark: string;
  readonly primarySoft: string;
  readonly textMain: string;
  readonly textSecondary: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly overlay: string;
};

export const typography = {
  display: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  titleLg: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  titleMd: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  titleSm: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
} as const;

export type TypographyTokens = typeof typography;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

export type SpacingTokens = typeof spacing;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export type RadiusTokens = typeof radius;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export type ShadowTokens = typeof shadows;

export const motion = {
  easingStandard: Easing.bezier(0.4, 0, 0.2, 1),
  durationShort: 150,
  durationMed: 230,
  durationLong: 300,
} as const;

export type MotionTokens = typeof motion;

export interface Tokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
}
