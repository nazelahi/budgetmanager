export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  accountId?: string; // Reference to the financial account
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'savings' | 'investment' | 'other';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
  description?: string;
  accountNumber?: string;
  bankName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  transactionId: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  date: string;
  createdAt: string;
}


// Enhanced AppData interface
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  accounts: FinancialAccount[];
  accountTransactions: AccountTransaction[];
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