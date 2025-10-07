import React, { useState, useEffect } from 'react';
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
import { Transaction, deleteTransaction } from '../store/slices/transactionsSlice';

const TransactionsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { transactions } = useSelector((state: RootState) => state.transactions);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.user);

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

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

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? 'trending-up' : 'trending-down';
  };

  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? colors.income : colors.expense;
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      if (filter === 'all') return true;
      return transaction.type === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.amount - a.amount;
    });

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteTransaction(transaction.id)),
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: getCategoryColor(item.category) + '20' },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(item.category) as keyof typeof Ionicons.glyphMap}
              size={20}
              color={getCategoryColor(item.category)}
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>
              {item.description}
            </Text>
            <Text style={styles.transactionCategory}>
              {item.category}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: getTransactionColor(item.type) },
            ]}
          >
            {item.type === 'expense' ? '-' : '+'}
            {formatCurrency(item.amount)}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteTransaction(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No transactions found</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Add your first transaction to get started'
          : `No ${filter} transactions found`}
      </Text>
      <Button
        title="Add Transaction"
        onPress={() => navigation.navigate('AddTransaction' as never)}
        style={styles.emptyStateButton}
        gradient="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Transactions"
        subtitle={`${filteredTransactions.length} transactions`}
        rightComponent={
          <Button
            title="Add"
            onPress={() => navigation.navigate('AddTransaction' as never)}
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
            { key: 'income', label: 'Income', icon: 'trending-up' },
            { key: 'expense', label: 'Expense', icon: 'trending-down' },
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

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() =>
            setSortBy(sortBy === 'date' ? 'amount' : 'date')
          }
        >
          <Ionicons
            name={sortBy === 'date' ? 'calendar' : 'cash'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.sortButtonText}>
            Sort by {sortBy === 'date' ? 'Date' : 'Amount'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sortButtonText: {
    ...typography.textStyles.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  transactionCard: {
    marginBottom: spacing.xs,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    ...typography.textStyles.body1,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  transactionCategory: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  transactionDate: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
    marginTop: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.textStyles.body1,
    fontWeight: typography.fontWeight.bold,
  },
  deleteButton: {
    padding: spacing.xs,
    marginTop: spacing.xs,
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

export default TransactionsScreen;
