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
  Layout,
} from "react-native-reanimated";

interface AnimatedWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "bounce" | "zoom";
  duration?: number;
  style?: ViewStyle;
  entering?: EnteringAnimation;
  // For transform animations - use this instead of mixing with layout animations
  useTransform?: boolean;
  transformStyle?: ViewStyle;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  delay = 0,
  direction = "up",
  duration = 300,
  style,
  entering,
  useTransform = false,
  transformStyle,
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

  // For Reanimated 4.x, we need to be more careful about mixing animations
  // Use layout animations only to avoid the warning
  return (
    <Animated.View
      entering={getEnteringAnimation()}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

// Utility hook for transform animations that should not be mixed with layout animations
export const useTransformAnimation = () => {
  return {
    // Use this for transform animations only
    createTransformStyle: (opacity: any, translateY: any, scale: any) => ({
      opacity,
      transform: [{ translateY }, { scale }],
    }),
    // Use this for layout animations only
    createLayoutAnimation: (delay: number = 0, direction: string = "up") => {
      const getAnimation = () => {
        switch (direction) {
          case "up":
            return FadeInUp.delay(delay);
          case "down":
            return FadeInDown.delay(delay);
          case "left":
            return SlideInLeft.delay(delay);
          case "right":
            return SlideInRight.delay(delay);
          default:
            return FadeInUp.delay(delay);
        }
      };
      return getAnimation();
    },
  };
};

export default AnimatedWrapper;
