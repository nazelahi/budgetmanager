import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface SettingsNavigationBarProps {
  activeTab: 'profile' | 'preferences' | 'security' | 'about';
  onTabChange: (tab: 'profile' | 'preferences' | 'security' | 'about') => void;
}

const SettingsNavigationBar: React.FC<SettingsNavigationBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigation = useNavigation();

  const tabs = [
    {
      key: 'profile' as const,
      label: 'Profile',
      icon: 'person-outline',
    },
    {
      key: 'preferences' as const,
      label: 'Preferences',
      icon: 'settings-outline',
    },
    {
      key: 'security' as const,
      label: 'Security',
      icon: 'shield-outline',
    },
    {
      key: 'about' as const,
      label: 'About',
      icon: 'information-circle-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    isActive && styles.activeTab,
                  ]}
                  onPress={() => onTabChange(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.tabContent,
                    isActive && styles.activeTabContent,
                  ]}>
                    <Ionicons
                      name={tab.icon as any}
                      size={20}
                      color={isActive ? colors.primary : colors.white}
                    />
                    <Text style={[
                      styles.tabLabel,
                      isActive && styles.activeTabLabel,
                    ]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...shadows.lg,
  },
  gradient: {
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['4'],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  tab: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    borderRadius: borderRadius['xl'],
    minWidth: 70,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabContent: {
    alignItems: 'center',
    gap: spacing['1'],
  },
  activeTabContent: {
    // Additional styles for active tab content if needed
  },
  tabLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  backButton: {
    padding: spacing['2'],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: spacing['4'],
  },
});

export default SettingsNavigationBar;
