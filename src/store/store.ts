import { configureStore } from '@reduxjs/toolkit';
import transactionsReducer from './slices/transactionsSlice';
import budgetsReducer from './slices/budgetsSlice';
import categoriesReducer from './slices/categoriesSlice';
import userReducer from './slices/userSlice';
import savingsGoalsReducer from './slices/savingsGoalsSlice';
import recurringTransactionsReducer from './slices/recurringTransactionsSlice';
import accountsReducer from './slices/accountsSlice';

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    budgets: budgetsReducer,
    categories: categoriesReducer,
    user: userReducer,
    savingsGoals: savingsGoalsReducer,
    recurringTransactions: recurringTransactionsReducer,
    accounts: accountsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
