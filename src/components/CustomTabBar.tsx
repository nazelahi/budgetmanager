import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface TabItem {
  name: string;
  icon: string;
  activeIcon: string;
  label: string;
  gradient?: keyof typeof gradients;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  {
    name: 'Dashboard',
    icon: 'home-outline',
    activeIcon: 'home',
    label: 'Dashboard',
    gradient: 'success',
  },
  {
    name: 'Transactions',
    icon: 'swap-horizontal-outline',
    activeIcon: 'swap-horizontal',
    label: 'Transactions',
    gradient: 'accent',
  },
  {
    name: 'Accounts',
    icon: 'wallet-outline',
    activeIcon: 'wallet',
    label: 'Accounts',
    gradient: 'info',
  },
  {
    name: 'Budgets',
    icon: 'card-outline',
    activeIcon: 'card',
    label: 'Budgets',
    gradient: 'warning',
  },
  {
    name: 'Reports',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
    label: 'Reports',
    gradient: 'secondary',
  },
  {
    name: 'More',
    icon: 'menu-outline',
    activeIcon: 'menu',
    label: 'More',
    gradient: 'info',
  },
];

// Curved Cutout Component - transparent to show gradient
const CurvedCutout = () => (
  <Svg width={width} height={50} style={styles.curvedCutout}>
    <Path
      d={`M0,8 Q${width/2 - 40},0 ${width/2},8 Q${width/2 + 40},0 ${width},8 L${width},50 L0,50 Z`}
      fill="transparent"
    />
  </Svg>
);

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const tabWidth = width / 4;
  const animatedValues = useRef(
    tabs.map(() => new Animated.Value(0))
  ).current;
  const centerButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate the active tab
    animatedValues.forEach((animValue, index) => {
      Animated.spring(animValue, {
        toValue: state.index === index ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    });
  }, [state.index]);

  const handleCenterButtonPress = () => {
    // Animate center button press
    Animated.sequence([
      Animated.timing(centerButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(centerButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate to add transaction
    navigation.navigate('AddTransaction');
  };

  return (
    <View style={styles.container}>
      {/* Project-style Gradient Background */}
      <LinearGradient
        colors={gradients.primary as [string, string]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Navigation Bar with Curved Cutout */}
      <View style={styles.navBarContainer}>
        <CurvedCutout />
        
        {/* Tab items - Split into two groups with center space */}
        <View style={styles.tabContainer}>
          {/* Left group - First 3 tabs */}
          <View style={styles.tabGroup}>
            {state.routes.slice(0, 3).map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const tab = tabs.find(t => t.name === route.name);
              const animatedValue = animatedValues[index];

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabItem}
                >
                  {({ pressed }) => (
                    <Animated.View
                      style={[
                        styles.tabContent,
                        {
                          transform: [
                            { scale: pressed ? 0.95 : 1 },
                          ],
                        },
                      ]}
                    >
                      <View style={[
                        styles.iconContainer,
                        isFocused && styles.iconContainerActive,
                        pressed && styles.iconContainerPressed
                      ]}>
                        <Ionicons
                          name={isFocused ? tab?.activeIcon as any : tab?.icon as any}
                          size={24}
                          color={isFocused ? colors.white : colors.white}
                        />
                      </View>
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Center space for FAB */}
          <View style={styles.centerSpace} />

          {/* Right group - Last 3 tabs */}
          <View style={styles.tabGroup}>
            {state.routes.slice(3).map((route: any, index: number) => {
              const actualIndex = index + 3; // Adjust index for the right group
              const { options } = descriptors[route.key];
              const isFocused = state.index === actualIndex;
              const tab = tabs.find(t => t.name === route.name);
              const animatedValue = animatedValues[actualIndex];

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabItem}
                >
                  {({ pressed }) => (
                    <Animated.View
                      style={[
                        styles.tabContent,
                        {
                          transform: [
                            { scale: pressed ? 0.95 : 1 },
                          ],
                        },
                      ]}
                    >
                      <View style={[
                        styles.iconContainer,
                        isFocused && styles.iconContainerActive,
                        pressed && styles.iconContainerPressed
                      ]}>
                        <Ionicons
                          name={isFocused ? tab?.activeIcon as any : tab?.icon as any}
                          size={24}
                          color={isFocused ? colors.white : colors.white}
                        />
                      </View>
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: centerButtonScale }],
          },
        ]}
      >
        <Pressable
          onPress={handleCenterButtonPress}
          style={styles.fab}
        >
          {({ pressed }) => (
            <Animated.View
              style={[
                styles.fabInner,
                {
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <View style={styles.fabWhiteBackground}>
                <View style={styles.fabOuterRing}>
                  <LinearGradient
                    colors={gradients.primary as [string, string]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.fabInnerGlow}>
                      <Ionicons name="add" size={24} color={colors.white} />
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  curvedCutout: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSpace: {
    width: 60,
    height: 60,
  },
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 60,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainerHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ scale: 1.05 }],
  },
  iconContainerPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 0.95 }],
  },
  label: {
    ...typography.textStyles.caption,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  
  // Floating Action Button Styles - redesigned
  fabContainer: {
    position: 'absolute',
    top: -20,
    left: width / 2 - 30,
    width: 60,
    height: 60,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: colors.shadowColored,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabOuterRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabInnerGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fabWhiteBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -15,
    left: -15,
    shadowColor: colors.shadowDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CustomTabBar;