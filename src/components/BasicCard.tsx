import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, gradients } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

// Basic Card Component
interface BasicCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  gradient?: readonly [string, string, ...string[]];
  disabled?: boolean;
}

export const BasicCard: React.FC<BasicCardProps> = ({
  children,
  style,
  onPress,
  gradient,
  disabled = false,
}) => {
  const CardContent = () => (
    <View style={[styles.card, style]}>
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {children}
        </LinearGradient>
      ) : (
        children
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

// Basic Button Component
interface BasicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: readonly [string, string, ...string[]];
  style?: any;
}

export const BasicButton: React.FC<BasicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  gradient,
  style,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.buttonPrimary];
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary];
      case 'outline':
        return [...baseStyle, styles.buttonOutline];
      default:
        return [...baseStyle, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.buttonTextPrimary];
      case 'secondary':
        return [...baseStyle, styles.buttonTextSecondary];
      case 'outline':
        return [...baseStyle, styles.buttonTextOutline];
      default:
        return [...baseStyle, styles.buttonTextPrimary];
    }
  };

  const ButtonContent = () => (
    <View style={styles.buttonContent}>
      {loading ? (
        <View style={styles.loadingSpinner}>
          <Ionicons name="refresh" size={16} color={colors.white} />
        </View>
      ) : icon ? (
        <Ionicons
          name={icon}
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
          color={variant === 'primary' ? colors.white : colors.primary}
          style={styles.buttonIcon}
        />
      ) : null}
      <Text style={getTextStyle()}>{loading ? 'Loading...' : title}</Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <ButtonContent />
        </LinearGradient>
      ) : (
        <ButtonContent />
      )}
    </TouchableOpacity>
  );
};

// Basic Loading Skeleton Component
interface BasicSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const BasicSkeleton: React.FC<BasicSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusValue = borderRadius.md,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: borderRadiusValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // Card Styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  gradientCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },

  // Button Styles
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  button_small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  button_medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  button_large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  gradientButton: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  buttonTextPrimary: {
    color: colors.white,
  },
  buttonTextSecondary: {
    color: colors.white,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  loadingSpinner: {
    marginRight: spacing.sm,
  },

  // Skeleton Styles
  skeleton: {
    backgroundColor: colors.gray200,
  },
});
