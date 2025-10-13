export const colors = {
  // Dark Blue Theme Colors
  primary: '#2196F3', // Bright blue for active elements
  primaryDark: '#1976D2', // Darker blue
  primaryLight: '#42A5F5', // Lighter blue
  secondary: '#2196F3', // Same as primary for consistency
  secondaryDark: '#1976D2',
  secondaryLight: '#42A5F5',
  accent: '#FF9800', // Orange accent for month labels
  accentDark: '#F57C00',
  accentLight: '#FFB74D',
  
  // Status Colors
  error: '#F44336',
  errorDark: '#D32F2F',
  errorLight: '#EF5350',
  warning: '#FF9800',
  warningDark: '#F57C00',
  warningLight: '#FFB74D',
  success: '#2196F3',
  successDark: '#1976D2',
  successLight: '#42A5F5',
  info: '#2196F3',
  infoDark: '#1976D2',
  infoLight: '#42A5F5',
  
  // Dark Theme Colors
  white: '#ffffff',
  black: '#000000',
  
  // Dark blue grays
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  
  // Dark Blue Background Colors
  background: '#0D1B2A', // Main dark blue background
  backgroundSecondary: '#1B263B', // Lighter dark blue for cards
  backgroundTertiary: '#263238', // Even lighter for elevated surfaces
  surface: '#1B263B', // Card background
  surfaceSecondary: '#263238', // Secondary card background
  surfaceElevated: '#2C3E50', // Elevated surface
  
  // Text Colors for dark theme
  textPrimary: '#ffffff', // White text for primary content
  textSecondary: '#B0BEC5', // Light gray for secondary text
  textTertiary: '#90A4AE', // Lighter gray for tertiary text
  textQuaternary: '#78909C', // Even lighter gray
  textInverse: '#0D1B2A', // Dark text on light backgrounds
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',
  
  // Border Colors for dark theme
  border: '#263238',
  borderSecondary: '#2C3E50',
  borderTertiary: '#34495E',
  
  // Shadow Colors for dark theme
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowDark: 'rgba(0, 0, 0, 0.6)',
  shadowColored: 'rgba(33, 150, 243, 0.3)',
  
  // Glass/Overlay Colors
  glass: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(13, 27, 42, 0.8)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const gradients = {
  // Primary Gradients - Dark Blue Theme
  primary: [colors.primary, colors.primaryDark] as const,
  primaryLight: [colors.primaryLight, colors.primary] as const,
  secondary: [colors.secondary, colors.secondaryDark] as const,
  secondaryLight: [colors.secondaryLight, colors.secondary] as const,
  accent: [colors.accent, colors.accentDark] as const,
  accentLight: [colors.accentLight, colors.accent] as const,
  
  // Surface Gradients - Dark Blue
  surface: [colors.surface, colors.surfaceSecondary] as const,
  surfaceElevated: [colors.surfaceElevated, colors.backgroundTertiary] as const,
  surfaceGlass: [colors.glass, 'rgba(255, 255, 255, 0.05)'] as const,
  
  // Background Gradients - Dark Blue
  background: [colors.background, colors.backgroundSecondary] as const,
  backgroundWarm: [colors.background, colors.backgroundTertiary] as const,
  backgroundCool: [colors.background, colors.backgroundSecondary] as const,
  
  // Navigation Gradients - Dark Blue
  navigation: [colors.surface, colors.surfaceSecondary] as const,
  navigationGlass: [colors.glass, 'rgba(255, 255, 255, 0.1)'] as const,
  
  // Overlay Gradients
  overlay: [colors.overlayLight, colors.overlay] as const,
  overlayDark: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)'] as const,
  
  // Status Gradients
  success: [colors.success, colors.successDark] as const,
  error: [colors.error, colors.errorDark] as const,
  warning: [colors.warning, colors.warningDark] as const,
  info: [colors.info, colors.infoDark] as const,
  
  // Dark Theme Glass Effects
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const,
  glassDark: ['rgba(13, 27, 42, 0.8)', 'rgba(13, 27, 42, 0.6)'] as const,
  glassPrimary: ['rgba(33, 150, 243, 0.2)', 'rgba(33, 150, 243, 0.1)'] as const,
  
  // Card Gradients - Dark Blue
  card: [colors.surface, colors.surfaceSecondary] as const,
  cardElevated: [colors.surfaceElevated, colors.surface] as const,
  cardGlass: [colors.glass, 'rgba(255, 255, 255, 0.05)'] as const,
};

// Currency Configuration
export const currencySymbols: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R$',
  'MXN': '$',
  'KRW': '₩',
  'SGD': 'S$',
  'NZD': 'NZ$',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'RUB': '₽',
  'ZAR': 'R',
  'TRY': '₺',
  'BDT': '৳',
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return currencySymbols[currencyCode] || currencyCode;
};

export const formatCurrencyAmount = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Animation Configuration
export const animations = {
  // Timing
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
  
  // Easing
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'spring',
  
  // Scale
  scaleSmall: 0.95,
  scaleNormal: 1,
  scaleLarge: 1.05,
  scaleXLarge: 1.1,
  
  // Opacity
  opacityHidden: 0,
  opacityVisible: 1,
  opacitySemi: 0.5,
  opacitySubtle: 0.7,
  
  // Translation
  translateUp: -20,
  translateDown: 20,
  translateLeft: -20,
  translateRight: 20,
};
