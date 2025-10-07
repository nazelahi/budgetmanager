import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import NotificationService from '../services/notificationService';
import BiometricAuthService from '../services/biometricAuthService';
import DataImportExportService from '../services/dataImportExportService';

const AdvancedSettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  
  const [notificationSettings, setNotificationSettings] = useState({
    budgetAlerts: true,
    billReminders: true,
    spendingAlerts: true,
    goalMilestones: true,
    weeklyReports: true,
    monthlyReports: true,
  });

  const [biometricSettings, setBiometricSettings] = useState({
    enabled: false,
    requireOnAppOpen: false,
    requireForTransactions: false,
    requireForSensitiveData: true,
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notification settings
      const notificationService = NotificationService.getInstance();
      const notifSettings = notificationService.getSettings();
      setNotificationSettings(notifSettings);

      // Load biometric settings
      const biometricService = BiometricAuthService.getInstance();
      const bioSettings = biometricService.getSettings();
      setBiometricSettings(bioSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationToggle = async (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    };
    
    setNotificationSettings(newSettings);
    
    const notificationService = NotificationService.getInstance();
    notificationService.updateSettings(newSettings);
  };

  const handleBiometricToggle = async (setting: keyof typeof biometricSettings) => {
    if (setting === 'enabled' && !biometricSettings.enabled) {
      // Enable biometric authentication
      const biometricService = BiometricAuthService.getInstance();
      const success = await biometricService.enableBiometricAuth();
      
      if (success) {
        setBiometricSettings({
          ...biometricSettings,
          [setting]: true,
        });
      }
    } else {
      const newSettings = {
        ...biometricSettings,
        [setting]: !biometricSettings[setting],
      };
      
      setBiometricSettings(newSettings);
      
      const biometricService = BiometricAuthService.getInstance();
      await biometricService.updateSettings(newSettings);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const dataService = DataImportExportService.getInstance();
      await dataService.exportAllData();
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
      setShowExportModal(false);
    }
  };

  const handleImportData = async () => {
    setIsLoading(true);
    try {
      const dataService = DataImportExportService.getInstance();
      const result = await dataService.importFromFile();
      
      if (result.success) {
        Alert.alert(
          'Import Successful',
          `Imported ${Object.values(result.importedCounts).reduce((sum, count) => sum + count, 0)} items successfully.`
        );
      } else {
        Alert.alert('Import Failed', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('Import Failed', 'Failed to import data. Please try again.');
    } finally {
      setIsLoading(false);
      setShowImportModal(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            const dataService = DataImportExportService.getInstance();
            await dataService.clearAllData();
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: string,
    color: string = colors.primary
  ) => (
    <Card style={styles.settingItem}>
      <View style={styles.settingContent}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.gray300, true: color + '40' }}
          thumbColor={value ? color : colors.gray500}
        />
      </View>
    </Card>
  );

  const renderActionItem = (
    title: string,
    description: string,
    icon: string,
    color: string,
    onPress: () => void,
    destructive: boolean = false
  ) => (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.settingItem, destructive && styles.destructiveItem]}>
        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
                {title}
              </Text>
              <Text style={styles.settingDescription}>{description}</Text>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={destructive ? colors.error : colors.gray400} 
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Advanced Settings"
        subtitle="Configure app features and preferences"
        variant="gradient"
      />

      <ScrollView style={styles.scrollView}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'Budget Alerts',
            'Get notified when approaching budget limits',
            notificationSettings.budgetAlerts,
            () => handleNotificationToggle('budgetAlerts'),
            'notifications',
            colors.warning
          )}
          {renderSettingItem(
            'Bill Reminders',
            'Receive reminders for upcoming bills',
            notificationSettings.billReminders,
            () => handleNotificationToggle('billReminders'),
            'calendar',
            colors.info
          )}
          {renderSettingItem(
            'Spending Alerts',
            'Alert for unusual spending patterns',
            notificationSettings.spendingAlerts,
            () => handleNotificationToggle('spendingAlerts'),
            'alert-circle',
            colors.error
          )}
          {renderSettingItem(
            'Goal Milestones',
            'Celebrate savings goal achievements',
            notificationSettings.goalMilestones,
            () => handleNotificationToggle('goalMilestones'),
            'flag',
            colors.success
          )}
          {renderSettingItem(
            'Weekly Reports',
            'Receive weekly financial summaries',
            notificationSettings.weeklyReports,
            () => handleNotificationToggle('weeklyReports'),
            'bar-chart',
            colors.primary
          )}
          {renderSettingItem(
            'Monthly Reports',
            'Receive monthly financial summaries',
            notificationSettings.monthlyReports,
            () => handleNotificationToggle('monthlyReports'),
            'trending-up',
            colors.primary
          )}
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderSettingItem(
            'Biometric Authentication',
            'Use fingerprint or Face ID to secure the app',
            biometricSettings.enabled,
            () => handleBiometricToggle('enabled'),
            'finger-print',
            colors.success
          )}
          {biometricSettings.enabled && (
            <>
              {renderSettingItem(
                'Require on App Open',
                'Authenticate every time you open the app',
                biometricSettings.requireOnAppOpen,
                () => handleBiometricToggle('requireOnAppOpen'),
                'lock-closed',
                colors.warning
              )}
              {renderSettingItem(
                'Require for Transactions',
                'Authenticate before adding transactions',
                biometricSettings.requireForTransactions,
                () => handleBiometricToggle('requireForTransactions'),
                'card',
                colors.info
              )}
              {renderSettingItem(
                'Require for Sensitive Data',
                'Authenticate to view sensitive information',
                biometricSettings.requireForSensitiveData,
                () => handleBiometricToggle('requireForSensitiveData'),
                'shield-checkmark',
                colors.error
              )}
            </>
          )}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          {renderActionItem(
            'Export Data',
            'Download your data as JSON or CSV',
            'download',
            colors.primary,
            () => setShowExportModal(true)
          )}
          {renderActionItem(
            'Import Data',
            'Restore data from backup file',
            'cloud-upload',
            colors.info,
            () => setShowImportModal(true)
          )}
          {renderActionItem(
            'Clear All Data',
            'Permanently delete all your data',
            'trash',
            colors.error,
            handleClearAllData,
            true
          )}
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>2024.01.01</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>January 1, 2024</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Export Data"
            rightComponent={
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose how you want to export your data
            </Text>
            
            <Button
              title="Export as JSON"
              onPress={handleExportData}
              gradient="primary"
              style={styles.modalButton}
              loading={isLoading}
            />
            
            <Button
              title="Export as CSV"
              onPress={() => {
                // Handle CSV export
                setShowExportModal(false);
              }}
              variant="outline"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Import Data"
            rightComponent={
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Import data from a backup file
            </Text>
            
            <Text style={styles.modalWarning}>
              ⚠️ This will replace your current data. Make sure to export your current data first.
            </Text>
            
            <Button
              title="Choose File"
              onPress={handleImportData}
              gradient="primary"
              style={styles.modalButton}
              loading={isLoading}
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 80,
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
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  settingText: {
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
  },
  destructiveItem: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  destructiveText: {
    color: colors.error,
  },
  infoCard: {
    padding: spacing['4'],
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  infoLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    padding: spacing['6'],
    justifyContent: 'center',
  },
  modalSubtitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing['6'],
    textAlign: 'center',
  },
  modalWarning: {
    ...typography.textStyles.bodyMedium,
    color: colors.warning,
    marginBottom: spacing['6'],
    textAlign: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing['4'],
    borderRadius: borderRadius.md,
  },
  modalButton: {
    marginBottom: spacing['4'],
  },
});

export default AdvancedSettingsScreen;
