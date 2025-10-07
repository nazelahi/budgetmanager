import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface FloatingActionButtonProps {
  onAddTransaction: () => void;
  onAddBudget: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddTransaction,
  onAddBudget,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const scaleInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateYInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleExpanded}
          activeOpacity={1}
        />
      )}
      
      {/* Action buttons */}
      <Animated.View
        style={[
          styles.actionContainer,
          {
            transform: [
              { translateY: translateYInterpolate },
              { scale: scaleInterpolate },
            ],
            opacity: scaleInterpolate,
          },
        ]}
      >
        {/* Add Budget Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            onAddBudget();
            toggleExpanded();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.secondary, colors.secondaryDark]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="wallet" size={20} color={colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Budget</Text>
        </TouchableOpacity>
        
        {/* Add Transaction Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            onAddTransaction();
            toggleExpanded();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Transaction</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Main FAB */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.mainGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }],
            }}
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  actionGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionLabel: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  mainGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingActionButton;
