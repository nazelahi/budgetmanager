import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  shadow?: keyof typeof shadows;
  backgroundColor?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'gradient';
  gradient?: keyof typeof gradients;
  borderColor?: string;
  borderRadius?: keyof typeof borderRadius;
  pressable?: boolean;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = '4',
  shadow = 'md',
  backgroundColor = colors.surface,
  variant = 'default',
  gradient,
  borderColor = colors.border,
  borderRadius: borderRadiusKey = 'card',
  pressable = false,
  disabled = false,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius[borderRadiusKey],
      padding: spacing[padding],
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor,
          ...shadows[shadow],
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          ...shadows.xs,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceSecondary,
          ...shadows.sm,
        };
      case 'gradient':
        return {
          ...baseStyle,
          ...shadows[shadow],
        };
      default:
        return {
          ...baseStyle,
          backgroundColor,
          ...shadows[shadow],
        };
    }
  };

  const getPressableStyle = (pressed: boolean): ViewStyle => {
    if (!pressed) return {};
    
    return {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    };
  };

  const renderContent = () => {
    if (variant === 'gradient' && gradient) {
      return (
        <LinearGradient
          colors={gradients[gradient] as [string, string]}
          style={[getCardStyle(), style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View style={[getCardStyle(), style]}>
        {children}
      </View>
    );
  };

  if (onPress) {
    if (pressable) {
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            getPressableStyle(pressed),
            disabled && { opacity: 0.5 },
          ]}
        >
          {renderContent()}
        </Pressable>
      );
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[disabled && { opacity: 0.5 }]}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

export default Card;
