import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "./Logger";
import {
  AppData,
  Transaction,
  Category,
  Budget,
  BudgetAlert,
  AlertHistory,
  SmartSuggestion,
  AlertSettings,
} from "../types";

const STORAGE_KEY = "budget_manager_data";

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
      start: "22:00",
      end: "08:00",
    },
    alertFrequency: "immediate",
    smartSuggestions: true,
  },
  settings: {
    currency: "USD",
    theme: "dark",
    notifications: true,
  },
  isSetupComplete: false,
};

class StorageService {
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return await Promise.race<Promise<T>>([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("STORAGE_TIMEOUT")), ms),
      ),
    ]);
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const backoffMs = Math.min(500 * Math.pow(2, attempt), 1500);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
    throw lastError;
  }

  async getData(): Promise<AppData> {
    try {
      const data = await this.withTimeout(
        this.withRetry(() => AsyncStorage.getItem(STORAGE_KEY)),
        3000,
      );
      if (data) {
        const parsedData = JSON.parse(data);
        // Migrate invalid icon names to valid ones
        const migratedData = this.migrateIconNames(parsedData);
        return migratedData;
      }
      return defaultData;
    } catch (error) {
      Logger.error("Error loading data", { error: String(error) });
      return defaultData;
    }
  }

  private migrateIconNames(data: AppData): AppData {
    const iconMigrations: Record<string, string> = {
      "bag-outline": "bag",
      "medical-outline": "medical",
      "shopping-cart": "bag",
      tag: "pricetag",
      "remove-circle": "remove-circle-outline",
      plus: "add-circle",
      minus: "remove-circle-outline",
      "shopping-bag": "bag",
      "medical-bag": "medical",
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
    if (typeof data.isSetupComplete !== "boolean") {
      data.isSetupComplete = false;
    }

    // Migrate category icons
    if (data.categories) {
      data.categories = data.categories.map((category) => ({
        ...category,
        icon: iconMigrations[category.icon] || category.icon,
      }));
    }

    return data;
  }

  async saveData(data: AppData): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      await this.withTimeout(
        this.withRetry(() => AsyncStorage.setItem(STORAGE_KEY, serialized)),
        3000,
      );
    } catch (error) {
      Logger.error("Error saving data", { error: String(error) });
    }
  }

  async addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt">,
  ): Promise<void> {
    const data = await this.getData();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    data.transactions.unshift(newTransaction);
    await this.saveData(data);
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<void> {
    const data = await this.getData();
    const index = data.transactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      data.transactions[index] = { ...data.transactions[index], ...updates };
      await this.saveData(data);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const data = await this.getData();
    data.transactions = data.transactions.filter((t) => t.id !== id);
    await this.saveData(data);
  }

  async addCategory(category: Omit<Category, "id">): Promise<void> {
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
    const index = data.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      data.categories[index] = { ...data.categories[index], ...updates };
      await this.saveData(data);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const data = await this.getData();
    data.categories = data.categories.filter((c) => c.id !== id);
    // Also remove transactions with this category
    data.transactions = data.transactions.filter(
      (t) => t.category !== data.categories.find((c) => c.id === id)?.name,
    );
    await this.saveData(data);
  }

  // Budget management methods
  async addBudget(
    budget: Omit<Budget, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
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
    const index = data.budgets.findIndex((b) => b.id === id);
    if (index !== -1) {
      data.budgets[index] = {
        ...data.budgets[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveData(data);
    }
  }

  async deleteBudget(id: string): Promise<void> {
    const data = await this.getData();
    data.budgets = data.budgets.filter((b) => b.id !== id);
    // Also remove related budget alerts
    data.budgetAlerts = data.budgetAlerts.filter((a) => a.budgetId !== id);
    await this.saveData(data);
  }

  async getBudgets(): Promise<Budget[]> {
    const data = await this.getData();
    return data.budgets || [];
  }

  async getActiveBudgets(): Promise<Budget[]> {
    const data = await this.getData();
    return (data.budgets || []).filter((b) => b.isActive);
  }

  // Budget alert methods
  async addBudgetAlert(
    alert: Omit<BudgetAlert, "id" | "createdAt">,
  ): Promise<void> {
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
    const index = data.budgetAlerts.findIndex((a) => a.id === alertId);
    if (index !== -1) {
      data.budgetAlerts[index].isRead = true;
      await this.saveData(data);
    }
  }

  async getUnreadAlerts(): Promise<BudgetAlert[]> {
    const data = await this.getData();
    return (data.budgetAlerts || []).filter((a) => !a.isRead);
  }

  async clearAllAlerts(): Promise<void> {
    const data = await this.getData();
    data.budgetAlerts = [];
    await this.saveData(data);
  }

  // Alert History methods
  async addAlertHistory(
    history: Omit<AlertHistory, "id" | "createdAt">,
  ): Promise<void> {
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
  async addSmartSuggestion(
    suggestion: Omit<SmartSuggestion, "id" | "createdAt">,
  ): Promise<void> {
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
    data.smartSuggestions = data.smartSuggestions.filter((s) => s.id !== id);
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

  async getSettings(): Promise<AppData["settings"]> {
    const data = await this.getData();
    return data.settings;
  }

  async updateSettings(settings: Partial<AppData["settings"]>): Promise<void> {
    const data = await this.getData();
    data.settings = { ...data.settings, ...settings };
    await this.saveData(data);
  }

  async clearAllData(): Promise<void> {
    await this.saveData(defaultData);
  }

  async clearStorage(): Promise<void> {
    try {
      await this.withTimeout(
        this.withRetry(() => AsyncStorage.removeItem(STORAGE_KEY)),
        3000,
      );
    } catch (error) {
      Logger.error("Error clearing storage", { error: String(error) });
    }
  }

  /**
   * Profile management methods
   */
  async saveProfile(profile: any): Promise<void> {
    try {
      const serialized = JSON.stringify(profile);
      await this.withTimeout(
        this.withRetry(() => AsyncStorage.setItem("user_profile", serialized)),
        3000,
      );
    } catch (error) {
      Logger.error("Error saving profile", { error: String(error) });
      throw error;
    }
  }

  async getProfile(): Promise<any | null> {
    try {
      const profileData = await this.withTimeout(
        this.withRetry(() => AsyncStorage.getItem("user_profile")),
        3000,
      );
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      Logger.error("Error getting profile", { error: String(error) });
      return null;
    }
  }

  async deleteProfile(): Promise<void> {
    try {
      await this.withTimeout(
        this.withRetry(() => AsyncStorage.removeItem("user_profile")),
        3000,
      );
    } catch (error) {
      Logger.error("Error deleting profile", { error: String(error) });
      throw error;
    }
  }

  /**
   * Setup completion methods
   */
  async setSetupComplete(complete: boolean): Promise<void> {
    try {
      const serialized = JSON.stringify(complete);
      await this.withTimeout(
        this.withRetry(() => AsyncStorage.setItem("setup_complete", serialized)),
        3000,
      );
    } catch (error) {
      Logger.error("Error setting setup complete", { error: String(error) });
      throw error;
    }
  }

  async getSetupComplete(): Promise<boolean> {
    try {
      const setupComplete = await this.withTimeout(
        this.withRetry(() => AsyncStorage.getItem("setup_complete")),
        3000,
      );
      return setupComplete ? JSON.parse(setupComplete) : false;
    } catch (error) {
      Logger.error("Error getting setup complete", { error: String(error) });
      return false;
    }
  }
}

export default new StorageService();
