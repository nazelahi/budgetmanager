import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { View, Text, ActivityIndicator } from "react-native";
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  avatarType: "icon" | "image";
  bio: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}
import StorageService from "../services/StorageService";
import DataExportService from "../services/DataExportService";
import BudgetService from "../services/BudgetService";
import { ValidationService, ErrorHandler } from "../utils/validation";
import ToastService from "../services/ToastService";
import Logger from "../services/Logger";

interface AppContextType {
  data: AppData;
  loading: boolean;
  refreshData: () => Promise<void>;

  // Setup management
  isSetupComplete: boolean;
  completeSetup: () => Promise<void>;

  // Profile management
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Account settings management
  accountSettings: {
    notifications: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    currency: string;
    language: string;
    privacyMode: boolean;
  };
  updateAccountSettings: (
    settings: Partial<{
      notifications: boolean;
      biometricAuth: boolean;
      darkMode: boolean;
      currency: string;
      language: string;
      privacyMode: boolean;
    }>,
  ) => Promise<void>;

  // Account actions
  exportAccountData: () => Promise<any>;
  deleteAccount: () => Promise<void>;

  // Transaction management
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Category management
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Budget management
  addBudget: (
    budget: Omit<Budget, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgets: () => Promise<Budget[]>;
  getActiveBudgets: () => Promise<Budget[]>;

  // Budget alerts
  addBudgetAlert: (
    alert: Omit<BudgetAlert, "id" | "createdAt">,
  ) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  getUnreadAlerts: () => Promise<BudgetAlert[]>;
  clearAllAlerts: () => Promise<void>;

  // Alert history
  getAlertHistory: (days?: number) => Promise<AlertHistory[]>;
  clearAlertHistory: () => Promise<void>;

  // Smart suggestions
  getSmartSuggestions: () => Promise<SmartSuggestion[]>;
  deleteSmartSuggestion: (id: string) => Promise<void>;
  clearSmartSuggestions: () => Promise<void>;

  // Alert settings
  getAlertSettings: () => Promise<AlertSettings>;
  updateAlertSettings: (settings: Partial<AlertSettings>) => Promise<void>;

  // Data export/import
  exportToJSON: () => Promise<string>;
  exportToCSV: (type: "transactions" | "categories") => Promise<string>;
  importFromJSON: (jsonData: string) => Promise<{
    success: boolean;
    imported: any;
    errors: string[];
    warnings: string[];
  }>;

  // Settings
  updateSettings: (settings: Partial<AppData["settings"]>) => Promise<void>;

  // Modal states
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showMoreModal: boolean;
  setShowMoreModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [accountSettings, setAccountSettings] = useState({
    notifications: true,
    biometricAuth: false,
    darkMode: true,
    currency: "USD",
    language: "en",
    privacyMode: false,
  });

  const refreshData = async () => {
    try {
      setLoading(true);
      const appData = await StorageService.getData();
      if (appData && typeof appData === "object") {
        setData(appData);
        Logger.info("Data refreshed", { transactions: appData.transactions?.length, categories: appData.categories?.length });

        // Check for budget alerts after refreshing data
        try {
          await BudgetService.checkBudgetAlerts();
        } catch (error) {
          Logger.error("Budget alerts check failed after refresh", { error: String(error) });
        }
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      Logger.error("Error refreshing data", { error: String(error) });
      // Set empty data if there's an error
      setData({
        transactions: [],
        categories: [],
        settings: {
          currency: "USD",
          theme: "dark",
          notifications: true,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await StorageService.getProfile();
      if (profileData) {
        // Ensure avatarType exists for backward compatibility
        const profileWithType = {
          ...profileData,
          avatarType: profileData.avatarType || "icon",
        };
        setProfile(profileWithType);
      } else {
        setProfile(null);
      }
    } catch (error) {
      Logger.error("Error loading profile", { error: String(error) });
      setProfile(null);
    }
  };

  const updateProfile = async (profileUpdates: Partial<UserProfile>) => {
    try {
      const updatedProfile = {
        ...profile,
        ...profileUpdates,
        id: profile?.id || Date.now().toString(),
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveProfile(updatedProfile as UserProfile);
      setProfile(updatedProfile as UserProfile);
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "updateProfile"),
        "STORAGE_ERROR",
      );
    }
  };

  const updateAccountSettings = async (
    settingsUpdates: Partial<typeof accountSettings>,
  ) => {
    try {
      const updatedSettings = {
        ...accountSettings,
        ...settingsUpdates,
      };

      await StorageService.updateSettings(updatedSettings);
      setAccountSettings(updatedSettings);
      // Update Logger privacy mode when settings change
      Logger.setPrivacyMode(Boolean(updatedSettings.privacyMode));
      ToastService.success(
        "Settings Updated",
        "Your account settings have been saved.",
      );
    } catch (error) {
      ToastService.error("Error", "Failed to update account settings.");
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "updateAccountSettings"),
        "STORAGE_ERROR",
      );
    }
  };

  const exportAccountData = async () => {
    try {
      return await DataExportService.exportToJSON();
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "exportAccountData"),
        "EXPORT_ERROR",
      );
    }
  };

  const deleteAccount = async () => {
    try {
      await StorageService.clearAllData();
      setData({
        transactions: [],
        categories: [],
        settings: {
          currency: "USD",
          theme: "dark",
          notifications: true,
        },
      });
      setProfile(null);
      setAccountSettings({
        notifications: true,
        biometricAuth: false,
        darkMode: true,
        currency: "USD",
        language: "en",
        privacyMode: false,
      });
      setIsSetupComplete(false);
      ToastService.success(
        "Account Reset",
        "All data cleared. Setup restarted.",
      );
    } catch (error) {
      ToastService.error("Error", "Failed to delete account data.");
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "deleteAccount"),
        "STORAGE_ERROR",
      );
    }
  };

  const completeSetup = async () => {
    try {
      await StorageService.setSetupComplete(true);
      setIsSetupComplete(true);

      // Also update the data object to reflect setup completion
      if (data) {
        const updatedData = { ...data, isSetupComplete: true };
        setData(updatedData);
        await StorageService.saveData(updatedData);
      }
    } catch (error) {
      Logger.error("Setup completion error", { error: String(error) });
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "completeSetup"),
        "STORAGE_ERROR",
      );
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await refreshData();
      await refreshProfile();

      // Load account settings
      try {
        const settings = await StorageService.getSettings();
        if (settings) {
          setAccountSettings((prev) => ({
            ...prev,
            ...settings,
          }));
          Logger.setPrivacyMode(Boolean(settings.privacyMode));
        }
      } catch (error) {
        Logger.warn("Error loading account settings", { error: String(error) });
      }

      // Check if setup is complete
      try {
        const setupComplete = await StorageService.getSetupComplete();
        const dataSetupComplete = data?.isSetupComplete || false;
        setIsSetupComplete(setupComplete || dataSetupComplete);
      } catch (error) {
        Logger.warn("Error checking setup status", { error: String(error) });
        setIsSetupComplete(false);
      }
    };

    initializeApp();
  }, []);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => {
    try {
      // Validate transaction data
      const validation = ValidationService.validateTransaction(transaction);
      if (!validation.isValid) {
        throw ErrorHandler.createError(
          validation.errors.join(", "),
          "VALIDATION_ERROR",
        );
      }

      // Optimistic insert
      const tempId = `temp-${Date.now()}`;
      const optimistic: Transaction = {
        ...(transaction as any),
        id: tempId,
        createdAt: new Date().toISOString(),
      };

      const previousData = data;
      if (previousData) {
        setData({
          ...previousData,
          transactions: [optimistic, ...previousData.transactions],
        });
      }

      try {
        await StorageService.addTransaction(transaction);
        // Refresh to sync real id from storage
        await refreshData();
        ToastService.success(
          "Transaction Added",
          "Your transaction was saved.",
        );
        if (transaction.type === "expense") {
          try {
            await BudgetService.checkBudgetAlerts();
        } catch (error) {
          Logger.error("Budget alerts check failed after add", { error: String(error) });
          }
        }
      } catch (persistError) {
        // Rollback optimistic insert
        if (previousData) {
          setData(previousData);
        }
        ToastService.error("Error", "Failed to add transaction.");
        throw persistError;
      }
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "addTransaction"),
        "STORAGE_ERROR",
      );
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>,
  ) => {
    await StorageService.updateTransaction(id, updates);
    await refreshData();
    ToastService.success("Transaction Updated", "Changes have been saved.");

    // Check for budget alerts after updating transaction
    if (
      updates.type === "expense" ||
      (updates.amount !== undefined && updates.type !== "income")
    ) {
      try {
        await BudgetService.checkBudgetAlerts();
      } catch (error) {
        console.error("Error checking budget alerts:", error);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    await StorageService.deleteTransaction(id);
    await refreshData();
    ToastService.success("Transaction Deleted", "The transaction was removed.");

    // Check for budget alerts after deleting transaction
    try {
      await BudgetService.checkBudgetAlerts();
    } catch (error) {
      Logger.error("Budget alerts check failed after delete", { error: String(error) });
    }
  };

  const addCategory = async (category: Omit<Category, "id">) => {
    await StorageService.addCategory(category);
    await refreshData();
    ToastService.success("Category Added", "Your category was created.");
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await StorageService.updateCategory(id, updates);
    await refreshData();
    ToastService.success("Category Updated", "Changes have been saved.");
  };

  const deleteCategory = async (id: string) => {
    await StorageService.deleteCategory(id);
    await refreshData();
    ToastService.success("Category Deleted", "The category was removed.");
  };

  // Budget management functions
  const addBudget = async (
    budget: Omit<Budget, "id" | "createdAt" | "updatedAt">,
  ) => {
    await StorageService.addBudget(budget);
    await refreshData();
    ToastService.success("Budget Added", "Your budget was created.");

    // Check for budget alerts after adding budget
    try {
      await BudgetService.checkBudgetAlerts();
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    await StorageService.updateBudget(id, updates);
    await refreshData();
    ToastService.success("Budget Updated", "Changes have been saved.");

    // Check for budget alerts after updating budget
    try {
      await BudgetService.checkBudgetAlerts();
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  };

  const deleteBudget = async (id: string) => {
    await StorageService.deleteBudget(id);
    await refreshData();
    ToastService.success("Budget Deleted", "The budget was removed.");

    // Check for budget alerts after deleting budget
    try {
      await BudgetService.checkBudgetAlerts();
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  };

  const getBudgets = async () => {
    return await StorageService.getBudgets();
  };

  const getActiveBudgets = async () => {
    return await StorageService.getActiveBudgets();
  };

  // Budget alert functions
  const addBudgetAlert = async (
    alert: Omit<BudgetAlert, "id" | "createdAt">,
  ) => {
    await StorageService.addBudgetAlert(alert);
    await refreshData();
  };

  const markAlertAsRead = async (alertId: string) => {
    await StorageService.markAlertAsRead(alertId);
    await refreshData();
  };

  const getUnreadAlerts = async () => {
    return await StorageService.getUnreadAlerts();
  };

  const clearAllAlerts = async () => {
    await StorageService.clearAllAlerts();
    await refreshData();
    ToastService.success(
      "Alerts Cleared",
      "All alerts were marked as cleared.",
    );
  };

  // Alert history functions
  const getAlertHistory = async (days: number = 30) => {
    return await StorageService.getAlertHistory();
  };

  const clearAlertHistory = async () => {
    await StorageService.clearAlertHistory();
    await refreshData();
    ToastService.success("History Cleared", "Alert history has been cleared.");
  };

  // Smart suggestions functions
  const getSmartSuggestions = async () => {
    return await StorageService.getSmartSuggestions();
  };

  const deleteSmartSuggestion = async (id: string) => {
    await StorageService.deleteSmartSuggestion(id);
    await refreshData();
  };

  const clearSmartSuggestions = async () => {
    await StorageService.clearSmartSuggestions();
    await refreshData();
  };

  // Alert settings functions
  const getAlertSettings = async () => {
    return await StorageService.getAlertSettings();
  };

  const updateAlertSettings = async (settings: Partial<AlertSettings>) => {
    await StorageService.updateAlertSettings(settings);
    await refreshData();
    ToastService.success(
      "Alert Settings Updated",
      "Your alert preferences have been saved.",
    );
  };

  const updateSettings = async (settings: Partial<AppData["settings"]>) => {
    try {
      await StorageService.updateSettings(settings);
      await refreshData();
      ToastService.success(
        "Settings Updated",
        "Your app settings have been saved.",
      );
    } catch (error) {
      ToastService.error("Error", "Failed to update settings.");
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "updateSettings"),
        "STORAGE_ERROR",
      );
    }
  };

  // Export/Import methods
  const exportToJSON = async () => {
    try {
      const exportData = await DataExportService.exportToJSON();
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "exportToJSON"),
        "STORAGE_ERROR",
      );
    }
  };

  const exportToCSV = async (type: "transactions" | "categories") => {
    try {
      switch (type) {
        case "transactions":
          return await DataExportService.exportTransactionsToCSV();
        case "categories":
          return await DataExportService.exportCategoriesToCSV();
        default:
          throw new Error("Invalid export type");
      }
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "exportToCSV"),
        "STORAGE_ERROR",
      );
    }
  };

  const importFromJSON = async (jsonData: string) => {
    try {
      return await DataExportService.importFromJSON(jsonData);
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.handleError(error, "importFromJSON"),
        "STORAGE_ERROR",
      );
    }
  };

  if (loading || !data) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 16, color: "#6B7280" }}>Loading...</Text>
      </View>
    );
  }

  const value: AppContextType = {
    data,
    loading,
    refreshData,

    // Setup management
    isSetupComplete,
    completeSetup,

    // Profile management
    profile,
    refreshProfile,
    updateProfile,

    // Account settings management
    accountSettings,
    updateAccountSettings,

    // Account actions
    exportAccountData,
    deleteAccount,

    // Transaction management
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Category management
    addCategory,
    updateCategory,
    deleteCategory,

    // Budget management
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgets,
    getActiveBudgets,

    // Budget alerts
    addBudgetAlert,
    markAlertAsRead,
    getUnreadAlerts,
    clearAllAlerts,

    // Alert history
    getAlertHistory,
    clearAlertHistory,

    // Smart suggestions
    getSmartSuggestions,
    deleteSmartSuggestion,
    clearSmartSuggestions,

    // Alert settings
    getAlertSettings,
    updateAlertSettings,

    // Data export/import
    exportToJSON,
    exportToCSV,
    importFromJSON,

    // Settings
    updateSettings,

    // Modal state
    showAddModal,
    setShowAddModal,
    showMoreModal,
    setShowMoreModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
