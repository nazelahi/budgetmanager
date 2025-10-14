import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';

/**
 * Component showing all ways to access alert screens
 * This is a reference guide for developers and users
 */
const AlertAccessGuide: React.FC = () => {
  const navigation = useNavigation();

  const alertScreens = [
    {
      name: 'AlertsDashboard',
      title: 'All Alerts Dashboard',
      description: 'View all alerts, history, and suggestions in one place',
      icon: 'notifications',
      color: colors.primary,
    },
    {
      name: 'AlertSettings',
      title: 'Alert Settings',
      description: 'Configure alert thresholds, notifications, and preferences',
      icon: 'settings',
      color: colors.secondary,
    },
    {
      name: 'AlertHistory',
      title: 'Alert History',
      description: 'View historical budget alerts and spending patterns',
      icon: 'time',
      color: colors.warning || '#FFA500',
    },
    {
      name: 'SmartSuggestions',
      title: 'Smart Suggestions',
      description: 'AI-powered budget recommendations and tips',
      icon: 'bulb',
      color: colors.success || '#4CAF50',
    },
  ];

  const accessMethods = [
    {
      title: '1. Navigation Buttons',
      description: 'Tap the notification bell icon in the header of Dashboard or Budget screens',
      icon: 'notifications-outline',
    },
    {
      title: '2. Programmatic Navigation',
      description: 'Use navigation.navigate() in your components',
      icon: 'code',
      code: `navigation.navigate('AlertsDashboard');`,
    },
    {
      title: '3. Direct Screen Access',
      description: 'Access individual alert screens directly',
      icon: 'arrow-forward',
      code: `navigation.navigate('AlertSettings');`,
    },
    {
      title: '4. Context Functions',
      description: 'Use useApp hook to access alert data programmatically',
      icon: 'layers',
      code: `const { getUnreadAlerts } = useApp();`,
    },
  ];

  const handleNavigate = (screenName: string) => {
    (navigation as any).navigate(screenName);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="help-circle" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Alert Screen Access Guide</Text>
      </View>

      {/* Available Alert Screens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Alert Screens</Text>
        {alertScreens.map((screen) => (
          <TouchableOpacity
            key={screen.name}
            style={[styles.screenCard, { borderLeftColor: screen.color }]}
            onPress={() => handleNavigate(screen.name)}
          >
            <View style={styles.screenContent}>
              <View style={[styles.screenIcon, { backgroundColor: screen.color + '20' }]}>
                <Ionicons name={screen.icon as any} size={20} color={screen.color} />
              </View>
              <View style={styles.screenInfo}>
                <Text style={styles.screenTitle}>{screen.title}</Text>
                <Text style={styles.screenDescription}>{screen.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Access Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Access Alert Screens</Text>
        {accessMethods.map((method, index) => (
          <View key={index} style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <Ionicons name={method.icon as any} size={20} color={colors.primary} />
              <Text style={styles.methodTitle}>{method.title}</Text>
            </View>
            <Text style={styles.methodDescription}>{method.description}</Text>
            {method.code && (
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{method.code}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Quick Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Navigation</Text>
        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            style={styles.quickNavButton}
            onPress={() => handleNavigate('AlertsDashboard')}
          >
            <Ionicons name="notifications" size={24} color={colors.white} />
            <Text style={styles.quickNavText}>All Alerts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickNavButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleNavigate('AlertSettings')}
          >
            <Ionicons name="settings" size={24} color={colors.white} />
            <Text style={styles.quickNavText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickNavButton, { backgroundColor: colors.warning || '#FFA500' }]}
            onPress={() => handleNavigate('AlertHistory')}
          >
            <Ionicons name="time" size={24} color={colors.white} />
            <Text style={styles.quickNavText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickNavButton, { backgroundColor: colors.success || '#4CAF50' }]}
            onPress={() => handleNavigate('SmartSuggestions')}
          >
            <Ionicons name="bulb" size={24} color={colors.white} />
            <Text style={styles.quickNavText}>Suggestions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Usage Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Examples</Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>1. Navigate to Alerts Dashboard</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();
  
  const goToAlerts = () => {
    navigation.navigate('AlertsDashboard');
  };
  
  return (
    <TouchableOpacity onPress={goToAlerts}>
      <Text>View All Alerts</Text>
    </TouchableOpacity>
  );
};`}
            </Text>
          </View>
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>2. Get Alert Data Programmatically</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`import { useApp } from '../contexts/AppContext';

const MyComponent = () => {
  const { getUnreadAlerts, getAlertHistory } = useApp();
  
  const loadAlerts = async () => {
    const alerts = await getUnreadAlerts();
    const history = await getAlertHistory(30);
    console.log('Alerts:', alerts);
    console.log('History:', history);
  };
  
  useEffect(() => {
    loadAlerts();
  }, []);
};`}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  screenCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  screenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  screenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  screenInfo: {
    flex: 1,
  },
  screenTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  screenDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  methodCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  methodTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  methodDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  codeBlock: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  codeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickNavButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickNavText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  exampleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  exampleTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
});

export default AlertAccessGuide;
