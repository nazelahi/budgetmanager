import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../store/slices/transactionsSlice';
import { Budget } from '../store/slices/budgetsSlice';
import { Category } from '../store/slices/categoriesSlice';
import { User } from '../store/slices/userSlice';

const STORAGE_KEYS = {
  TRANSACTIONS: 'budget_manager_transactions',
  BUDGETS: 'budget_manager_budgets',
  CATEGORIES: 'budget_manager_categories',
  USER: 'budget_manager_user',
};

// In-memory fallback storage
let memoryStorage: Record<string, string> = {};

// Helper function to safely handle AsyncStorage operations
const safeAsyncStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // Suppress the warning for known iOS simulator issues
      if (error instanceof Error && error.message.includes('Failed to create storage directory')) {
        console.log(`Using memory storage for ${key} (iOS simulator storage issue)`);
      } else {
        console.warn(`AsyncStorage setItem failed for ${key}, using memory fallback:`, error);
      }
      memoryStorage[key] = value;
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // Suppress the warning for known iOS simulator issues
      if (error instanceof Error && error.message.includes('Failed to create storage directory')) {
        console.log(`Using memory storage for ${key} (iOS simulator storage issue)`);
      } else {
        console.warn(`AsyncStorage getItem failed for ${key}, using memory fallback:`, error);
      }
      return memoryStorage[key] || null;
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Suppress the warning for known iOS simulator issues
      if (error instanceof Error && error.message.includes('Failed to create storage directory')) {
        console.log(`Using memory storage for ${key} (iOS simulator storage issue)`);
      } else {
        console.warn(`AsyncStorage removeItem failed for ${key}, using memory fallback:`, error);
      }
      delete memoryStorage[key];
    }
  },
  
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      // Suppress the warning for known iOS simulator issues
      if (error instanceof Error && error.message.includes('Failed to create storage directory')) {
        console.log(`Using memory storage (iOS simulator storage issue)`);
      } else {
        console.warn(`AsyncStorage multiRemove failed, using memory fallback:`, error);
      }
      keys.forEach(key => delete memoryStorage[key]);
    }
  }
};

export class StorageService {
  // Transactions
  static async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await safeAsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }

  static async loadTransactions(): Promise<Transaction[]> {
    try {
      const data = await safeAsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  // Budgets
  static async saveBudgets(budgets: Budget[]): Promise<void> {
    try {
      await safeAsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (error) {
      console.error('Error saving budgets:', error);
      throw error;
    }
  }

  static async loadBudgets(): Promise<Budget[]> {
    try {
      const data = await safeAsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading budgets:', error);
      return [];
    }
  }

  // Categories
  static async saveCategories(categories: Category[]): Promise<void> {
    try {
      await safeAsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  static async loadCategories(): Promise<Category[]> {
    try {
      const data = await safeAsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  // User
  static async saveUser(user: User): Promise<void> {
    try {
      await safeAsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async loadUser(): Promise<User | null> {
    try {
      const data = await safeAsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await safeAsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.BUDGETS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.USER,
      ]);
      // Also clear memory storage
      memoryStorage = {};
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Reset storage (useful for fixing storage issues)
  static async resetStorage(): Promise<void> {
    try {
      // Clear memory storage
      memoryStorage = {};
      
      // Try to clear AsyncStorage
      await AsyncStorage.clear();
      console.log('Storage reset successfully');
    } catch (error) {
      console.warn('Error resetting AsyncStorage, but continuing with memory storage:', error);
    }
  }

  // Check storage health and provide debugging info
  static async checkStorageHealth(): Promise<{
    isAsyncStorageWorking: boolean;
    memoryStorageKeys: string[];
    errorMessage?: string;
  }> {
    try {
      // Test AsyncStorage by trying to set and get a test value
      const testKey = 'storage_health_test';
      const testValue = 'test_value';
      
      await AsyncStorage.setItem(testKey, testValue);
      const retrievedValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      const isWorking = retrievedValue === testValue;
      
      return {
        isAsyncStorageWorking: isWorking,
        memoryStorageKeys: Object.keys(memoryStorage),
        errorMessage: isWorking ? undefined : 'AsyncStorage test failed'
      };
    } catch (error) {
      return {
        isAsyncStorageWorking: false,
        memoryStorageKeys: Object.keys(memoryStorage),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Export data
  static async exportData(): Promise<{
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
    user: User | null;
    exportDate: string;
  }> {
    try {
      const [transactions, budgets, categories, user] = await Promise.all([
        this.loadTransactions(),
        this.loadBudgets(),
        this.loadCategories(),
        this.loadUser(),
      ]);

      return {
        transactions,
        budgets,
        categories,
        user,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data
  static async importData(data: {
    transactions?: Transaction[];
    budgets?: Budget[];
    categories?: Category[];
    user?: User;
  }): Promise<void> {
    try {
      const promises = [];

      if (data.transactions) {
        promises.push(this.saveTransactions(data.transactions));
      }
      if (data.budgets) {
        promises.push(this.saveBudgets(data.budgets));
      }
      if (data.categories) {
        promises.push(this.saveCategories(data.categories));
      }
      if (data.user) {
        promises.push(this.saveUser(data.user));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}
