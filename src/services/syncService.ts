import { store } from '../store/store';
import { StorageService } from './storageService';
import {
  setTransactions,
} from '../store/slices/transactionsSlice';
import { setBudgets as setBudgetsAction } from '../store/slices/budgetsSlice';
import { setCategories as setCategoriesAction } from '../store/slices/categoriesSlice';
import { setUser as setUserAction, logout } from '../store/slices/userSlice';

export class SyncService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load all data from storage
      const [transactions, budgets, categories, user] = await Promise.all([
        StorageService.loadTransactions(),
        StorageService.loadBudgets(),
        StorageService.loadCategories(),
        StorageService.loadUser(),
      ]);

      // Dispatch to store
      store.dispatch(setTransactions(transactions));
      store.dispatch(setBudgetsAction(budgets));
      store.dispatch(setCategoriesAction(categories));
      if (user) {
        store.dispatch(setUserAction(user));
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing sync service:', error);
      // Don't throw error, just log it and continue with empty state
    }
  }

  static async syncTransactions(): Promise<void> {
    try {
      const state = store.getState();
      await StorageService.saveTransactions(state.transactions.transactions);
    } catch (error) {
      console.error('Error syncing transactions:', error);
    }
  }

  static async syncBudgets(): Promise<void> {
    try {
      const state = store.getState();
      await StorageService.saveBudgets(state.budgets.budgets);
    } catch (error) {
      console.error('Error syncing budgets:', error);
    }
  }

  static async syncCategories(): Promise<void> {
    try {
      const state = store.getState();
      await StorageService.saveCategories(state.categories.categories);
    } catch (error) {
      console.error('Error syncing categories:', error);
    }
  }

  static async syncUser(): Promise<void> {
    try {
      const state = store.getState();
      if (state.user.user) {
        await StorageService.saveUser(state.user.user);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  }

  static async syncAll(): Promise<void> {
    try {
      await Promise.all([
        this.syncTransactions(),
        this.syncBudgets(),
        this.syncCategories(),
        this.syncUser(),
      ]);
    } catch (error) {
      console.error('Error syncing all data:', error);
    }
  }

  static async exportData(): Promise<string> {
    try {
      const data = await StorageService.exportData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await StorageService.importData(data);
      
      // Reload data into store
      await this.initialize();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await StorageService.clearAllData();
      
      // Clear store
      store.dispatch(setTransactions([]));
      store.dispatch(setBudgetsAction([]));
      store.dispatch(setCategoriesAction([]));
      store.dispatch(logout());
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  static async resetStorage(): Promise<void> {
    try {
      await StorageService.resetStorage();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error resetting storage:', error);
      throw error;
    }
  }
}
