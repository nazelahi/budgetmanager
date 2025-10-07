import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Card from '../components/Card';
import Button from '../components/Button';
import FloatingActionButton from '../components/FloatingActionButton';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { Transaction } from '../store/slices/transactionsSlice';
import { Budget } from '../store/slices/budgetsSlice';

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { transactions } = useSelector((state: RootState) => state.transactions);
  const { budgets } = useSelector((state: RootState) => state.budgets);
  const { user } = useSelector((state: RootState) => state.user);

  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Calculate financial summary
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Get recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get budgets with progress
  const budgetsWithProgress = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      ...budget,
      spent,
      progress: Math.min((spent / budget.amount) * 100, 100),
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? 'trending-up' : 'trending-down';
  };

  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? colors.income : colors.expense;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Dashboard"
        subtitle={`${getGreeting()}, ${user?.name || 'User'}`}
        showProfile={true}
        variant="gradient"
      />
      
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Section with Financial Summary */}
          <LinearGradient
            colors={gradients.primary as [string, string]}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>
                <View style={styles.balanceIndicator}>
                  <Ionicons
                    name={balance >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.balanceChange}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </Text>
                </View>
              </View>
              
              {/* Financial Summary on the Right Side */}
              <View style={styles.financialSummary}>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)}</Text>
                      <Text style={styles.summaryLabel}>Income</Text>
                    </View>
                    <View style={styles.summaryIcon}>
                      <Ionicons name="trending-up" size={20} color={colors.white} />
                    </View>
                  </View>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryAmount}>{formatCurrency(totalExpenses)}</Text>
                      <Text style={styles.summaryLabel}>Expense</Text>
                    </View>
                    <View style={styles.summaryIcon}>
                      <Ionicons name="trending-down" size={20} color={colors.white} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions with Modern Cards */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <Card
                variant="gradient"
                gradient="primary"
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('AddTransaction' as never)}
                pressable
              >
                <View style={styles.quickActionContent}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.white} />
                  <Text style={styles.quickActionText}>Add Transaction</Text>
                </View>
              </Card>
              <Card
                variant="gradient"
                gradient="accent"
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('AddBudget' as never)}
                pressable
              >
                <View style={styles.quickActionContent}>
                  <Ionicons name="wallet" size={24} color={colors.white} />
                  <Text style={styles.quickActionText}>Add Budget</Text>
                </View>
              </Card>
            </View>
          </View>


          {/* Budget Progress with Modern Design */}
          {budgetsWithProgress.length > 0 && (
            <View style={styles.budgetSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Budget Progress</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Budgets' as never)}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {budgetsWithProgress.slice(0, 3).map((budget, index) => (
                <Card key={budget.id} variant="elevated" style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetName}>{budget.name}</Text>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                    </View>
                    <View style={styles.budgetAmountContainer}>
                      <Text style={styles.budgetAmount}>
                        {formatCurrency(budget.spent)}
                      </Text>
                      <Text style={styles.budgetTotal}>
                        of {formatCurrency(budget.amount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(budget.progress, 100)}%`,
                            backgroundColor: budget.progress > 100 ? colors.error : colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {budget.progress.toFixed(0)}%
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Recent Transactions with Modern List */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <Card key={transaction.id} variant="elevated" style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: getTransactionColor(transaction.type) + '15' },
                        ]}
                      >
                        <Ionicons
                          name={getTransactionIcon(transaction.type)}
                          size={20}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionCategory}>
                          {transaction.category}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: getTransactionColor(transaction.type) },
                        ]}
                      >
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card variant="elevated" style={styles.emptyState}>
                <View style={styles.emptyStateContent}>
                  <Ionicons name="receipt-outline" size={64} color={colors.gray400} />
                  <Text style={styles.emptyStateText}>No transactions yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add your first transaction to get started
                  </Text>
                  <Button
                    title="Add Transaction"
                    onPress={() => navigation.navigate('AddTransaction' as never)}
                    variant="gradient"
                    gradient="primary"
                    style={styles.emptyStateButton}
                  />
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </Animated.View>
      
      {/* Floating Action Button - Hidden since we have center button in navigation */}
      {/* <FloatingActionButton
        onAddTransaction={() => navigation.navigate('AddTransaction' as never)}
        onAddBudget={() => navigation.navigate('AddBudget' as never)}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 110, // Space for new navigation design
  },
  
  // Balance Section Styles
  balanceGradient: {
    marginHorizontal: spacing['2'],
    marginTop: spacing['2'],
    marginBottom: spacing['6'],
    padding: spacing['6'],
    borderRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing['2'],
  },
  balanceText: {
    ...typography.textStyles.displaySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['2'],
  },
  balanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1.5'],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  balanceChange: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing['1'],
  },
  
  // Financial Summary Styles
  financialSummary: {
    alignItems: 'flex-end',
  },
  summaryGrid: {
    flexDirection: 'column',
    gap: spacing['2'],
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  summaryTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing['2'],
  },
  summaryAmount: {
    ...typography.textStyles.headline6,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['0.5'],
  },
  summaryLabel: {
    ...typography.textStyles.caption,
    color: colors.white,
    opacity: 0.8,
  },

  // Quick Actions Styles
  quickActionsSection: {
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['6'],
    paddingTop: spacing['8'],
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing['4'],
    marginTop: spacing['4'],
  },
  quickActionCard: {
    flex: 1,
    padding: spacing['4'],
  },
  quickActionContent: {
    alignItems: 'center',
    gap: spacing['2'],
  },
  quickActionText: {
    ...typography.textStyles.labelLarge,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },

  // Section Styles
  sectionTitle: {
    ...typography.textStyles.headline4,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['4'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  viewAllText: {
    ...typography.textStyles.labelMedium,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  // Overview Styles
  overviewSection: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['6'],
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  overviewCard: {
    flex: 1,
    padding: spacing['5'],
  },
  overviewCardContent: {
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  overviewAmount: {
    ...typography.textStyles.headline5,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  overviewLabel: {
    ...typography.textStyles.labelLarge,
    color: colors.textSecondary,
    marginBottom: spacing['0.5'],
  },
  overviewSubtext: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
  },

  // Budget Styles
  budgetSection: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['6'],
  },
  budgetCard: {
    marginBottom: spacing['4'],
    padding: spacing['5'],
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['4'],
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['1'],
  },
  budgetCategory: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  budgetAmountContainer: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  budgetTotal: {
    ...typography.textStyles.bodySmall,
    color: colors.textTertiary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.textStyles.labelMedium,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
    minWidth: 40,
    textAlign: 'right',
  },

  // Transaction Styles
  transactionsSection: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['8'],
  },
  transactionCard: {
    marginBottom: spacing['3'],
    padding: spacing['4'],
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  transactionCategory: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing['0.5'],
  },
  transactionDate: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.textStyles.headline6,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty State Styles
  emptyState: {
    padding: spacing['8'],
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.textStyles.headline5,
    color: colors.textSecondary,
    marginTop: spacing['4'],
    marginBottom: spacing['2'],
  },
  emptyStateSubtext: {
    ...typography.textStyles.bodyMedium,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing['6'],
  },
  emptyStateButton: {
    paddingHorizontal: spacing['6'],
  },
});

export default DashboardScreen;
