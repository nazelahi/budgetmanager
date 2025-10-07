import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { Budget, deleteBudget } from '../store/slices/budgetsSlice';
import { Transaction } from '../store/slices/transactionsSlice';

const BudgetsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { budgets } = useSelector((state: RootState) => state.budgets);
  const { transactions } = useSelector((state: RootState) => state.transactions);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.user);

  const [filter, setFilter] = useState<'all' | 'active' | 'exceeded'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || colors.gray500;
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || 'help-circle';
  };

  const getBudgetStatus = (budget: Budget) => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const progress = Math.min((spent / budget.amount) * 100, 100);
    
    if (progress >= 100) return 'exceeded';
    if (progress >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return colors.error;
      case 'warning': return colors.warning;
      default: return colors.success;
    }
  };

  const budgetsWithProgress = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const progress = Math.min((spent / budget.amount) * 100, 100);
    const status = getBudgetStatus(budget);
    
    return {
      ...budget,
      spent,
      progress,
      status,
      remaining: budget.amount - spent,
    };
  });

  const filteredBudgets = budgetsWithProgress.filter(budget => {
    if (filter === 'all') return true;
    if (filter === 'active') return budget.status !== 'exceeded';
    if (filter === 'exceeded') return budget.status === 'exceeded';
    return true;
  });

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteBudget(budget.id)),
        },
      ]
    );
  };

  const renderBudget = ({ item }: { item: typeof budgetsWithProgress[0] }) => (
    <Card style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.budgetIcon,
              { backgroundColor: getCategoryColor(item.category) + '20' },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(item.category) as keyof typeof Ionicons.glyphMap}
              size={20}
              color={getCategoryColor(item.category)}
            />
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetName}>{item.name}</Text>
            <Text style={styles.budgetCategory}>{item.category}</Text>
            <Text style={styles.budgetPeriod}>
              {item.period.charAt(0).toUpperCase() + item.period.slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteBudget(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.budgetAmounts}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Budgeted</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Spent</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.spent)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text
            style={[
              styles.amountValue,
              { color: item.remaining < 0 ? colors.error : colors.textPrimary },
            ]}
          >
            {formatCurrency(item.remaining)}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercentage}>{item.progress.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(item.progress, 100)}%`,
                backgroundColor: getStatusColor(item.status),
              },
            ]}
          />
        </View>
      </View>

      {item.status === 'exceeded' && (
        <View style={styles.exceededWarning}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={styles.exceededText}>Budget exceeded!</Text>
        </View>
      )}
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No budgets found</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Create your first budget to start tracking expenses'
          : `No ${filter} budgets found`}
      </Text>
      <Button
        title="Create Budget"
        onPress={() => navigation.navigate('AddBudget' as never)}
        style={styles.emptyStateButton}
        gradient="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Budgets"
        subtitle={`${budgets.length} active budgets`}
        rightComponent={
          <Button
            title="Create"
            onPress={() => navigation.navigate('AddBudget' as never)}
            gradient="primary"
            style={styles.addButton}
          />
        }
        variant="gradient"
      />

      {/* Modern Tab Filters */}
      <View style={styles.filters}>
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: 'All', icon: 'list' },
            { key: 'active', label: 'Active', icon: 'play-circle' },
            { key: 'exceeded', label: 'Exceeded', icon: 'warning' },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabButton,
                filter === key && styles.tabButtonActive,
              ]}
              onPress={() => setFilter(key as any)}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={icon as any}
                  size={18}
                  color={filter === key ? colors.white : colors.gray600}
                />
                <Text
                  style={[
                    styles.tabText,
                    filter === key && styles.tabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budgets List */}
      <FlatList
        data={filteredBudgets}
        renderItem={renderBudget}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Space for floating navigation
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  filters: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['4'],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius['2xl'],
    padding: spacing['1'],
    marginBottom: spacing['4'],
    ...shadows.sm,
  },
  tabButton: {
    flex: 1,
    borderRadius: borderRadius['xl'],
    overflow: 'hidden',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['2'],
    gap: spacing['1.5'],
  },
  tabText: {
    ...typography.textStyles.bodyMedium,
    color: colors.gray600,
    fontWeight: typography.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  budgetCard: {
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    ...typography.textStyles.h6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  budgetCategory: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  budgetPeriod: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
    marginTop: 1,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  budgetAmounts: {
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  amountLabel: {
    ...typography.textStyles.body2,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  progressSection: {
    marginBottom: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
  },
  progressPercentage: {
    ...typography.textStyles.caption,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  exceededWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  exceededText: {
    ...typography.textStyles.caption,
    color: colors.error,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateText: {
    ...typography.textStyles.h5,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.textStyles.body2,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: spacing.md,
  },
});

export default BudgetsScreen;
