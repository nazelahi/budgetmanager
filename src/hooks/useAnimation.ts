import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useCallback } from "react";

interface AnimationConfig {
  duration?: number;
  damping?: number;
  stiffness?: number;
  delay?: number;
}

export const useAnimation = () => {
  // Fade animation
  const useFadeAnimation = (initialOpacity: number = 0) => {
    const opacity = useSharedValue(initialOpacity);

    const fadeIn = useCallback(
      (config: AnimationConfig = {}) => {
        opacity.value = withTiming(1, {
          duration: config.duration || 300,
        });
      },
      [opacity],
    );

    const fadeOut = useCallback(
      (config: AnimationConfig = {}, onComplete?: () => void) => {
        opacity.value = withTiming(
          0,
          {
            duration: config.duration || 300,
          },
          onComplete ? () => runOnJS(onComplete)() : undefined,
        );
      },
      [opacity],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return { opacity, fadeIn, fadeOut, animatedStyle };
  };

  // Scale animation
  const useScaleAnimation = (initialScale: number = 1) => {
    const scale = useSharedValue(initialScale);

    const scaleIn = useCallback(
      (config: AnimationConfig = {}) => {
        scale.value = withSpring(1, {
          damping: config.damping || 15,
          stiffness: config.stiffness || 100,
        });
      },
      [scale],
    );

    const scaleOut = useCallback(
      (config: AnimationConfig = {}, onComplete?: () => void) => {
        scale.value = withSpring(
          0.95,
          {
            damping: config.damping || 15,
            stiffness: config.stiffness || 100,
          },
          onComplete ? () => runOnJS(onComplete)() : undefined,
        );
      },
      [scale],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return { scale, scaleIn, scaleOut, animatedStyle };
  };

  // Translate animation
  const useTranslateAnimation = (initialY: number = 0) => {
    const translateY = useSharedValue(initialY);

    const slideIn = useCallback(
      (config: AnimationConfig = {}) => {
        translateY.value = withSpring(0, {
          damping: config.damping || 15,
          stiffness: config.stiffness || 100,
        });
      },
      [translateY],
    );

    const slideOut = useCallback(
      (config: AnimationConfig = {}, onComplete?: () => void) => {
        translateY.value = withSpring(
          50,
          {
            damping: config.damping || 15,
            stiffness: config.stiffness || 100,
          },
          onComplete ? () => runOnJS(onComplete)() : undefined,
        );
      },
      [translateY],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return { translateY, slideIn, slideOut, animatedStyle };
  };

  // Combined animation for complex effects
  const useCombinedAnimation = () => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const translateY = useSharedValue(30);

    const animateIn = useCallback(
      (config: AnimationConfig = {}) => {
        opacity.value = withTiming(1, {
          duration: config.duration || 300,
        });
        scale.value = withSpring(1, {
          damping: config.damping || 15,
          stiffness: config.stiffness || 100,
        });
        translateY.value = withSpring(0, {
          damping: config.damping || 15,
          stiffness: config.stiffness || 100,
        });
      },
      [opacity, scale, translateY],
    );

    const animateOut = useCallback(
      (config: AnimationConfig = {}, onComplete?: () => void) => {
        opacity.value = withTiming(0, {
          duration: config.duration || 300,
        });
        scale.value = withSpring(0.8, {
          damping: config.damping || 15,
          stiffness: config.stiffness || 100,
        });
        translateY.value = withSpring(
          30,
          {
            damping: config.damping || 15,
            stiffness: config.stiffness || 100,
          },
          onComplete ? () => runOnJS(onComplete)() : undefined,
        );
      },
      [opacity, scale, translateY],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    return { animateIn, animateOut, animatedStyle };
  };

  return {
    useFadeAnimation,
    useScaleAnimation,
    useTranslateAnimation,
    useCombinedAnimation,
  };
};

export default useAnimation;
