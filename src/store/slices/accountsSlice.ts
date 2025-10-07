import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'other';
  bankName?: string;
  accountNumber?: string; // Last 4 digits for display
  balance: number;
  currency: string;
  isActive: boolean;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  creditLimit?: number; // For credit cards
  interestRate?: number; // For savings accounts
  minimumBalance?: number; // For checking accounts
}

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  lastUpdated: string;
  previousBalance: number;
  change: number;
  changePercentage: number;
}

interface AccountsState {
  accounts: Account[];
  transfers: AccountTransfer[];
  balances: AccountBalance[];
  loading: boolean;
  error: string | null;
  defaultAccountId: string | null;
}

const initialState: AccountsState = {
  accounts: [
    // Default accounts
    {
      id: 'acc_1',
      name: 'Main Checking',
      type: 'checking',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      balance: 2500.00,
      currency: 'USD',
      isActive: true,
      color: '#3b82f6',
      icon: 'card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
      minimumBalance: 100,
    },
    {
      id: 'acc_2',
      name: 'Savings Account',
      type: 'savings',
      bankName: 'Chase Bank',
      accountNumber: '****5678',
      balance: 10000.00,
      currency: 'USD',
      isActive: true,
      color: '#10b981',
      icon: 'wallet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      interestRate: 2.5,
    },
    {
      id: 'acc_3',
      name: 'Credit Card',
      type: 'credit_card',
      bankName: 'Chase Bank',
      accountNumber: '****9012',
      balance: -1500.00, // Negative for credit card debt
      currency: 'USD',
      isActive: true,
      color: '#ef4444',
      icon: 'card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      creditLimit: 5000,
    },
  ],
  transfers: [],
  balances: [],
  loading: false,
  error: null,
  defaultAccountId: 'acc_1',
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    // Account management
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.unshift(action.payload);
      // If this is the first account, make it default
      if (state.accounts.length === 1) {
        state.defaultAccountId = action.payload.id;
        action.payload.isDefault = true;
      }
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.accounts.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.accounts[index] = { 
          ...action.payload, 
          updatedAt: new Date().toISOString() 
        };
      }
    },
    deleteAccount: (state, action: PayloadAction<string>) => {
      const accountId = action.payload;
      state.accounts = state.accounts.filter(a => a.id !== accountId);
      
      // If deleted account was default, set another as default
      if (state.defaultAccountId === accountId) {
        const remainingAccounts = state.accounts.filter(a => a.isActive);
        if (remainingAccounts.length > 0) {
          state.defaultAccountId = remainingAccounts[0].id;
          remainingAccounts[0].isDefault = true;
        } else {
          state.defaultAccountId = null;
        }
      }
      
      // Remove related transfers and balances
      state.transfers = state.transfers.filter(t => 
        t.fromAccountId !== accountId && t.toAccountId !== accountId
      );
      state.balances = state.balances.filter(b => b.accountId !== accountId);
    },
    setDefaultAccount: (state, action: PayloadAction<string>) => {
      // Remove default from current default account
      const currentDefault = state.accounts.find(a => a.isDefault);
      if (currentDefault) {
        currentDefault.isDefault = false;
      }
      
      // Set new default account
      const newDefault = state.accounts.find(a => a.id === action.payload);
      if (newDefault) {
        newDefault.isDefault = true;
        state.defaultAccountId = action.payload;
      }
    },
    toggleAccountActive: (state, action: PayloadAction<string>) => {
      const account = state.accounts.find(a => a.id === action.payload);
      if (account) {
        account.isActive = !account.isActive;
        account.updatedAt = new Date().toISOString();
        
        // If deactivating default account, set another as default
        if (!account.isActive && account.isDefault) {
          const activeAccounts = state.accounts.filter(a => a.isActive && a.id !== account.id);
          if (activeAccounts.length > 0) {
            activeAccounts[0].isDefault = true;
            state.defaultAccountId = activeAccounts[0].id;
          } else {
            state.defaultAccountId = null;
          }
          account.isDefault = false;
        }
      }
    },

    // Balance management
    updateAccountBalance: (state, action: PayloadAction<{ accountId: string; balance: number }>) => {
      const { accountId, balance } = action.payload;
      const account = state.accounts.find(a => a.id === accountId);
      if (account) {
        const previousBalance = account.balance;
        const change = balance - previousBalance;
        const changePercentage = previousBalance !== 0 ? (change / Math.abs(previousBalance)) * 100 : 0;
        
        account.balance = balance;
        account.updatedAt = new Date().toISOString();
        
        // Update or create balance record
        const balanceIndex = state.balances.findIndex(b => b.accountId === accountId);
        const balanceRecord: AccountBalance = {
          accountId,
          balance,
          lastUpdated: new Date().toISOString(),
          previousBalance,
          change,
          changePercentage,
        };
        
        if (balanceIndex !== -1) {
          state.balances[balanceIndex] = balanceRecord;
        } else {
          state.balances.push(balanceRecord);
        }
      }
    },

    // Transfer management
    addTransfer: (state, action: PayloadAction<AccountTransfer>) => {
      state.transfers.unshift(action.payload);
      
      // Update account balances
      const { fromAccountId, toAccountId, amount } = action.payload;
      
      // Decrease from account balance
      const fromAccount = state.accounts.find(a => a.id === fromAccountId);
      if (fromAccount) {
        fromAccount.balance -= amount;
        fromAccount.updatedAt = new Date().toISOString();
      }
      
      // Increase to account balance
      const toAccount = state.accounts.find(a => a.id === toAccountId);
      if (toAccount) {
        toAccount.balance += amount;
        toAccount.updatedAt = new Date().toISOString();
      }
    },
    updateTransfer: (state, action: PayloadAction<AccountTransfer>) => {
      const index = state.transfers.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const oldTransfer = state.transfers[index];
        const newTransfer = action.payload;
        
        // Revert old transfer
        const oldFromAccount = state.accounts.find(a => a.id === oldTransfer.fromAccountId);
        const oldToAccount = state.accounts.find(a => a.id === oldTransfer.toAccountId);
        if (oldFromAccount) {
          oldFromAccount.balance += oldTransfer.amount;
          oldFromAccount.updatedAt = new Date().toISOString();
        }
        if (oldToAccount) {
          oldToAccount.balance -= oldTransfer.amount;
          oldToAccount.updatedAt = new Date().toISOString();
        }
        
        // Apply new transfer
        const newFromAccount = state.accounts.find(a => a.id === newTransfer.fromAccountId);
        const newToAccount = state.accounts.find(a => a.id === newTransfer.toAccountId);
        if (newFromAccount) {
          newFromAccount.balance -= newTransfer.amount;
          newFromAccount.updatedAt = new Date().toISOString();
        }
        if (newToAccount) {
          newToAccount.balance += newTransfer.amount;
          newToAccount.updatedAt = new Date().toISOString();
        }
        
        state.transfers[index] = newTransfer;
      }
    },
    deleteTransfer: (state, action: PayloadAction<string>) => {
      const transfer = state.transfers.find(t => t.id === action.payload);
      if (transfer) {
        // Revert transfer
        const fromAccount = state.accounts.find(a => a.id === transfer.fromAccountId);
        const toAccount = state.accounts.find(a => a.id === transfer.toAccountId);
        if (fromAccount) {
          fromAccount.balance += transfer.amount;
          fromAccount.updatedAt = new Date().toISOString();
        }
        if (toAccount) {
          toAccount.balance -= transfer.amount;
          toAccount.updatedAt = new Date().toISOString();
        }
      }
      state.transfers = state.transfers.filter(t => t.id !== action.payload);
    },

    // Bulk operations
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload;
    },
    setTransfers: (state, action: PayloadAction<AccountTransfer[]>) => {
      state.transfers = action.payload;
    },
    setBalances: (state, action: PayloadAction<AccountBalance[]>) => {
      state.balances = action.payload;
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

// Helper functions
export const getTotalBalance = (accounts: Account[]): number => {
  return accounts
    .filter(a => a.isActive)
    .reduce((total, account) => {
      // For credit cards, subtract the debt from total
      if (account.type === 'credit_card') {
        return total + account.balance; // balance is already negative
      }
      return total + account.balance;
    }, 0);
};

export const getAccountById = (accounts: Account[], accountId: string): Account | undefined => {
  return accounts.find(a => a.id === accountId);
};

export const getActiveAccounts = (accounts: Account[]): Account[] => {
  return accounts.filter(a => a.isActive);
};

export const getAccountsByType = (accounts: Account[], type: Account['type']): Account[] => {
  return accounts.filter(a => a.type === type && a.isActive);
};

export const getCreditCardDebt = (accounts: Account[]): number => {
  return accounts
    .filter(a => a.type === 'credit_card' && a.isActive)
    .reduce((total, account) => total + Math.abs(account.balance), 0);
};

export const getAvailableCredit = (accounts: Account[]): number => {
  return accounts
    .filter(a => a.type === 'credit_card' && a.isActive)
    .reduce((total, account) => {
      const creditLimit = account.creditLimit || 0;
      const currentDebt = Math.abs(account.balance);
      return total + (creditLimit - currentDebt);
    }, 0);
};

export const {
  addAccount,
  updateAccount,
  deleteAccount,
  setDefaultAccount,
  toggleAccountActive,
  updateAccountBalance,
  addTransfer,
  updateTransfer,
  deleteTransfer,
  setAccounts,
  setTransfers,
  setBalances,
  setLoading,
  setError,
} = accountsSlice.actions;

export default accountsSlice.reducer;
