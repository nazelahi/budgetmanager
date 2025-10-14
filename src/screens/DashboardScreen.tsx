import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, formatCurrencyAmount } from '../utils/theme';
import { AnimatedCard } from '../components/AnimatedComponents';
import DataService from '../services/DataService';
import BudgetService from '../services/BudgetService';
import { DashboardStats, Transaction, BudgetStats } from '../types';
import { getCategoryDetails } from '../utils/categoryUtils';
import EditTransactionModal from './EditTransactionScreen';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, refreshData, deleteTransaction } = useApp();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [budgetStats, setBudgetStats] = useState<BudgetStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'budget'>('transactions');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const loadData = async () => {
    try {
      if (data && data.transactions) {
        const [statsData, budgetData] = await Promise.all([
          DataService.getDashboardStats(),
          BudgetService.getBudgetStats('monthly')
        ]);
        setStats(statsData);
        setBudgetStats(budgetData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default stats to prevent crashes
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBalance: 0,
        topCategories: [],
      });
      setBudgetStats({
        totalBudgeted: 0,
        totalSpent: 0,
        remaining: 0,
        percentageUsed: 0,
        isOverBudget: false,
        categories: [],
      });
      // Calculate stats from actual data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTransactions = data?.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      }) || [];

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = data?.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      const totalExpenses = data?.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        monthlyBalance: monthlyIncome - monthlyExpenses,
        topCategories: [],
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [data?.transactions]);



  useEffect(() => {
    // Update stats when currentDate changes
    const monthlyStats = getMonthlyStats();
    if (stats) {
      setStats({
        ...stats,
        monthlyIncome: monthlyStats.income,
        monthlyExpenses: monthlyStats.expenses,
        monthlyBalance: monthlyStats.balance,
      });
    }
  }, [currentDate, data?.transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadData();
    setRefreshing(false);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const changeYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // Filter transactions by selected month and year
  const getFilteredTransactions = () => {
    if (!data?.transactions) return [];
    
    return data.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentDate.getMonth() && 
             transactionDate.getFullYear() === currentDate.getFullYear();
    });
  };

  // Calculate monthly stats from filtered transactions
  const getMonthlyStats = () => {
    const filteredTransactions = getFilteredTransactions();
    
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, data?.settings?.currency || 'USD');
  };

  const handleDeleteTransaction = (transaction: any) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(transaction.id),
        },
      ]
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleLongPress = (transaction: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: transaction.description,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEditTransaction(transaction);
          } else if (buttonIndex === 2) {
            handleDeleteTransaction(transaction);
          }
        }
      );
    } else {
      Alert.alert(
        'Transaction Options',
        `What would you like to do with "${transaction.description}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Edit',
            onPress: () => handleEditTransaction(transaction),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteTransaction(transaction),
          },
        ]
      );
    }
  };

  // Get recent transactions for display
  const recentTransactions = getFilteredTransactions()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  if (!stats) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        {/* Custom Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="wallet" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Transaction Manager</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('AlertsDashboard')}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(400)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content - Everything except header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date Navigation */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.dateNavigationContainer}>
          <View style={styles.dateNavigation}>
            <View style={styles.dateSection}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => changeMonth('prev')}
              >
                <Ionicons name="chevron-back" size={16} color={colors.white} />
              </TouchableOpacity>
              <Ionicons name="calendar" size={16} color={colors.white} />
              <Text style={styles.dateText}>{currentDate.toLocaleDateString('en-US', { month: 'long' })}</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => changeMonth('next')}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateSection}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => changeYear('prev')}
              >
                <Ionicons name="chevron-back" size={16} color={colors.white} />
              </TouchableOpacity>
              <Ionicons name="calendar" size={16} color={colors.white} />
              <Text style={styles.dateText}>{currentDate.getFullYear()}</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => changeYear('next')}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Summary Cards - Compact Single Row */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <AnimatedCard style={styles.summaryCard}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-up" size={16} color={colors.primary} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(getMonthlyStats().income)}</Text>
                </View>
              </View>
            </AnimatedCard>

            <AnimatedCard style={styles.summaryCard}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-down" size={16} color={colors.error} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(getMonthlyStats().expenses)}</Text>
                </View>
              </View>
            </AnimatedCard>

            <AnimatedCard style={styles.summaryCard}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="wallet" size={16} color={colors.primary} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Balance</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(getMonthlyStats().balance)}</Text>
                </View>
              </View>
            </AnimatedCard>
          </View>
        </Animated.View>

        {/* Tab Navigation */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'transactions' && styles.activeTabButton]}
            onPress={() => setActiveTab('transactions')}
          >
            <Ionicons 
              name="receipt" 
              size={16} 
              color={activeTab === 'transactions' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
              Transactions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'budget' && styles.activeTabButton]}
            onPress={() => setActiveTab('budget')}
          >
            <Ionicons 
              name="card" 
              size={16} 
              color={activeTab === 'budget' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'budget' && styles.activeTabText]}>
              Budget
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        {activeTab === 'transactions' ? (
          <Animated.View entering={SlideInRight.delay(800)} style={styles.transactionList}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <AnimatedCard 
                    style={styles.transactionCardInner}
                    delay={900 + (index * 100)}
                  >
                    <TouchableOpacity
                      style={styles.transactionContent}
                      onPress={() => handleEditTransaction(transaction)}
                      onLongPress={() => handleLongPress(transaction)}
                    >
                      <View style={styles.transactionLeft}>
                        <View style={[
                          styles.transactionIcon,
                          { backgroundColor: getCategoryDetails(transaction.category, data.categories).color + '20' }
                        ]}>
                          <Ionicons 
                            name={getCategoryDetails(transaction.category, data.categories).icon as any} 
                            size={16} 
                            color={getCategoryDetails(transaction.category, data.categories).color} 
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionName}>{transaction.description}</Text>
                          <Text style={styles.transactionCategory}>{transaction.category}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.type === 'income' ? colors.primary : colors.error }
                        ]}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </AnimatedCard>
                </View>
              ))
            ) : (
              <Animated.View entering={FadeInDown.delay(800)} style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first transaction to get started</Text>
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInRight.delay(800)} style={styles.budgetList}>
            {budgetStats && budgetStats.categories.length > 0 ? (
              budgetStats.categories.map((category, index) => (
                <AnimatedCard 
                  key={category.categoryId} 
                  style={styles.budgetCard}
                  delay={900 + (index * 100)}
                >
                  <View style={styles.budgetCardContent}>
                    <View style={styles.budgetCardLeft}>
                      <View style={styles.budgetIcon}>
                        <Ionicons 
                          name={data.categories.find(c => c.id === category.categoryId)?.icon as any || 'pricetag'} 
                          size={20} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.budgetInfo}>
                        <Text style={styles.budgetCategoryName}>{category.categoryName}</Text>
                        <Text style={styles.budgetAmount}>{formatCurrency(category.budgeted)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.budgetCardRight}>
                      <View style={styles.budgetProgress}>
                        <View style={styles.budgetProgressBar}>
                          <View 
                            style={[
                              styles.budgetProgressFill,
                              {
                                width: `${Math.min(category.percentageUsed, 100)}%`,
                                backgroundColor: category.isOverBudget ? colors.error : 
                                              category.percentageUsed >= 80 ? colors.warning || '#FFA500' : 
                                              category.percentageUsed >= 50 ? colors.primary : colors.success || '#4CAF50'
                              }
                            ]}
                          />
                        </View>
                        <Text style={[
                          styles.budgetPercentage,
                          { color: category.isOverBudget ? colors.error : colors.primary }
                        ]}>
                          {category.percentageUsed.toFixed(0)}%
                        </Text>
                      </View>
                      <Text style={styles.budgetSpent}>
                        {formatCurrency(category.spent)} spent
                      </Text>
                    </View>
                  </View>
                </AnimatedCard>
              ))
            ) : (
              <Animated.View entering={FadeInDown.delay(800)} style={styles.emptyState}>
                <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No budgets set</Text>
                <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking spending</Text>
                <TouchableOpacity 
                  style={styles.createBudgetButton}
                  onPress={() => (navigation as any).navigate('Budget')}
                >
                  <Text style={styles.createBudgetButtonText}>Create Budget</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}
        </ScrollView>

        {/* Edit Transaction Modal */}
        {selectedTransaction && (
          <EditTransactionModal
            visible={editModalVisible}
            onClose={handleCloseEditModal}
            transaction={selectedTransaction}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    ...shadows.xl,
    elevation: 12,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionContainer: {
    position: 'relative',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: 18,
  },
  
  
  // Date Navigation
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateNavigationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  dateButton: {
    padding: spacing.xs,
  },
  dateText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
  },
  
  // Summary Cards
  summaryContainer: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
    minHeight: 60,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  summaryInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'left',
  },
  summaryValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 2,
    height: 48,
  },
  activeTabButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderColor: 'rgba(33, 150, 243, 0.5)',
    height: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  activeTabText: {
    color: colors.white,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Account for bottom navigation
  },
  
  // Transaction List
  transactionList: {
    paddingHorizontal: spacing.sm,
  },
  transactionCard: {
    marginBottom: spacing.sm,
  },
  transactionCardInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  transactionCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Budget styles
  budgetList: {
    paddingHorizontal: spacing.sm,
  },
  budgetCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  budgetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  budgetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategoryName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  budgetAmount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  budgetCardRight: {
    alignItems: 'flex-end',
  },
  budgetProgress: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  budgetProgressBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetSpent: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  createBudgetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  createBudgetButtonText: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DashboardScreen;