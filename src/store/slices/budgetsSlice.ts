import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface BudgetsState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
}

const initialState: BudgetsState = {
  budgets: [],
  loading: false,
  error: null,
};

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    addBudget: (state, action: PayloadAction<Budget>) => {
      state.budgets.unshift(action.payload);
    },
    updateBudget: (state, action: PayloadAction<Budget>) => {
      const index = state.budgets.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.budgets[index] = action.payload;
      }
    },
    deleteBudget: (state, action: PayloadAction<string>) => {
      state.budgets = state.budgets.filter(b => b.id !== action.payload);
    },
    setBudgets: (state, action: PayloadAction<Budget[]>) => {
      state.budgets = action.payload;
    },
    updateBudgetSpent: (state, action: PayloadAction<{ budgetId: string; spent: number }>) => {
      const budget = state.budgets.find(b => b.id === action.payload.budgetId);
      if (budget) {
        budget.spent = action.payload.spent;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addBudget,
  updateBudget,
  deleteBudget,
  setBudgets,
  updateBudgetSpent,
  setLoading,
  setError,
} = budgetsSlice.actions;

export default budgetsSlice.reducer;
