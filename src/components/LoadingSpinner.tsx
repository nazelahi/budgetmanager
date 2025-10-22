import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// import { BlurView } from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  gradients,
  animations,
} from "../utils/theme";

const { width: screenWidth } = Dimensions.get("window");

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  color?: string;
  style?: any;
  showMessage?: boolean;
  variant?: "default" | "card" | "overlay";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "large",
  color = colors.primary,
  style,
  showMessage = true,
  variant = "default",
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: animations.normal });
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getSize = () => {
    switch (size) {
      case "small":
        return 24;
      case "medium":
        return 32;
      case "large":
        return 48;
      default:
        return 48;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "medium":
        return 20;
      case "large":
        return 24;
      default:
        return 24;
    }
  };

  const SpinnerContent = () => (
    <View style={styles.spinnerContent}>
      <Animated.View style={[styles.spinner, animatedSpinnerStyle]}>
        <LinearGradient
          colors={[color, color + "80"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.spinnerGradient,
            {
              width: getSize(),
              height: getSize(),
              borderRadius: getSize() / 2,
            },
          ]}
        >
          <Ionicons name="refresh" size={getIconSize()} color={colors.white} />
        </LinearGradient>
      </Animated.View>
      {showMessage && (
        <Text
          style={[
            styles.message,
            { fontSize: size === "small" ? 12 : size === "medium" ? 14 : 16 },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (variant === "overlay") {
    return (
      <Animated.View
        style={[styles.overlayContainer, animatedContainerStyle, style]}
      >
        <LinearGradient colors={gradients.glass} style={styles.overlayGradient}>
          <SpinnerContent />
        </LinearGradient>
      </Animated.View>
    );
  }

  if (variant === "card") {
    return (
      <Animated.View
        style={[styles.cardContainer, animatedContainerStyle, style]}
      >
        <LinearGradient
          colors={gradients.cardGlass}
          style={styles.cardGradient}
        >
          <SpinnerContent />
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, style]}>
      <SpinnerContent />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
    overflow: "hidden",
  },
  cardGradient: {
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 120,
  },
  spinnerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginBottom: spacing.md,
  },
  spinnerGradient: {
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default LoadingSpinner;
