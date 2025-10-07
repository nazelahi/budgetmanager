import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecurringTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  isSubscription: boolean;
  autoCreate: boolean; // Whether to automatically create transactions
  createdAt: string;
  updatedAt: string;
  color: string;
  icon: string;
}

export interface RecurringTransactionTemplate {
  id: string;
  recurringTransactionId: string;
  templateName: string;
  isDefault: boolean;
  createdAt: string;
}

interface RecurringTransactionsState {
  recurringTransactions: RecurringTransaction[];
  templates: RecurringTransactionTemplate[];
  loading: boolean;
  error: string | null;
  autoCreateEnabled: boolean;
}

const initialState: RecurringTransactionsState = {
  recurringTransactions: [],
  templates: [
    // Default templates
    {
      id: 'template_1',
      recurringTransactionId: '',
      templateName: 'Monthly Rent',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'template_2',
      recurringTransactionId: '',
      templateName: 'Salary',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'template_3',
      recurringTransactionId: '',
      templateName: 'Netflix Subscription',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'template_4',
      recurringTransactionId: '',
      templateName: 'Gym Membership',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'template_5',
      recurringTransactionId: '',
      templateName: 'Electricity Bill',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ],
  loading: false,
  error: null,
  autoCreateEnabled: true,
};

const recurringTransactionsSlice = createSlice({
  name: 'recurringTransactions',
  initialState,
  reducers: {
    // Recurring transaction management
    addRecurringTransaction: (state, action: PayloadAction<RecurringTransaction>) => {
      state.recurringTransactions.unshift(action.payload);
    },
    updateRecurringTransaction: (state, action: PayloadAction<RecurringTransaction>) => {
      const index = state.recurringTransactions.findIndex(rt => rt.id === action.payload.id);
      if (index !== -1) {
        state.recurringTransactions[index] = { 
          ...action.payload, 
          updatedAt: new Date().toISOString() 
        };
      }
    },
    deleteRecurringTransaction: (state, action: PayloadAction<string>) => {
      state.recurringTransactions = state.recurringTransactions.filter(rt => rt.id !== action.payload);
    },
    toggleRecurringTransaction: (state, action: PayloadAction<string>) => {
      const recurringTransaction = state.recurringTransactions.find(rt => rt.id === action.payload);
      if (recurringTransaction) {
        recurringTransaction.isActive = !recurringTransaction.isActive;
        recurringTransaction.updatedAt = new Date().toISOString();
      }
    },
    updateNextDueDate: (state, action: PayloadAction<{ id: string; nextDueDate: string }>) => {
      const recurringTransaction = state.recurringTransactions.find(rt => rt.id === action.payload.id);
      if (recurringTransaction) {
        recurringTransaction.nextDueDate = action.payload.nextDueDate;
        recurringTransaction.updatedAt = new Date().toISOString();
      }
    },

    // Template management
    addTemplate: (state, action: PayloadAction<RecurringTransactionTemplate>) => {
      state.templates.unshift(action.payload);
    },
    updateTemplate: (state, action: PayloadAction<RecurringTransactionTemplate>) => {
      const index = state.templates.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },

    // Settings
    setAutoCreateEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoCreateEnabled = action.payload;
    },

    // Bulk operations
    setRecurringTransactions: (state, action: PayloadAction<RecurringTransaction[]>) => {
      state.recurringTransactions = action.payload;
    },
    setTemplates: (state, action: PayloadAction<RecurringTransactionTemplate[]>) => {
      state.templates = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Helper function to calculate next due date
export const calculateNextDueDate = (
  frequency: RecurringTransaction['frequency'],
  lastDueDate: string
): string => {
  const date = new Date(lastDueDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString();
};

// Helper function to check if a recurring transaction is due
export const isRecurringTransactionDue = (recurringTransaction: RecurringTransaction): boolean => {
  const now = new Date();
  const dueDate = new Date(recurringTransaction.nextDueDate);
  return now >= dueDate && recurringTransaction.isActive;
};

// Helper function to get recurring transactions due today
export const getRecurringTransactionsDueToday = (recurringTransactions: RecurringTransaction[]): RecurringTransaction[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  return recurringTransactions.filter(rt => {
    const dueDate = new Date(rt.nextDueDate);
    return dueDate <= today && rt.isActive;
  });
};

// Helper function to get recurring transactions due this week
export const getRecurringTransactionsDueThisWeek = (recurringTransactions: RecurringTransaction[]): RecurringTransaction[] => {
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  
  return recurringTransactions.filter(rt => {
    const dueDate = new Date(rt.nextDueDate);
    return dueDate >= today && dueDate <= weekFromNow && rt.isActive;
  });
};

export const {
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  updateNextDueDate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setAutoCreateEnabled,
  setRecurringTransactions,
  setTemplates,
  setLoading,
  setError,
} = recurringTransactionsSlice.actions;

export default recurringTransactionsSlice.reducer;
