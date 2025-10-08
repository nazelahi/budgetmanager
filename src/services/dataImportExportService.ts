import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExportData {
  transactions: any[];
  budgets: any[];
  categories: any[];
  savingsGoals: any[];
  recurringTransactions: any[];
  accounts: any[];
  user: any;
  exportDate: string;
  version: string;
}

export interface ImportResult {
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

class DataImportExportService {
  private static instance: DataImportExportService;
  private readonly EXPORT_VERSION = '1.0.0';

  private constructor() {}

  public static getInstance(): DataImportExportService {
    if (!DataImportExportService.instance) {
      DataImportExportService.instance = new DataImportExportService();
    }
    return DataImportExportService.instance;
  }

  // Export all data to JSON
  static async exportAllData(): Promise<string | null> {
    const instance = DataImportExportService.getInstance();
    try {
      const data: ExportData = {
        transactions: await instance.getStoredData('transactions'),
        budgets: await instance.getStoredData('budgets'),
        categories: await instance.getStoredData('categories'),
        savingsGoals: await instance.getStoredData('savingsGoals'),
        recurringTransactions: await instance.getStoredData('recurringTransactions'),
        accounts: await instance.getStoredData('accounts'),
        user: await instance.getStoredData('user'),
        exportDate: new Date().toISOString(),
        version: instance.EXPORT_VERSION,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `budget_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      Alert.alert(
        'Export Successful',
        `Data exported to ${fileName}`,
        [{ text: 'OK' }]
      );

      return fileUri;
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'Failed to export data. Please try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Export data to CSV format
  async exportToCSV(dataType: 'transactions' | 'budgets' | 'savingsGoals'): Promise<string | null> {
    try {
      const data = await this.getStoredData(dataType);
      let csvContent = '';

      switch (dataType) {
        case 'transactions':
          csvContent = this.convertTransactionsToCSV(data);
          break;
        case 'budgets':
          csvContent = this.convertBudgetsToCSV(data);
          break;
        case 'savingsGoals':
          csvContent = this.convertSavingsGoalsToCSV(data);
          break;
        default:
          throw new Error('Unsupported data type for CSV export');
      }

      const fileName = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      Alert.alert(
        'CSV Export Successful',
        `${dataType} exported to ${fileName}`,
        [{ text: 'OK' }]
      );

      return fileUri;
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert(
        'CSV Export Failed',
        'Failed to export CSV data. Please try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Import data from JSON file
  async importFromFile(): Promise<ImportResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return {
          success: false,
          importedCounts: {
            transactions: 0,
            budgets: 0,
            categories: 0,
            savingsGoals: 0,
            recurringTransactions: 0,
            accounts: 0,
          },
          errors: ['Import cancelled'],
        };
      }

      const fileUri = result.assets[0].uri;
      const jsonString = await FileSystem.readAsStringAsync(fileUri);
      const importData: ExportData = JSON.parse(jsonString);

      return await this.importData(importData);
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        importedCounts: {
          transactions: 0,
          budgets: 0,
          categories: 0,
          savingsGoals: 0,
          recurringTransactions: 0,
          accounts: 0,
        },
        errors: ['Failed to import file'],
      };
    }
  }

  // Import data from JSON string
  async importData(importData: ExportData): Promise<ImportResult> {
    const errors: string[] = [];
    const importedCounts = {
      transactions: 0,
      budgets: 0,
      categories: 0,
      savingsGoals: 0,
      recurringTransactions: 0,
      accounts: 0,
    };

    try {
      // Validate version compatibility
      if (importData.version !== this.EXPORT_VERSION) {
        errors.push('Version mismatch. Some data may not be compatible.');
      }

      // Import each data type
      if (importData.transactions && Array.isArray(importData.transactions)) {
        await this.setStoredData('transactions', importData.transactions);
        importedCounts.transactions = importData.transactions.length;
      }

      if (importData.budgets && Array.isArray(importData.budgets)) {
        await this.setStoredData('budgets', importData.budgets);
        importedCounts.budgets = importData.budgets.length;
      }

      if (importData.categories && Array.isArray(importData.categories)) {
        await this.setStoredData('categories', importData.categories);
        importedCounts.categories = importData.categories.length;
      }

      if (importData.savingsGoals && Array.isArray(importData.savingsGoals)) {
        await this.setStoredData('savingsGoals', importData.savingsGoals);
        importedCounts.savingsGoals = importData.savingsGoals.length;
      }

      if (importData.recurringTransactions && Array.isArray(importData.recurringTransactions)) {
        await this.setStoredData('recurringTransactions', importData.recurringTransactions);
        importedCounts.recurringTransactions = importData.recurringTransactions.length;
      }

      if (importData.accounts && Array.isArray(importData.accounts)) {
        await this.setStoredData('accounts', importData.accounts);
        importedCounts.accounts = importData.accounts.length;
      }

      if (importData.user) {
        await this.setStoredData('user', importData.user);
      }

      const totalImported = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);

      Alert.alert(
        'Import Successful',
        `Imported ${totalImported} items successfully.`,
        [{ text: 'OK' }]
      );

      return {
        success: true,
        importedCounts,
        errors,
      };
    } catch (error) {
      console.error('Data import error:', error);
      errors.push('Failed to import data');
      return {
        success: false,
        importedCounts,
        errors,
      };
    }
  }

  // Backup data to cloud (placeholder for future implementation)
  async backupToCloud(): Promise<boolean> {
    try {
      // This would integrate with cloud storage services like Firebase, AWS, etc.
      // For now, we'll just export to local file
      const fileUri = await DataImportExportService.exportAllData();
      return fileUri !== null;
    } catch (error) {
      console.error('Cloud backup error:', error);
      return false;
    }
  }

  // Import data from file
  static async importDataFromFile(fileUri: string): Promise<ImportResult> {
    const instance = DataImportExportService.getInstance();
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(fileContent);
      
      // Import each data type
      const importedCounts = {
        transactions: 0,
        budgets: 0,
        categories: 0,
        savingsGoals: 0,
        recurringTransactions: 0,
        accounts: 0,
      };

      if (data.transactions && Array.isArray(data.transactions)) {
        await instance.setStoredData('transactions', data.transactions);
        importedCounts.transactions = data.transactions.length;
      }

      if (data.budgets && Array.isArray(data.budgets)) {
        await instance.setStoredData('budgets', data.budgets);
        importedCounts.budgets = data.budgets.length;
      }

      if (data.categories && Array.isArray(data.categories)) {
        await instance.setStoredData('categories', data.categories);
        importedCounts.categories = data.categories.length;
      }

      if (data.savingsGoals && Array.isArray(data.savingsGoals)) {
        await instance.setStoredData('savingsGoals', data.savingsGoals);
        importedCounts.savingsGoals = data.savingsGoals.length;
      }

      if (data.recurringTransactions && Array.isArray(data.recurringTransactions)) {
        await instance.setStoredData('recurringTransactions', data.recurringTransactions);
        importedCounts.recurringTransactions = data.recurringTransactions.length;
      }

      if (data.accounts && Array.isArray(data.accounts)) {
        await instance.setStoredData('accounts', data.accounts);
        importedCounts.accounts = data.accounts.length;
      }

      return {
        success: true,
        importedCounts,
        errors: [],
      };
    } catch (error) {
      console.error('Error importing data from file:', error);
      return {
        success: false,
        importedCounts: {
          transactions: 0,
          budgets: 0,
          categories: 0,
          savingsGoals: 0,
          recurringTransactions: 0,
          accounts: 0,
        },
        errors: ['Failed to parse file or invalid format'],
      };
    }
  }

  // Restore data from cloud (placeholder for future implementation)
  static async restoreFromCloud(): Promise<ImportResult> {
    try {
      // This would integrate with cloud storage services
      // For now, return empty result
      return {
        success: false,
        importedCounts: {
          transactions: 0,
          budgets: 0,
          categories: 0,
          savingsGoals: 0,
          recurringTransactions: 0,
          accounts: 0,
        },
        errors: ['Cloud restore not implemented yet'],
      };
    } catch (error) {
      console.error('Cloud restore error:', error);
      return {
        success: false,
        importedCounts: {
          transactions: 0,
          budgets: 0,
          categories: 0,
          savingsGoals: 0,
          recurringTransactions: 0,
          accounts: 0,
        },
        errors: ['Failed to restore from cloud'],
      };
    }
  }

  // Private helper methods
  private async getStoredData(key: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting stored data for ${key}:`, error);
      return [];
    }
  }

  private async setStoredData(key: string, data: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting stored data for ${key}:`, error);
      throw error;
    }
  }

  private convertTransactionsToCSV(transactions: any[]): string {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      `"${transaction.description}"`,
      transaction.category,
      transaction.type,
      transaction.amount,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertBudgetsToCSV(budgets: any[]): string {
    const headers = ['Name', 'Category', 'Amount', 'Period', 'Start Date', 'End Date'];
    const rows = budgets.map(budget => [
      `"${budget.name}"`,
      budget.category,
      budget.amount,
      budget.period,
      new Date(budget.startDate).toLocaleDateString(),
      new Date(budget.endDate).toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertSavingsGoalsToCSV(goals: any[]): string {
    const headers = ['Name', 'Category', 'Target Amount', 'Current Amount', 'Priority', 'Created Date'];
    const rows = goals.map(goal => [
      `"${goal.name}"`,
      goal.category,
      goal.targetAmount,
      goal.currentAmount,
      goal.priority,
      new Date(goal.createdAt).toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{
    totalSize: number;
    breakdown: { [key: string]: number };
  }> {
    try {
      const keys = ['transactions', 'budgets', 'categories', 'savingsGoals', 'recurringTransactions', 'accounts', 'user'];
      const breakdown: { [key: string]: number } = {};
      let totalSize = 0;

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        breakdown[key] = size;
        totalSize += size;
      }

      return { totalSize, breakdown };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, breakdown: {} };
    }
  }

  // Clear all data (use with caution)
  async clearAllData(): Promise<boolean> {
    try {
      const keys = ['transactions', 'budgets', 'categories', 'savingsGoals', 'recurringTransactions', 'accounts', 'user'];
      await AsyncStorage.multiRemove(keys);
      
      Alert.alert(
        'Data Cleared',
        'All data has been cleared successfully.',
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert(
        'Clear Failed',
        'Failed to clear data. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
}

export default DataImportExportService;
