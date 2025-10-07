import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showProfile?: boolean;
  onProfilePress?: () => void;
  variant?: 'default' | 'minimal' | 'gradient';
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  showProfile = false,
  onProfilePress,
  variant = 'default',
  backgroundColor = colors.primary,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      navigation.navigate('Settings' as never);
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightComponent}
        {showProfile && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <SafeAreaView style={styles.safeAreaGradient} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <LinearGradient
          colors={gradients.primary as [string, string]}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (variant === 'minimal') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <View style={[styles.minimalHeader, { backgroundColor }]}>
          {renderContent()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={[styles.defaultHeader, { backgroundColor }]}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
  },
  safeAreaGradient: {
    backgroundColor: colors.primary,
  },
  defaultHeader: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    ...shadows.sm,
  },
  gradientHeader: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    ...shadows.lg,
  },
  minimalHeader: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  backButton: {
    padding: spacing['2'],
    marginRight: spacing['2'],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.textStyles.headline3,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing['0.5'],
  },
  profileButton: {
    padding: spacing['1'],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default Header;
