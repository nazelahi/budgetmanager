import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, gradients } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

// Simple Animated Card Component
interface SimpleAnimatedCardProps {
  children: React.ReactNode;
  style?: any;
  delay?: number;
  onPress?: () => void;
  gradient?: readonly [string, string, ...string[]];
  disabled?: boolean;
}

export const SimpleAnimatedCard: React.FC<SimpleAnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  onPress,
  gradient,
  disabled = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const CardContent = () => (
    <Animated.View style={[styles.card, animatedStyle, style]}>
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
    </Animated.View>
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

// Simple Animated Button Component
interface SimpleAnimatedButtonProps {
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

export const SimpleAnimatedButton: React.FC<SimpleAnimatedButtonProps> = ({
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
  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        <Animated.View style={styles.loadingSpinner}>
          <Ionicons name="refresh" size={16} color={colors.white} />
        </Animated.View>
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
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={getButtonStyle()}
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
    </Animated.View>
  );
};

// Simple Loading Skeleton Component
interface SimpleSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SimpleSkeleton: React.FC<SimpleSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusValue = borderRadius.md,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const shimmerAnimation = () => {
      opacity.value = withTiming(0.7, { duration: 1000 }, () => {
        opacity.value = withTiming(0.3, { duration: 1000 }, () => {
          shimmerAnimation();
        });
      });
    };
    shimmerAnimation();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: borderRadiusValue,
        },
        animatedStyle,
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
