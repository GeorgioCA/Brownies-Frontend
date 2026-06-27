export const colors = {
  // Primary palette — warm browns & creams
  primary: '#8B5E3C',
  primaryDark: '#6B3F1F',
  primaryLight: '#C49A6C',
  accent: '#D4A853',
  gold: '#D4A853',
  goldLight: '#F0D78C',

  // Backgrounds
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F5E6D3',
  surfaceDark: '#EDDCC8',

  // Text
  text: '#3D2B1F',
  textSecondary: '#8B7355',
  textLight: '#C4A882',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#5B8C5A',
  error: '#C0392B',
  warning: '#F0A04B',

  // Misc
  border: '#E0D0C0',
  shadow: '#3D2B1F',
  overlay: 'rgba(61, 43, 31, 0.5)',
  white: '#FFFFFF',
  transparent: 'transparent',

  // Swipe
  like: '#5B8C5A',
  superLike: '#4A90D9',
  pass: '#C0392B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
