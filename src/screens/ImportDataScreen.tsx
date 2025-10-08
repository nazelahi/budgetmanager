import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import DataImportExportService from '../services/dataImportExportService';

interface ImportResult {
  success: boolean;
  importedCounts: {
    transactions: number;
    budgets: number;
    categories: number;
    savingsGoals: number;
    recurringTransactions: number;
    accounts: number;
  };
  errors: string[];
}

const ImportDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImportFromFile = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        
        // Import the data
        const result_data = await DataImportExportService.importDataFromFile(fileUri);
        setImportResult(result_data);
        
        if (result_data.success) {
          Alert.alert(
            'Import Successful',
            `Successfully imported data from ${fileName}:\n\n` +
            `• Transactions: ${result_data.importedCounts.transactions}\n` +
            `• Budgets: ${result_data.importedCounts.budgets}\n` +
            `• Categories: ${result_data.importedCounts.categories}\n` +
            `• Goals: ${result_data.importedCounts.savingsGoals}\n` +
            `• Recurring Transactions: ${result_data.importedCounts.recurringTransactions}\n` +
            `• Accounts: ${result_data.importedCounts.accounts}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            'Import Failed',
            `Failed to import data from ${fileName}:\n\n${result_data.errors.join('\n')}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'An error occurred while importing data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromCloud = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);

      const result = await DataImportExportService.restoreFromCloud();
      setImportResult(result);
      
      if (result.success) {
        Alert.alert(
          'Cloud Import Successful',
          `Successfully restored data from cloud:\n\n` +
          `• Transactions: ${result.importedCounts.transactions}\n` +
          `• Budgets: ${result.importedCounts.budgets}\n` +
          `• Categories: ${result.importedCounts.categories}\n` +
            `• Goals: ${result.importedCounts.savingsGoals}\n` +
          `• Recurring Transactions: ${result.importedCounts.recurringTransactions}\n` +
          `• Accounts: ${result.importedCounts.accounts}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Cloud Import Failed',
          `Failed to restore data from cloud:\n\n${result.errors.join('\n')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Cloud import error:', error);
      Alert.alert('Cloud Import Error', 'An error occurred while importing from cloud. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const renderImportOption = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isImporting}
      style={[styles.importOption, disabled ? styles.disabledOption : undefined]}
    >
      <Card style={[styles.importCard, disabled ? styles.disabledCard : undefined] as any}>
        <View style={styles.importContent}>
          <View style={styles.importLeft}>
            <View style={[styles.iconContainer, disabled ? styles.disabledIcon : undefined]}>
              <Ionicons 
                name={icon as any} 
                size={24} 
                color={disabled ? colors.gray400 : colors.primary} 
              />
            </View>
            <View style={styles.importInfo}>
              <Text style={[styles.importTitle, disabled && styles.disabledText]}>
                {title}
              </Text>
              <Text style={[styles.importDescription, disabled && styles.disabledText]}>
                {description}
              </Text>
            </View>
          </View>
          <View style={styles.importRight}>
            {isImporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={disabled ? colors.gray400 : colors.gray600} 
              />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Import Data"
        subtitle="Restore your data from backup"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Options</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you want to import your data. This will restore your transactions, budgets, and other financial data.
          </Text>
        </View>

        <View style={styles.importOptions}>
          {renderImportOption(
            'Import from File',
            'Select a CSV or JSON file from your device',
            'document',
            handleImportFromFile
          )}
          
          {renderImportOption(
            'Import from Cloud',
            'Restore from cloud backup (coming soon)',
            'cloud-download',
            handleImportFromCloud,
            true // Disabled for now
          )}
        </View>

        {importResult && (
          <View style={styles.section}>
            <Card style={[
              styles.resultCard,
              importResult.success ? styles.successCard : styles.errorCard
            ] as any}>
              <View style={styles.resultContent}>
                <Ionicons 
                  name={importResult.success ? 'checkmark-circle' : 'alert-circle'} 
                  size={24} 
                  color={importResult.success ? colors.success : colors.error} 
                />
                <View style={styles.resultText}>
                  <Text style={[
                    styles.resultTitle,
                    { color: importResult.success ? colors.success : colors.error }
                  ]}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </Text>
                  <Text style={styles.resultDescription}>
                    {importResult.success 
                      ? `Imported ${Object.values(importResult.importedCounts).reduce((a, b) => a + b, 0)} items successfully.`
                      : `Failed to import data. ${importResult.errors.length} error(s) occurred.`
                    }
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Import Information</Text>
                <Text style={styles.infoDescription}>
                  • Supported formats: CSV, JSON{'\n'}
                  • Data will be merged with existing data{'\n'}
                  • Duplicate entries will be skipped{'\n'}
                  • Make sure to backup your current data before importing
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Ionicons name="warning" size={24} color={colors.warning} />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Important Notice</Text>
                <Text style={styles.warningDescription}>
                  Importing data will add to your existing data. If you want to replace all data, 
                  please clear your data first in the settings.
                </Text>
              </View>
            </View>
          </Card>
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
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['4'],
  },
  sectionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['2'],
  },
  sectionSubtitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  importOptions: {
    paddingHorizontal: spacing['4'],
  },
  importOption: {
    marginBottom: spacing['3'],
  },
  disabledOption: {
    opacity: 0.6,
  },
  importCard: {
    padding: spacing['4'],
  },
  disabledCard: {
    backgroundColor: colors.gray50,
  },
  importContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  importLeft: {
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
  disabledIcon: {
    backgroundColor: colors.gray200,
  },
  importInfo: {
    flex: 1,
  },
  importTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  importDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  importRight: {
    alignItems: 'center',
  },
  disabledText: {
    color: colors.gray400,
  },
  resultCard: {
    padding: spacing['4'],
    marginBottom: spacing['2'],
  },
  successCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
    borderWidth: 1,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultText: {
    flex: 1,
    marginLeft: spacing['3'],
  },
  resultTitle: {
    ...typography.textStyles.bodyLarge,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  resultDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
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
});

export default ImportDataScreen;
