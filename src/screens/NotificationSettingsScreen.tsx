import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser } from '../store/slices/userSlice';
import NotificationService from '../services/notificationService';

interface NotificationSettings {
  budgetAlerts: boolean;
  billReminders: boolean;
  spendingAlerts: boolean;
  goalMilestones: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  lowBalanceAlerts: boolean;
  unusualSpending: boolean;
}

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    billReminders: true,
    spendingAlerts: true,
    goalMilestones: true,
    weeklyReports: false,
    monthlyReports: true,
    lowBalanceAlerts: true,
    unusualSpending: true,
  });
  
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const granted = await NotificationService.requestPermissionsAsync();
    setPermissionsGranted(granted);
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!permissionsGranted) {
      const granted = await NotificationService.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      setPermissionsGranted(true);
    }

    if (user) {
      dispatch(updateUser({
        ...user,
        notifications: true,
      }));
      Alert.alert('Success', 'Notification settings updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleTestNotification = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Please enable notifications first.');
      return;
    }

    await NotificationService.scheduleBudgetAlert({
      budgetId: 'test',
      budgetName: 'Test Budget',
      category: 'Test Category',
      spent: 100,
      limit: 50,
      percentage: 200,
      type: 'exceeded'
    });
    
    Alert.alert('Test Sent', 'A test notification has been sent!');
  };

  const renderSettingItem = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
    icon: string
  ) => (
    <Card style={styles.settingItem}>
      <View style={styles.settingContent}>
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={settings[key]}
          onValueChange={() => handleToggle(key)}
          trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
          thumbColor={settings[key] ? colors.primary : colors.gray500}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Notification Settings"
        subtitle="Manage your notification preferences"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        {!permissionsGranted && (
          <View style={styles.section}>
            <Card style={styles.warningCard}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={24} color={colors.warning} />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Notifications Disabled</Text>
                  <Text style={styles.warningDescription}>
                    Please enable notifications in your device settings to receive budget alerts and reminders.
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget & Spending</Text>
          {renderSettingItem(
            'budgetAlerts',
            'Budget Alerts',
            'Get notified when approaching budget limits',
            'wallet'
          )}
          {renderSettingItem(
            'spendingAlerts',
            'Spending Alerts',
            'Receive alerts for unusual spending patterns',
            'trending-up'
          )}
          {renderSettingItem(
            'lowBalanceAlerts',
            'Low Balance Alerts',
            'Get notified when account balance is low',
            'alert-circle'
          )}
          {renderSettingItem(
            'unusualSpending',
            'Unusual Spending',
            'Alerts for transactions above normal amounts',
            'eye'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bills & Goals</Text>
          {renderSettingItem(
            'billReminders',
            'Bill Reminders',
            'Get reminded about upcoming bill payments',
            'calendar'
          )}
          {renderSettingItem(
            'goalMilestones',
            'Goal Milestones',
            'Celebrate when you reach savings milestones',
            'flag'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          {renderSettingItem(
            'weeklyReports',
            'Weekly Reports',
            'Receive weekly spending summaries',
            'bar-chart'
          )}
          {renderSettingItem(
            'monthlyReports',
            'Monthly Reports',
            'Get detailed monthly financial reports',
            'pie-chart'
          )}
        </View>

        <View style={styles.section}>
          <Card style={styles.testCard}>
            <View style={styles.testContent}>
              <View style={styles.testLeft}>
                <Ionicons name="notifications" size={24} color={colors.info} />
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>Test Notifications</Text>
                  <Text style={styles.testDescription}>
                    Send a test notification to verify your settings
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Notification Tips</Text>
                <Text style={styles.infoDescription}>
                  • Notifications help you stay on top of your finances{'\n'}
                  • You can change these settings anytime{'\n'}
                  • Some notifications may be delayed due to device power saving
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100, // Space for footer button
  },
  section: {
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['4'],
  },
  sectionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['3'],
    marginTop: spacing['2'],
  },
  warningCard: {
    padding: spacing['4'],
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '30',
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    marginLeft: spacing['3'],
  },
  warningTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['1'],
  },
  warningDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  settingItem: {
    marginBottom: spacing['2'],
    padding: spacing['4'],
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing['0.5'],
  },
  settingDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  testCard: {
    padding: spacing['4'],
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
    borderWidth: 1,
  },
  testContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testInfo: {
    flex: 1,
    marginLeft: spacing['3'],
  },
  testTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  testDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  testButton: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: borderRadius.md,
  },
  testButtonText: {
    ...typography.textStyles.bodyMedium,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  infoCard: {
    padding: spacing['4'],
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
    borderWidth: 1,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: spacing['3'],
  },
  infoTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['1'],
  },
  infoDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing['4'],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing['4'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    ...typography.textStyles.bodyLarge,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default NotificationSettingsScreen;
