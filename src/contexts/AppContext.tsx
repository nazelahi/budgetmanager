import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppData, Transaction, Category, Budget, BudgetAlert } from '../types';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  avatarType: 'icon' | 'image';
  bio: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}
import StorageService from '../services/StorageService';
import BudgetService from '../services/BudgetService';
import AlertService from '../services/AlertService';
import DataExportService from '../services/DataExportService';
import { ValidationService, ErrorHandler } from '../utils/validation';

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
  
  // Transaction management
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Category management
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Budget management
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Alert management
  getAlerts: () => Promise<BudgetAlert[]>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  markAllAlertsAsRead: () => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  checkBudgetAlerts: () => Promise<BudgetAlert[]>;
  
  // Data export/import
  exportToJSON: () => Promise<string>;
  exportToCSV: (type: 'transactions' | 'budgets' | 'categories') => Promise<string>;
  importFromJSON: (jsonData: string) => Promise<{ success: boolean; imported: any; errors: string[]; warnings: string[] }>;
  
  // Settings
  updateSettings: (settings: Partial<AppData['settings']>) => Promise<void>;
  
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
    throw new Error('useApp must be used within an AppProvider');
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

  const refreshData = async () => {
    try {
      setLoading(true);
      const appData = await StorageService.getData();
      if (appData && typeof appData === 'object') {
        setData(appData);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Set empty data if there's an error
      setData({
        transactions: [],
        categories: [],
        budgets: [],
        budgetAlerts: [],
        settings: {
          currency: 'USD',
          theme: 'dark',
          notifications: true,
          alertThresholds: {
            warning: 80,
            critical: 95,
          },
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
          avatarType: profileData.avatarType || 'icon',
        };
        setProfile(profileWithType);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'updateProfile'), 'STORAGE_ERROR');
    }
  };

  const completeSetup = async () => {
    try {
      await StorageService.setSetupComplete(true);
      setIsSetupComplete(true);
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'completeSetup'), 'STORAGE_ERROR');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await refreshData();
      await refreshProfile();
      
      // Check if setup is complete
      try {
        const setupComplete = await StorageService.getSetupComplete();
        setIsSetupComplete(setupComplete);
      } catch (error) {
        console.warn('Error checking setup status:', error);
        setIsSetupComplete(false);
      }
      
      // Check for budget alerts on app startup
      try {
        await AlertService.checkBudgetAlerts();
      } catch (alertError) {
        console.warn('Initial alert checking failed:', alertError);
      }
    };
    
    initializeApp();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      // Validate transaction data
      const validation = ValidationService.validateTransaction(transaction);
      if (!validation.isValid) {
        throw ErrorHandler.createError(validation.errors.join(', '), 'VALIDATION_ERROR');
      }

      await StorageService.addTransaction(transaction);
      // Update budget spent amounts after adding transaction
      await BudgetService.updateAllBudgetsSpentAmounts();
      // Check for new alerts
      await AlertService.checkBudgetAlerts();
      await refreshData();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'addTransaction'), 'STORAGE_ERROR');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await StorageService.updateTransaction(id, updates);
    // Update budget spent amounts after updating transaction
    await BudgetService.updateAllBudgetsSpentAmounts();
    
    // Check for budget alerts after updating transaction
    try {
      await AlertService.checkBudgetAlerts();
    } catch (alertError) {
      console.warn('Alert checking failed:', alertError);
    }
    
    await refreshData();
  };

  const deleteTransaction = async (id: string) => {
    await StorageService.deleteTransaction(id);
    // Update budget spent amounts after deleting transaction
    await BudgetService.updateAllBudgetsSpentAmounts();
    
    // Check for budget alerts after deleting transaction
    try {
      await AlertService.checkBudgetAlerts();
    } catch (alertError) {
      console.warn('Alert checking failed:', alertError);
    }
    
    await refreshData();
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    await StorageService.addCategory(category);
    await refreshData();
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await StorageService.updateCategory(id, updates);
    await refreshData();
  };

  const deleteCategory = async (id: string) => {
    await StorageService.deleteCategory(id);
    await refreshData();
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    await StorageService.addBudget(budget);
    
    // Check for budget alerts after adding budget
    try {
      await AlertService.checkBudgetAlerts();
    } catch (alertError) {
      console.warn('Alert checking failed:', alertError);
    }
    
    await refreshData();
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    await StorageService.updateBudget(id, updates);
    
    // Check for budget alerts after updating budget
    try {
      await AlertService.checkBudgetAlerts();
    } catch (alertError) {
      console.warn('Alert checking failed:', alertError);
    }
    
    await refreshData();
  };

  const deleteBudget = async (id: string) => {
    await StorageService.deleteBudget(id);
    await refreshData();
  };

  const updateSettings = async (settings: Partial<AppData['settings']>) => {
    try {
      await StorageService.updateSettings(settings);
      await refreshData();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'updateSettings'), 'STORAGE_ERROR');
    }
  };


  // Alert methods
  const getAlerts = async () => {
    try {
      return await AlertService.getAllAlerts();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'getAlerts'), 'STORAGE_ERROR');
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await AlertService.markAlertAsRead(alertId);
      await refreshData();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'markAlertAsRead'), 'STORAGE_ERROR');
    }
  };

  const markAllAlertsAsRead = async () => {
    try {
      await AlertService.markAllAlertsAsRead();
      await refreshData();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'markAllAlertsAsRead'), 'STORAGE_ERROR');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await AlertService.deleteAlert(alertId);
      await refreshData();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'deleteAlert'), 'STORAGE_ERROR');
    }
  };

  const checkBudgetAlerts = async () => {
    try {
      return await AlertService.checkBudgetAlerts();
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'checkBudgetAlerts'), 'STORAGE_ERROR');
    }
  };

  // Export/Import methods
  const exportToJSON = async () => {
    try {
      const exportData = await DataExportService.exportToJSON();
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'exportToJSON'), 'STORAGE_ERROR');
    }
  };

  const exportToCSV = async (type: 'transactions' | 'budgets' | 'categories') => {
    try {
      switch (type) {
        case 'transactions':
          return await DataExportService.exportTransactionsToCSV();
        case 'budgets':
          return await DataExportService.exportBudgetsToCSV();
        case 'categories':
          return await DataExportService.exportCategoriesToCSV();
        default:
          throw new Error('Invalid export type');
      }
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'exportToCSV'), 'STORAGE_ERROR');
    }
  };

  const importFromJSON = async (jsonData: string) => {
    try {
      return await DataExportService.importFromJSON(jsonData);
    } catch (error) {
      throw ErrorHandler.createError(ErrorHandler.handleError(error, 'importFromJSON'), 'STORAGE_ERROR');
    }
  };

  if (loading || !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading...</Text>
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
    
    // Alert management
    getAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    checkBudgetAlerts,
    
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
