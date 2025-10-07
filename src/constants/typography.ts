import { Platform } from 'react-native';

export const typography = {
  // Font families - Modern system fonts
  fontFamily: {
    regular: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter-SemiBold',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter-Bold',
      default: 'System',
    }),
    display: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter-Black',
      default: 'System',
    }),
  },
  
  // Font sizes - More refined scale
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 42,
    '8xl': 48,
    '9xl': 56,
  },
  
  // Line heights - Better spacing
  lineHeight: {
    xs: 14,
    sm: 16,
    base: 20,
    lg: 22,
    xl: 24,
    '2xl': 26,
    '3xl': 30,
    '4xl': 34,
    '5xl': 38,
    '6xl': 42,
    '7xl': 48,
    '8xl': 54,
    '9xl': 60,
  },
  
  // Font weights - More options
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
  
  // Text styles - Modern hierarchy
  textStyles: {
    // Display styles
    display: {
      fontSize: 48,
      lineHeight: 54,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
    },
    displayLarge: {
      fontSize: 42,
      lineHeight: 48,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    displayMedium: {
      fontSize: 36,
      lineHeight: 42,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    displaySmall: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    
    // Headline styles
    headline1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
    headline2: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
    },
    headline3: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
    headline4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    headline5: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    headline6: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    
    // Body styles
    bodyLarge: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    
    // Label styles
    labelLarge: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500' as const,
    },
    
    // Button styles
    buttonLarge: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    buttonMedium: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    buttonSmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    
    // Caption styles
    caption: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '400' as const,
    },
    overline: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
    
    // Legacy styles for backward compatibility
    h1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
    h2: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
    },
    h3: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    h5: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    h6: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    body1: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    body2: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    button: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
  },
};
