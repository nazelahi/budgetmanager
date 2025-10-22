import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// import { BlurView } from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { colors, gradients } from "../utils/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ModernBackgroundProps {
  variant?: "default" | "gradient" | "glass" | "animated";
  children?: React.ReactNode;
  style?: any;
}

const ModernBackground: React.FC<ModernBackgroundProps> = ({
  variant = "default",
  children,
  style,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    if (variant === "animated") {
      animatedValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0, { duration: 3000 }),
        ),
        -1,
        false,
      );
    }
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant !== "animated") return {};

    return {
      transform: [
        {
          scale: interpolate(
            animatedValue.value,
            [0, 1],
            [1, 1.05],
            Extrapolate.CLAMP,
          ),
        },
      ],
    };
  });

  const renderBackground = () => {
    switch (variant) {
      case "gradient":
        return (
          <LinearGradient
            colors={[colors.background, colors.backgroundSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          />
        );

      case "glass":
        return (
          <LinearGradient
            colors={gradients.glass}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassOverlay}
          />
        );

      case "animated":
        return (
          <Animated.View style={[styles.animatedContainer, animatedStyle]}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.animatedGradient}
            />
            <View style={styles.animatedOverlay} />
          </Animated.View>
        );

      default:
        return <View style={styles.defaultBackground} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderBackground()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  defaultBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animatedContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animatedGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animatedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

export default ModernBackground;
