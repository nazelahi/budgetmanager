import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  helperText?: string;
  required?: boolean;
  autoFocus?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  maxLength,
  variant = 'outlined',
  size = 'md',
  helperText,
  required = false,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedScale] = useState(new Animated.Value(1));

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(focusedScale, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(focusedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const getRightIconName = () => {
    if (secureTextEntry) {
      return showPassword ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 36,
          paddingHorizontal: spacing['3'],
          paddingVertical: spacing['1.5'],
          fontSize: typography.fontSize.sm,
        };
      case 'lg':
        return {
          minHeight: 52,
          paddingHorizontal: spacing['5'],
          paddingVertical: spacing['3'],
          fontSize: typography.fontSize.lg,
        };
      default:
        return {
          minHeight: 44,
          paddingHorizontal: spacing['4'],
          paddingVertical: spacing['2'],
          fontSize: typography.fontSize.base,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 0,
          ...shadows.xs,
        };
      case 'underlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: 0,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          ...shadows.sm,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { marginBottom: spacing['2'] }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: disabled ? colors.gray100 : variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth,
            borderBottomWidth: variantStyles.borderBottomWidth || variantStyles.borderWidth,
            borderRadius: variantStyles.borderRadius || borderRadius.input,
            minHeight: sizeStyles.minHeight,
            ...shadows[error ? 'none' : 'sm'],
            transform: [{ scale: focusedScale }],
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary : colors.gray500}
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              paddingLeft: leftIcon ? spacing['12'] : sizeStyles.paddingHorizontal,
              paddingRight: rightIcon || secureTextEntry ? spacing['12'] : sizeStyles.paddingHorizontal,
              paddingVertical: sizeStyles.paddingVertical,
              fontSize: sizeStyles.fontSize,
              color: disabled ? colors.textTertiary : colors.textPrimary,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          autoFocus={autoFocus}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.iconContainer}
            disabled={!onRightIconPress && !secureTextEntry}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getRightIconName() as keyof typeof Ionicons.glyphMap}
              size={20}
              color={isFocused ? colors.primary : colors.gray500}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['4'],
  },
  label: {
    ...typography.textStyles.labelMedium,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  iconContainer: {
    position: 'absolute',
    padding: spacing['2'],
    zIndex: 1,
  },
  helperContainer: {
    marginTop: spacing['1'],
    minHeight: 16,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
  helperText: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
  },
});

export default Input;
