import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Transaction, Category, Budget, BudgetAlert, AlertHistory, SmartSuggestion, AlertSettings } from '../types';

const STORAGE_KEY = 'budget_manager_data';

const defaultData: AppData = {
  transactions: [],
  categories: [],
  budgets: [],
  budgetAlerts: [],
  alertHistory: [],
  smartSuggestions: [],
  alertSettings: {
    warningThresholds: [70, 80, 90],
    enablePushNotifications: true,
    enableEmailNotifications: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    alertFrequency: 'immediate',
    smartSuggestions: true,
  },
  settings: {
    currency: 'USD',
    theme: 'dark',
    notifications: true,
  },
  isSetupComplete: false,
};

class StorageService {
  async getData(): Promise<AppData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        // Migrate invalid icon names to valid ones
        const migratedData = this.migrateIconNames(parsedData);
        return migratedData;
      }
      return defaultData;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultData;
    }
  }

  private migrateIconNames(data: AppData): AppData {
    const iconMigrations: Record<string, string> = {
      'bag-outline': 'bag',
      'medical-outline': 'medical',
      'shopping-cart': 'bag',
      'tag': 'pricetag',
      'remove-circle': 'remove-circle-outline',
      'plus': 'add-circle',
      'minus': 'remove-circle-outline',
      'shopping-bag': 'bag',
      'medical-bag': 'medical',
    };

    // Ensure all required arrays exist
    if (!data.budgets) {
      data.budgets = [];
    }
    if (!data.budgetAlerts) {
      data.budgetAlerts = [];
    }
    if (!data.alertHistory) {
      data.alertHistory = [];
    }
    if (!data.smartSuggestions) {
      data.smartSuggestions = [];
    }
    if (!data.alertSettings) {
      data.alertSettings = defaultData.alertSettings;
    }
    if (typeof data.isSetupComplete !== 'boolean') {
      data.isSetupComplete = false;
    }

    // Migrate category icons
    if (data.categories) {
      data.categories = data.categories.map(category => ({
        ...category,
        icon: iconMigrations[category.icon] || category.icon
      }));
    }

    return data;
  }

  async saveData(data: AppData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<void> {
    const data = await this.getData();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    data.transactions.unshift(newTransaction);
    await this.saveData(data);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const data = await this.getData();
    const index = data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      data.transactions[index] = { ...data.transactions[index], ...updates };
      await this.saveData(data);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const data = await this.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    await this.saveData(data);
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<void> {
    const data = await this.getData();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    data.categories.push(newCategory);
    await this.saveData(data);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const data = await this.getData();
    const index = data.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      data.categories[index] = { ...data.categories[index], ...updates };
      await this.saveData(data);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const data = await this.getData();
    data.categories = data.categories.filter(c => c.id !== id);
    // Also remove transactions with this category
    data.transactions = data.transactions.filter(t => t.category !== data.categories.find(c => c.id === id)?.name);
    await this.saveData(data);
  }

  // Budget management methods
  async addBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const data = await this.getData();
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.budgets.push(newBudget);
    await this.saveData(data);
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    const data = await this.getData();
    const index = data.budgets.findIndex(b => b.id === id);
    if (index !== -1) {
      data.budgets[index] = { 
        ...data.budgets[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await this.saveData(data);
    }
  }

  async deleteBudget(id: string): Promise<void> {
    const data = await this.getData();
    data.budgets = data.budgets.filter(b => b.id !== id);
    // Also remove related budget alerts
    data.budgetAlerts = data.budgetAlerts.filter(a => a.budgetId !== id);
    await this.saveData(data);
  }

  async getBudgets(): Promise<Budget[]> {
    const data = await this.getData();
    return data.budgets || [];
  }

  async getActiveBudgets(): Promise<Budget[]> {
    const data = await this.getData();
    return (data.budgets || []).filter(b => b.isActive);
  }

  // Budget alert methods
  async addBudgetAlert(alert: Omit<BudgetAlert, 'id' | 'createdAt'>): Promise<void> {
    const data = await this.getData();
    const newAlert: BudgetAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    data.budgetAlerts.push(newAlert);
    await this.saveData(data);
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    const data = await this.getData();
    const index = data.budgetAlerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      data.budgetAlerts[index].isRead = true;
      await this.saveData(data);
    }
  }

  async getUnreadAlerts(): Promise<BudgetAlert[]> {
    const data = await this.getData();
    return (data.budgetAlerts || []).filter(a => !a.isRead);
  }

  async clearAllAlerts(): Promise<void> {
    const data = await this.getData();
    data.budgetAlerts = [];
    await this.saveData(data);
  }

  // Alert History methods
  async addAlertHistory(history: Omit<AlertHistory, 'id' | 'createdAt'>): Promise<void> {
    const data = await this.getData();
    const newHistory: AlertHistory = {
      ...history,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    data.alertHistory.unshift(newHistory); // Add to beginning for chronological order
    await this.saveData(data);
  }

  async getAlertHistory(): Promise<AlertHistory[]> {
    const data = await this.getData();
    return data.alertHistory || [];
  }

  async clearAlertHistory(): Promise<void> {
    const data = await this.getData();
    data.alertHistory = [];
    await this.saveData(data);
  }

  // Smart Suggestions methods
  async addSmartSuggestion(suggestion: Omit<SmartSuggestion, 'id' | 'createdAt'>): Promise<void> {
    const data = await this.getData();
    const newSuggestion: SmartSuggestion = {
      ...suggestion,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    data.smartSuggestions.unshift(newSuggestion);
    await this.saveData(data);
  }

  async getSmartSuggestions(): Promise<SmartSuggestion[]> {
    const data = await this.getData();
    return data.smartSuggestions || [];
  }

  async deleteSmartSuggestion(id: string): Promise<void> {
    const data = await this.getData();
    data.smartSuggestions = data.smartSuggestions.filter(s => s.id !== id);
    await this.saveData(data);
  }

  async clearSmartSuggestions(): Promise<void> {
    const data = await this.getData();
    data.smartSuggestions = [];
    await this.saveData(data);
  }

  // Alert Settings methods
  async updateAlertSettings(settings: Partial<AlertSettings>): Promise<void> {
    const data = await this.getData();
    data.alertSettings = { ...data.alertSettings, ...settings };
    await this.saveData(data);
  }

  async getAlertSettings(): Promise<AlertSettings> {
    const data = await this.getData();
    return data.alertSettings || defaultData.alertSettings;
  }

  async getSettings(): Promise<AppData['settings']> {
    const data = await this.getData();
    return data.settings;
  }

  async updateSettings(settings: Partial<AppData['settings']>): Promise<void> {
    const data = await this.getData();
    data.settings = { ...data.settings, ...settings };
    await this.saveData(data);
  }

  async clearAllData(): Promise<void> {
    await this.saveData(defaultData);
  }

  async clearStorage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Profile management methods
   */
  async saveProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  async getProfile(): Promise<any | null> {
    try {
      const profileData = await AsyncStorage.getItem('user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async deleteProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_profile');
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Setup completion methods
   */
  async setSetupComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('setup_complete', JSON.stringify(complete));
    } catch (error) {
      console.error('Error setting setup complete:', error);
      throw error;
    }
  }

  async getSetupComplete(): Promise<boolean> {
    try {
      const setupComplete = await AsyncStorage.getItem('setup_complete');
      return setupComplete ? JSON.parse(setupComplete) : false;
    } catch (error) {
      console.error('Error getting setup complete:', error);
      return false;
    }
  }
}

export default new StorageService();
