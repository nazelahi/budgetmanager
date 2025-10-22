import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import AnimatedWrapper from "./AnimatedWrapper";
import useAnimation from "../hooks/useAnimation";
import { colors, spacing } from "../utils/theme";

// Example 1: Layout Animation Only (Recommended)
const LayoutAnimationExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Layout Animation Only</Text>

      {/* Use AnimatedWrapper for layout animations */}
      <AnimatedWrapper delay={0} direction="up">
        <View style={styles.card}>
          <Text>This uses layout animation only</Text>
        </View>
      </AnimatedWrapper>

      <AnimatedWrapper delay={100} direction="down">
        <View style={styles.card}>
          <Text>This also uses layout animation only</Text>
        </View>
      </AnimatedWrapper>
    </View>
  );
};

// Example 2: Transform Animation Only (Using useAnimation hook)
const TransformAnimationExample: React.FC = () => {
  const { useFadeAnimation, useScaleAnimation } = useAnimation();
  const { fadeIn, fadeOut, animatedStyle: fadeStyle } = useFadeAnimation(0);
  const {
    scaleIn,
    scaleOut,
    animatedStyle: scaleStyle,
  } = useScaleAnimation(0.8);

  const handlePress = () => {
    fadeIn();
    scaleIn();
  };

  const handleLongPress = () => {
    fadeOut();
    scaleOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transform Animation Only</Text>

      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={styles.button}
      >
        <Animated.View style={[styles.card, fadeStyle, scaleStyle]}>
          <Text>Press for transform animation</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// Example 3: Mixed Animations (Separated properly)
const MixedAnimationExample: React.FC = () => {
  const { useCombinedAnimation } = useAnimation();
  const { animateIn, animateOut, animatedStyle } = useCombinedAnimation();

  const handlePress = () => {
    animateIn();
  };

  const handleLongPress = () => {
    animateOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mixed Animations (Properly Separated)</Text>

      {/* Layout animation wrapper */}
      <AnimatedWrapper delay={0} direction="up">
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={styles.button}
        >
          {/* Transform animation content */}
          <Animated.View style={[styles.card, animatedStyle]}>
            <Text>Layout + Transform animations</Text>
          </Animated.View>
        </TouchableOpacity>
      </AnimatedWrapper>
    </View>
  );
};

// Example 4: Using runOnJS properly
const RunOnJSExample: React.FC = () => {
  const opacity = useSharedValue(0);
  const [message, setMessage] = React.useState("Press to animate");

  const updateMessage = (newMessage: string) => {
    setMessage(newMessage);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = () => {
    opacity.value = withTiming(1, { duration: 300 }, () => {
      runOnJS(updateMessage)("Animation completed!");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>runOnJS Example</Text>

      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text>{message}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// Example 5: Performance Optimized List Item
const OptimizedListItem: React.FC<{
  item: { id: string; text: string };
  index: number;
  onPress: (id: string) => void;
}> = React.memo(({ item, index, onPress }) => {
  const { useFadeAnimation } = useAnimation();
  const { fadeIn, animatedStyle } = useFadeAnimation(0);

  React.useEffect(() => {
    fadeIn();
  }, [fadeIn]);

  return (
    <AnimatedWrapper delay={index * 50} direction="up">
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onPress(item.id)}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text>{item.text}</Text>
        </Animated.View>
      </TouchableOpacity>
    </AnimatedWrapper>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  button: {
    marginBottom: spacing.sm,
  },
  listItem: {
    marginBottom: spacing.sm,
  },
});

export {
  LayoutAnimationExample,
  TransformAnimationExample,
  MixedAnimationExample,
  RunOnJSExample,
  OptimizedListItem,
};
