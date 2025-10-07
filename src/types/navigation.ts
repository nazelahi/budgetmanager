export type RootStackParamList = {
  Main: undefined;
  AddTransaction: undefined;
  AddBudget: undefined;
  Categories: undefined;
  SavingsGoals: undefined;
  RecurringTransactions: undefined;
  Accounts: undefined;
  Settings: undefined;
  CurrencySelection: undefined;
  ThemeSelection: undefined;
  NotificationSettings: undefined;
  ImportData: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Accounts: undefined;
  Budgets: undefined;
  Reports: undefined;
  More: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
