import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  createAnimatedComponent,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from '@react-native-community/blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, gradients, animations } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

// Create animated components
const AnimatedTextInput = createAnimatedComponent(TextInput);

// Animated Card Component
interface AnimatedCardProps {
  children: React.ReactNode;
  style?: any;
  delay?: number;
  onPress?: () => void;
  glass?: boolean;
  gradient?: readonly [string, string, ...string[]];
  disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  onPress,
  glass = false,
  gradient,
  disabled = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: animations.normal })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const pressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const CardContent = () => (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {glass ? (
        <View style={styles.glassCard}>
          {gradient ? (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientOverlay}
            >
              {children}
            </LinearGradient>
          ) : (
            children
          )}
        </View>
      ) : gradient ? (
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
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.8}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

// Animated Button Component
interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: readonly [string, string, ...string[]];
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
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
  const opacity = useSharedValue(1);

  const pressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      scale.value = withSequence(
        withSpring(0.9, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
      onPress();
    }
  };

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: animations.fast });
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
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
      case 'ghost':
        return [...baseStyle, styles.buttonGhost];
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
      case 'ghost':
        return [...baseStyle, styles.buttonTextGhost];
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
        onPress={handlePress}
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

// Animated Input Component
interface AnimatedInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  style?: any;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  multiline = false,
  keyboardType = 'default',
  style,
}) => {
  const focusScale = useSharedValue(1);
  const borderColor = useSharedValue(0);
  const labelTranslateY = useSharedValue(0);
  const labelScale = useSharedValue(1);

  const onFocus = () => {
    focusScale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
    borderColor.value = withTiming(1, { duration: animations.fast });
    labelTranslateY.value = withTiming(-8, { duration: animations.fast });
    labelScale.value = withTiming(0.85, { duration: animations.fast });
  };

  const onBlur = () => {
    focusScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    if (!value) {
      borderColor.value = withTiming(0, { duration: animations.fast });
      labelTranslateY.value = withTiming(0, { duration: animations.fast });
      labelScale.value = withTiming(1, { duration: animations.fast });
    }
  };

  useEffect(() => {
    if (value) {
      labelTranslateY.value = withTiming(-8, { duration: animations.fast });
      labelScale.value = withTiming(0.85, { duration: animations.fast });
    }
  }, [value]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value === 1 ? colors.primary : colors.border,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelTranslateY.value },
      { scale: labelScale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.inputContainer, animatedContainerStyle, style]}>
      {label && (
        <Animated.Text style={[styles.inputLabel, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      )}
      <Animated.View style={[styles.inputWrapper, animatedBorderStyle]}>
        <AnimatedTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        />
      </Animated.View>
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </Animated.View>
  );
};

// Loading Skeleton Component
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusValue = borderRadius.md,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    const shimmerAnimation = () => {
      shimmer.value = withTiming(1, { duration: 1000 }, () => {
        shimmer.value = withTiming(0, { duration: 1000 }, () => {
          shimmerAnimation();
        });
      });
    };
    shimmerAnimation();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      Extrapolate.CLAMP
    ),
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
  glassCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  gradientOverlay: {
    flex: 1,
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
  buttonGhost: {
    backgroundColor: 'transparent',
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
  buttonTextGhost: {
    color: colors.primary,
  },
  loadingSpinner: {
    marginRight: spacing.sm,
  },

  // Input Styles
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    zIndex: 1,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  input: {
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textTertiary,
  },
  inputErrorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },

  // Skeleton Styles
  skeleton: {
    backgroundColor: colors.gray200,
  },
});
