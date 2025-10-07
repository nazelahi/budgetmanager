import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';

const MoreScreen: React.FC = () => {
  const navigation = useNavigation();

  const menuItems = [
    {
      id: 'categories',
      title: 'Categories',
      subtitle: 'Manage income and expense categories',
      icon: 'list-outline',
      color: colors.info,
      onPress: () => navigation.navigate('Categories' as never),
    },
    {
      id: 'savings-goals',
      title: 'Savings Goals',
      subtitle: 'Set and track your financial goals',
      icon: 'flag-outline',
      color: colors.success,
      onPress: () => navigation.navigate('SavingsGoals' as never),
    },
    {
      id: 'recurring',
      title: 'Recurring Transactions',
      subtitle: 'Manage recurring bills and income',
      icon: 'repeat-outline',
      color: colors.warning,
      onPress: () => navigation.navigate('RecurringTransactions' as never),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      icon: 'settings-outline',
      color: colors.gray600,
      onPress: () => navigation.navigate('Settings' as never),
    },
  ];

  const quickActions = [
    {
      id: 'add-transaction',
      title: 'Add Transaction',
      icon: 'add-circle-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('AddTransaction' as never),
    },
    {
      id: 'scan-receipt',
      title: 'Scan Receipt',
      icon: 'camera-outline',
      color: colors.success,
      onPress: () => {
        Alert.alert(
          'Receipt Scanner',
          'Receipt scanning feature will be available soon!',
          [{ text: 'OK' }]
        );
      },
    },
    {
      id: 'export-data',
      title: 'Export Data',
      icon: 'download-outline',
      color: colors.info,
      onPress: () => {
        Alert.alert(
          'Export Data',
          'Data export feature will be available soon!',
          [{ text: 'OK' }]
        );
      },
    },
  ];

  const renderMenuItem = (item: typeof menuItems[0]) => (
    <TouchableOpacity key={item.id} onPress={item.onPress}>
      <Card style={styles.menuItem}>
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderQuickAction = (action: typeof quickActions[0]) => (
    <TouchableOpacity key={action.id} onPress={action.onPress} style={styles.quickActionContainer}>
      <Card style={styles.quickActionCard}>
        <View style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon as any} size={24} color={action.color} />
          </View>
          <Text style={styles.quickActionText}>{action.title}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="More"
        subtitle="Additional features and settings"
        variant="gradient"
      />

      <ScrollView style={styles.scrollView}>
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Main Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Card style={styles.appInfoCard}>
            <View style={styles.appInfoContent}>
              <View style={styles.appIcon}>
                <LinearGradient
                  colors={gradients.primary as [string, string]}
                  style={styles.appIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="wallet" size={32} color={colors.white} />
                </LinearGradient>
              </View>
              <View style={styles.appInfoText}>
                <Text style={styles.appName}>Budget Manager</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appDescription}>
                  Your personal finance companion
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for better financial management
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  section: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['6'],
  },
  sectionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['4'],
    marginTop: spacing['2'],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: '48%', // 2 columns with gap
    marginBottom: spacing['3'],
  },
  quickActionCard: {
    padding: spacing['4'],
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
    ...shadows.sm,
  },
  quickActionText: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
  },
  menuItem: {
    marginBottom: spacing['2'],
    padding: spacing['4'],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing['0.5'],
  },
  menuSubtitle: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  appInfoCard: {
    padding: spacing['5'],
    alignItems: 'center',
  },
  appInfoContent: {
    alignItems: 'center',
  },
  appIcon: {
    marginBottom: spacing['4'],
  },
  appIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  appInfoText: {
    alignItems: 'center',
  },
  appName: {
    ...typography.textStyles.headline5,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  appVersion: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing['2'],
  },
  appDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing['6'],
    paddingHorizontal: spacing['4'],
  },
  footerText: {
    ...typography.textStyles.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default MoreScreen;
