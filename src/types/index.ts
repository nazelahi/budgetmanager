export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: "income" | "expense";
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: "warning" | "exceeded" | "achieved";
  threshold: number; // Percentage (e.g., 80 for 80% warning)
  isRead: boolean;
  createdAt: string;
  categoryName?: string;
  amount?: number;
  budgetAmount?: number;
  message?: string;
}

export interface AlertSettings {
  warningThresholds: number[]; // e.g., [70, 80, 90]
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  alertFrequency: "immediate" | "daily" | "weekly";
  smartSuggestions: boolean;
}

export interface AlertHistory {
  id: string;
  budgetId: string;
  categoryName: string;
  type: "warning" | "exceeded" | "achieved";
  threshold: number;
  amount: number;
  budgetAmount: number;
  percentageUsed: number;
  createdAt: string;
  isRead: boolean;
}

export interface SmartSuggestion {
  id: string;
  budgetId: string;
  categoryName: string;
  type:
    | "reduce_spending"
    | "increase_budget"
    | "reallocate_funds"
    | "spending_pattern";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  createdAt: string;
}

export interface BudgetStats {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }>;
}

// Enhanced AppData interface
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  budgetAlerts: BudgetAlert[];
  alertHistory: AlertHistory[];
  smartSuggestions: SmartSuggestion[];
  alertSettings: AlertSettings;
  settings: {
    currency: string;
    theme: "light" | "dark";
    notifications: boolean;
  };
  isSetupComplete: boolean;
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
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    transactions: number;
    categories: number;
  };
  errors: string[];
  warnings: string[];
}
