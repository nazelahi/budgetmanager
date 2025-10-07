import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'text' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: keyof typeof gradients;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  pressable?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  gradient,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  pressable = false,
}) => {
  const getButtonStyle = (pressed: boolean = false): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: rounded ? borderRadius.full : borderRadius.button,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...(fullWidth && { width: '100%' }),
    };

    // Size styles
    const sizeStyles = {
      xs: {
        paddingHorizontal: spacing['2'],
        paddingVertical: spacing['1'],
        minHeight: 24,
        gap: spacing['1'],
      },
      sm: {
        paddingHorizontal: spacing['3'],
        paddingVertical: spacing['1.5'],
        minHeight: 32,
        gap: spacing['1.5'],
      },
      md: {
        paddingHorizontal: spacing['4'],
        paddingVertical: spacing['2'],
        minHeight: 40,
        gap: spacing['2'],
      },
      lg: {
        paddingHorizontal: spacing['6'],
        paddingVertical: spacing['3'],
        minHeight: 48,
        gap: spacing['2'],
      },
      xl: {
        paddingHorizontal: spacing['8'],
        paddingVertical: spacing['4'],
        minHeight: 56,
        gap: spacing['3'],
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: colors.secondary,
        ...shadows.sm,
      },
      accent: {
        backgroundColor: colors.accent,
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
        ...shadows.xs,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: spacing['2'],
        paddingVertical: spacing['1'],
      },
      gradient: {
        ...shadows.sm,
      },
    };

    const pressedStyle = pressed ? {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...pressedStyle,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      textAlign: 'center',
      fontWeight: typography.fontWeight.semibold,
    };

    const sizeStyles = {
      xs: { ...typography.textStyles.buttonSmall },
      sm: { ...typography.textStyles.buttonSmall },
      md: { ...typography.textStyles.buttonMedium },
      lg: { ...typography.textStyles.buttonLarge },
      xl: { ...typography.textStyles.buttonLarge, fontSize: typography.fontSize.lg },
    };

    const variantStyles = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      accent: { color: colors.white },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      text: { color: colors.primary },
      gradient: { color: colors.white },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getGradientColors = (): string[] => {
    if (gradient) {
      return gradients[gradient] as [string, string];
    }
    
    switch (variant) {
      case 'primary':
        return gradients.primary;
      case 'secondary':
        return gradients.secondary;
      case 'accent':
        return gradients.accent;
      default:
        return gradients.primary;
    }
  };

  const renderContent = () => {
    const textElement = (
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    );

    const loadingElement = (
      <ActivityIndicator 
        color={variant === 'outline' || variant === 'ghost' || variant === 'text' ? colors.primary : colors.white} 
        size="small" 
      />
    );

    if (loading) {
      return loadingElement;
    }

    if (icon) {
      return (
        <>
          {iconPosition === 'left' && icon}
          {textElement}
          {iconPosition === 'right' && icon}
        </>
      );
    }

    return textElement;
  };

  const renderButton = (pressed: boolean = false) => {
    if (variant === 'gradient' || gradient) {
      return (
        <LinearGradient
          colors={getGradientColors() as [string, string]}
          style={[getButtonStyle(pressed), style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View style={[getButtonStyle(pressed), style]}>
        {renderContent()}
      </View>
    );
  };

  if (pressable) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [getButtonStyle(pressed), style]}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderButton()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
