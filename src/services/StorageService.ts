import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Transaction, Category, FinancialAccount } from '../types';

const STORAGE_KEY = 'budget_manager_data';

const defaultData: AppData = {
  transactions: [],
  categories: [],
  accounts: [],
  accountTransactions: [],
  settings: {
    currency: 'USD',
    theme: 'dark',
    notifications: true,
  },
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


  async getSettings(): Promise<AppData['settings']> {
    const data = await this.getData();
    return data.settings;
  }

  async updateSettings(settings: Partial<AppData['settings']>): Promise<void> {
    const data = await this.getData();
    data.settings = { ...data.settings, ...settings };
    await this.saveData(data);
  }

  // Financial Account management methods
  async addAccount(account: FinancialAccount): Promise<void> {
    const data = await this.getData();
    data.accounts.push(account);
    await this.saveData(data);
  }

  async updateAccount(id: string, updates: Partial<FinancialAccount>): Promise<void> {
    const data = await this.getData();
    const accountIndex = data.accounts.findIndex(account => account.id === id);
    if (accountIndex !== -1) {
      data.accounts[accountIndex] = { ...data.accounts[accountIndex], ...updates };
      await this.saveData(data);
    }
  }

  async deleteAccount(id: string): Promise<void> {
    const data = await this.getData();
    data.accounts = data.accounts.filter(account => account.id !== id);
    // Also remove any account transactions
    data.accountTransactions = data.accountTransactions.filter(at => at.accountId !== id);
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
