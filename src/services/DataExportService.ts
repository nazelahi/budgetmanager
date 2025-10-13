import { AppData, ExportData, ImportResult } from '../types';
import StorageService from './StorageService';
import { ValidationService } from '../utils/validation';

class DataExportService {
  /**
   * Export all data to JSON format
   */
  async exportToJSON(): Promise<ExportData> {
    try {
      const data = await StorageService.getData();
      
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          ...data,
          // Ensure all arrays exist
          budgetAlerts: data.budgetAlerts || [],
        },
        metadata: {
          totalTransactions: data.transactions?.length || 0,
          totalCategories: data.categories?.length || 0,
          totalBudgets: data.budgets?.length || 0,
        }
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting data to JSON:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Export transactions to CSV format
   */
  async exportTransactionsToCSV(): Promise<string> {
    try {
      const data = await StorageService.getData();
      const transactions = data.transactions || [];
      
      let csv = 'Date,Description,Category,Type,Amount,Currency\n';
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const description = this.escapeCSV(transaction.description);
        const category = this.escapeCSV(transaction.category);
        const type = transaction.type;
        const amount = transaction.amount;
        const currency = data.settings?.currency || 'USD';
        
        csv += `${date},"${description}","${category}","${type}",${amount},"${currency}"\n`;
      });
      
      return csv;
    } catch (error) {
      console.error('Error exporting transactions to CSV:', error);
      throw new Error('Failed to export transactions');
    }
  }

  /**
   * Export budgets to CSV format
   */
  async exportBudgetsToCSV(): Promise<string> {
    try {
      const data = await StorageService.getData();
      const budgets = data.budgets || [];
      const categories = data.categories || [];
      
      let csv = 'Category,Amount,Spent,Remaining,Period,Start Date,End Date\n';
      
      budgets.forEach(budget => {
        const category = categories.find(c => c.id === budget.categoryId);
        const categoryName = category?.name || 'Unknown';
        const remaining = budget.amount - budget.spent;
        
        csv += `"${this.escapeCSV(categoryName)}",${budget.amount},${budget.spent},${remaining},"${budget.period}","${budget.startDate}","${budget.endDate}"\n`;
      });
      
      return csv;
    } catch (error) {
      console.error('Error exporting budgets to CSV:', error);
      throw new Error('Failed to export budgets');
    }
  }

  /**
   * Export categories to CSV format
   */
  async exportCategoriesToCSV(): Promise<string> {
    try {
      const data = await StorageService.getData();
      const categories = data.categories || [];
      
      let csv = 'Name,Type,Color,Icon\n';
      
      categories.forEach(category => {
        csv += `"${this.escapeCSV(category.name)}","${category.type}","${category.color}","${category.icon}"\n`;
      });
      
      return csv;
    } catch (error) {
      console.error('Error exporting categories to CSV:', error);
      throw new Error('Failed to export categories');
    }
  }


  /**
   * Generate a comprehensive report in text format
   */
  async generateTextReport(): Promise<string> {
    try {
      const data = await StorageService.getData();
      const now = new Date();
      
      let report = `BUDGET MANAGER EXPORT REPORT\n`;
      report += `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}\n`;
      report += `Version: 1.0.0\n\n`;
      
      // Summary
      report += `SUMMARY\n`;
      report += `-------\n`;
      report += `Total Transactions: ${data.transactions?.length || 0}\n`;
      report += `Total Categories: ${data.categories?.length || 0}\n`;
      report += `Total Budgets: ${data.budgets?.length || 0}\n`;
      report += `Total Alerts: ${data.budgetAlerts?.length || 0}\n`;
      report += `Currency: ${data.settings?.currency || 'USD'}\n\n`;
      
      // Recent transactions
      if (data.transactions && data.transactions.length > 0) {
        report += `RECENT TRANSACTIONS (Last 10)\n`;
        report += `----------------------------\n`;
        const recentTransactions = data.transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        recentTransactions.forEach(transaction => {
          const date = new Date(transaction.date).toLocaleDateString();
          const sign = transaction.type === 'income' ? '+' : '-';
          report += `${date} | ${sign}${this.formatCurrency(transaction.amount, data.settings?.currency)} | ${transaction.description} | ${transaction.category}\n`;
        });
        report += `\n`;
      }
      
      // Budgets
      if (data.budgets && data.budgets.length > 0) {
        report += `BUDGETS\n`;
        report += `--------\n`;
        data.budgets.forEach(budget => {
          const category = data.categories?.find(c => c.id === budget.categoryId);
          const percentage = budget.amount > 0 ? ((budget.spent / budget.amount) * 100).toFixed(1) : '0';
          report += `${category?.name || 'Unknown'}: ${this.formatCurrency(budget.spent, data.settings?.currency)} / ${this.formatCurrency(budget.amount, data.settings?.currency)} (${percentage}%)\n`;
        });
        report += `\n`;
      }
      
      return report;
    } catch (error) {
      console.error('Error generating text report:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Import data from JSON format
   */
  async importFromJSON(jsonData: string): Promise<ImportResult> {
    try {
      const importData: ExportData = JSON.parse(jsonData);
      const result: ImportResult = {
        success: false,
        imported: {
          transactions: 0,
          categories: 0,
          budgets: 0,
        },
        errors: [],
        warnings: [],
      };

      // Validate import data structure
      if (!importData.data || !importData.version) {
        result.errors.push('Invalid import file format');
        return result;
      }

      const currentData = await StorageService.getData();
      const importedData = importData.data;

      // Import categories
      if (importedData.categories && Array.isArray(importedData.categories)) {
        for (const category of importedData.categories) {
          const validation = ValidationService.validateCategory(category);
          if (validation.isValid) {
            // Check if category already exists
            const existingCategory = currentData.categories?.find(c => c.name === category.name && c.type === category.type);
            if (!existingCategory) {
              if (!currentData.categories) currentData.categories = [];
              currentData.categories.push({
                ...category,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              });
              result.imported.categories++;
            } else {
              result.warnings.push(`Category "${category.name}" already exists, skipping`);
            }
          } else {
            result.errors.push(`Invalid category: ${validation.errors.join(', ')}`);
          }
        }
      }

      // Import transactions
      if (importedData.transactions && Array.isArray(importedData.transactions)) {
        for (const transaction of importedData.transactions) {
          const validation = ValidationService.validateTransaction(transaction);
          if (validation.isValid) {
            if (!currentData.transactions) currentData.transactions = [];
            currentData.transactions.push({
              ...transaction,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            });
            result.imported.transactions++;
          } else {
            result.errors.push(`Invalid transaction: ${validation.errors.join(', ')}`);
          }
        }
      }

      // Import budgets
      if (importedData.budgets && Array.isArray(importedData.budgets)) {
        for (const budget of importedData.budgets) {
          const validation = ValidationService.validateBudget(budget);
          if (validation.isValid) {
            if (!currentData.budgets) currentData.budgets = [];
            currentData.budgets.push({
              ...budget,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            });
            result.imported.budgets++;
          } else {
            result.errors.push(`Invalid budget: ${validation.errors.join(', ')}`);
          }
        }
      }


      // Save imported data
      await StorageService.saveData(currentData);
      result.success = true;

      return result;
    } catch (error) {
      console.error('Error importing data from JSON:', error);
      return {
        success: false,
        imported: { transactions: 0, categories: 0, budgets: 0 },
        errors: ['Failed to parse import file'],
        warnings: [],
      };
    }
  }

  /**
   * Escape CSV values
   */
  private escapeCSV(value: string): string {
    return value.replace(/"/g, '""');
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalTransactions: number;
    totalCategories: number;
    totalBudgets: number;
    totalAlerts: number;
    dataSize: string;
  }> {
    try {
      const data = await StorageService.getData();
      const jsonData = await this.exportToJSON();
      const dataSize = new Blob([JSON.stringify(jsonData)]).size;
      
      return {
        totalTransactions: data.transactions?.length || 0,
        totalCategories: data.categories?.length || 0,
        totalBudgets: data.budgets?.length || 0,
        totalAlerts: data.budgetAlerts?.length || 0,
        dataSize: this.formatBytes(dataSize),
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        totalTransactions: 0,
        totalCategories: 0,
        totalBudgets: 0,
        totalAlerts: 0,
        dataSize: '0 B',
      };
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new DataExportService();
