import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  createdAt: string;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [
    // EXPENSE CATEGORIES
    {
      id: 'exp_1',
      name: 'Food & Dining',
      type: 'expense',
      color: '#ef4444',
      icon: 'restaurant',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_2',
      name: 'Transportation',
      type: 'expense',
      color: '#3b82f6',
      icon: 'car',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_3',
      name: 'Shopping',
      type: 'expense',
      color: '#8b5cf6',
      icon: 'bag',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_4',
      name: 'Entertainment',
      type: 'expense',
      color: '#f59e0b',
      icon: 'game-controller-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_5',
      name: 'Bills & Utilities',
      type: 'expense',
      color: '#10b981',
      icon: 'receipt',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_6',
      name: 'Healthcare',
      type: 'expense',
      color: '#f97316',
      icon: 'medical-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_7',
      name: 'Housing',
      type: 'expense',
      color: '#6366f1',
      icon: 'home',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_8',
      name: 'Education',
      type: 'expense',
      color: '#ec4899',
      icon: 'school',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_9',
      name: 'Fitness & Sports',
      type: 'expense',
      color: '#84cc16',
      icon: 'fitness-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_10',
      name: 'Travel',
      type: 'expense',
      color: '#06b6d4',
      icon: 'airplane-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_11',
      name: 'Insurance',
      type: 'expense',
      color: '#f59e0b',
      icon: 'shield-checkmark-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_12',
      name: 'Personal Care',
      type: 'expense',
      color: '#ec4899',
      icon: 'heart',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_13',
      name: 'Gifts & Donations',
      type: 'expense',
      color: '#f97316',
      icon: 'gift-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_14',
      name: 'Subscriptions',
      type: 'expense',
      color: '#8b5cf6',
      icon: 'card-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp_15',
      name: 'Miscellaneous',
      type: 'expense',
      color: '#6b7280',
      icon: 'ellipsis-horizontal',
      createdAt: new Date().toISOString(),
    },
    
    // INCOME CATEGORIES
    {
      id: 'inc_1',
      name: 'Salary',
      type: 'income',
      color: '#22c55e',
      icon: 'cash',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_2',
      name: 'Freelance',
      type: 'income',
      color: '#06b6d4',
      icon: 'briefcase',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_3',
      name: 'Investment',
      type: 'income',
      color: '#84cc16',
      icon: 'trending-up',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_4',
      name: 'Business',
      type: 'income',
      color: '#6366f1',
      icon: 'business',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_5',
      name: 'Rental Income',
      type: 'income',
      color: '#8b5cf6',
      icon: 'home',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_6',
      name: 'Side Hustle',
      type: 'income',
      color: '#f59e0b',
      icon: 'construct-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_7',
      name: 'Dividends',
      type: 'income',
      color: '#10b981',
      icon: 'pie-chart-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_8',
      name: 'Interest',
      type: 'income',
      color: '#ec4899',
      icon: 'calculator-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_9',
      name: 'Gifts Received',
      type: 'income',
      color: '#f97316',
      icon: 'gift-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_10',
      name: 'Refunds',
      type: 'income',
      color: '#ef4444',
      icon: 'arrow-back-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_11',
      name: 'Bonus',
      type: 'income',
      color: '#84cc16',
      icon: 'star-outline',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inc_12',
      name: 'Other Income',
      type: 'income',
      color: '#6b7280',
      icon: 'add-circle-outline',
      createdAt: new Date().toISOString(),
    },
  ],
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.unshift(action.payload);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(c => c.id !== action.payload);
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
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
  addCategory,
  updateCategory,
  deleteCategory,
  setCategories,
  setLoading,
  setError,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
