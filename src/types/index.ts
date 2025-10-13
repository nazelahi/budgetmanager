export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate: string;
}


// New interface for budget alerts
export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'warning' | 'exceeded' | 'reminder';
  threshold: number; // Percentage (e.g., 80 for 80% warning)
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Enhanced AppData interface
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  budgetAlerts: BudgetAlert[];
  settings: {
    currency: string;
    theme: 'light' | 'dark';
    notifications: boolean;
    alertThresholds: {
      warning: number; // Default 80%
      critical: number; // Default 95%
    };
  };
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

// Export/Import interfaces
export interface ExportData {
  version: string;
  exportDate: string;
  data: AppData;
  metadata: {
    totalTransactions: number;
    totalCategories: number;
    totalBudgets: number;
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    transactions: number;
    categories: number;
    budgets: number;
  };
  errors: string[];
  warnings: string[];
}