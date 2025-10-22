import React from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  FadeIn,
  BounceIn,
  ZoomIn,
  EnteringAnimation,
} from "react-native-reanimated";

interface SimpleAnimatedWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "bounce" | "zoom";
  duration?: number;
  style?: ViewStyle;
  entering?: EnteringAnimation;
}

export const SimpleAnimatedWrapper: React.FC<SimpleAnimatedWrapperProps> = ({
  children,
  delay = 0,
  direction = "up",
  duration = 300,
  style,
  entering,
}) => {
  const getEnteringAnimation = (): EnteringAnimation => {
    if (entering) return entering;

    const baseAnimation = (() => {
      switch (direction) {
        case "up":
          return FadeInUp;
        case "down":
          return FadeInDown;
        case "left":
          return SlideInLeft;
        case "right":
          return SlideInRight;
        case "fade":
          return FadeIn;
        case "bounce":
          return BounceIn;
        case "zoom":
          return ZoomIn;
        default:
          return FadeInUp;
      }
    })();

    return baseAnimation.delay(delay).duration(duration);
  };

  return (
    <Animated.View entering={getEnteringAnimation()} style={style}>
      {children}
    </Animated.View>
  );
};

export default SimpleAnimatedWrapper;
