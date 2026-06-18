/**
 * Design tokens for the Delivery Driver App.
 *
 * Color strategy: Restrained. Cool navy primary + warm amber functional accent
 * on pure/neutral surfaces. OKLCH values are noted in comments; hex values are
 * used at runtime because React Native does not natively support OKLCH.
 */

export const colors = {
  // Neutral surface
  // oklch(100% 0 0)
  background: '#ffffff',
  // oklch(97% 0.005 230)
  surface: '#f4f6f8',
  // oklch(95% 0.007 230)
  surfaceHighlight: '#eef1f4',
  // oklch(88% 0.01 230)
  border: '#d8dde3',

  // Text
  // oklch(22% 0.03 250)
  ink: '#1a2332',
  // oklch(38% 0.04 250)
  inkSecondary: '#334155',
  // oklch(52% 0.035 250) — ≥4.5:1 on white
  muted: '#5a6578',
  // oklch(72% 0.025 250)
  placeholder: '#8a94a6',

  // Primary accent — cool navy
  // oklch(35% 0.08 250)
  primary: '#1e3a5f',
  // oklch(28% 0.07 250)
  primaryDeep: '#152a45',
  // oklch(92% 0.025 250)
  primaryMuted: '#d8e0ea',

  // Functional accent — warm amber
  // oklch(62% 0.15 80)
  accent: '#c78100',
  // oklch(95% 0.04 80)
  accentMuted: '#fff4df',

  // Semantic
  // oklch(50% 0.12 145)
  success: '#2d7a4a',
  // oklch(95% 0.03 145)
  successMuted: '#e3f5ea',
  // oklch(52% 0.18 25)
  error: '#b42318',
  // oklch(95% 0.025 25)
  errorMuted: '#fde8e6',

  // Overlays
  overlay: 'rgba(26, 35, 50, 0.45)',
} as const;

export const spacing = {
  '2': 2,
  '4': 4,
  '8': 8,
  '12': 12,
  '16': 16,
  '20': 20,
  '24': 24,
  '32': 32,
  '40': 40,
  '48': 48,
  '64': 64,
} as const;

export const radii = {
  '4': 4,
  '8': 8,
  '12': 12,
  '16': 16,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.35,
    relaxed: 1.5,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // System fonts feel native and load instantly. One family for the whole UI.
  family: {
    sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui, sans-serif`,
  },
} as const;

export const touchTargets = {
  minHeight: 48,
  minWidth: 48,
} as const;

/**
 * Named Inter font variants for React Native.
 * React Native requires the exact loaded font name — no fontWeight fallback.
 * These match the names exported by @expo-google-fonts/inter.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // Fallback to system font if Inter is not loaded yet
  system: undefined as string | undefined,
} as const;
