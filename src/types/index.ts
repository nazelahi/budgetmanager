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


// Enhanced AppData interface
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  settings: {
    currency: string;
    theme: 'light' | 'dark';
    notifications: boolean;
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