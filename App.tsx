import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { Ionicons } from '@expo/vector-icons';
import { SyncService } from './src/services/syncService';
import { StorageService } from './src/services/storageService';
import { colors } from './src/constants/colors';
import { typography } from './src/constants/typography';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AddBudgetScreen from './src/screens/AddBudgetScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SavingsGoalsScreen from './src/screens/SavingsGoalsScreen';
import RecurringTransactionsScreen from './src/screens/RecurringTransactionsScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import MoreScreen from './src/screens/MoreScreen';
import CurrencySelectionScreen from './src/screens/CurrencySelectionScreen';
import ThemeSelectionScreen from './src/screens/ThemeSelectionScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import ImportDataScreen from './src/screens/ImportDataScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';

// Types
import { RootStackParamList, TabParamList } from './src/types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
      />
      <Tab.Screen 
        name="Accounts" 
        component={AccountsScreen}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize data synchronization
    SyncService.initialize().catch(console.error);
    
    // Check storage health on app start
    StorageService.checkStorageHealth().then(health => {
      if (!health.isAsyncStorageWorking) {
        console.log('📱 Storage Status: Using memory storage (iOS simulator issue)');
        console.log('💾 Memory storage keys:', health.memoryStorageKeys);
        if (health.errorMessage) {
          console.log('⚠️ Error:', health.errorMessage);
        }
      } else {
        console.log('✅ Storage Status: AsyncStorage working normally');
      }
    }).catch(console.error);
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AddTransaction" 
            component={AddTransactionScreen}
          />
          <Stack.Screen 
            name="AddBudget" 
            component={AddBudgetScreen}
          />
          <Stack.Screen 
            name="Categories" 
            component={CategoriesScreen}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
          />
          <Stack.Screen 
            name="SavingsGoals" 
            component={SavingsGoalsScreen}
          />
          <Stack.Screen 
            name="RecurringTransactions" 
            component={RecurringTransactionsScreen}
          />
      <Stack.Screen 
        name="Accounts" 
        component={AccountsScreen}
      />
      <Stack.Screen 
        name="CurrencySelection" 
        component={CurrencySelectionScreen}
      />
      <Stack.Screen 
        name="ThemeSelection" 
        component={ThemeSelectionScreen}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
      />
      <Stack.Screen 
        name="ImportData" 
        component={ImportDataScreen}
      />
    </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}