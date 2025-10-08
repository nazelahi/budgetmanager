import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
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
import { 
  RecurringTransaction, 
  addRecurringTransaction, 
  updateRecurringTransaction, 
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  getRecurringTransactionsDueToday,
  getRecurringTransactionsDueThisWeek
} from '../store/slices/recurringTransactionsSlice';

const RecurringTransactionsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { recurringTransactions, autoCreateEnabled } = useSelector((state: RootState) => state.recurringTransactions);
  const { user } = useSelector((state: RootState) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'due_today' | 'due_this_week'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFrequencyText = (frequency: RecurringTransaction['frequency']) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const getTypeColor = (type: 'income' | 'expense') => {
    return type === 'income' ? colors.income : colors.expense;
  };

  const getTypeIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? 'trending-up' : 'trending-down';
  };

  const isDueSoon = (nextDueDate: string) => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = (nextDueDate: string) => {
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    return dueDate < today;
  };

  const filteredTransactions = recurringTransactions.filter(transaction => {
    switch (filter) {
      case 'all':
        return true;
      case 'active':
        return transaction.isActive;
      case 'inactive':
        return !transaction.isActive;
      case 'due_today':
        return getRecurringTransactionsDueToday([transaction]).length > 0;
      case 'due_this_week':
        return getRecurringTransactionsDueThisWeek([transaction]).length > 0;
      default:
        return true;
    }
  });

  const handleDeleteTransaction = (transaction: RecurringTransaction) => {
    Alert.alert(
      'Delete Recurring Transaction',
      'Are you sure you want to delete this recurring transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteRecurringTransaction(transaction.id)),
        },
      ]
    );
  };

  const handleToggleTransaction = (transaction: RecurringTransaction) => {
    dispatch(toggleRecurringTransaction(transaction.id));
  };

  const renderTransaction = ({ item }: { item: RecurringTransaction }) => {
    const typeColor = getTypeColor(item.type);
    const typeIcon = getTypeIcon(item.type);
    const isDue = isDueSoon(item.nextDueDate);
    const isOver = isOverdue(item.nextDueDate);

    return (
      <Card style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: typeColor + '20' },
              ]}
            >
              <Ionicons
                name={typeIcon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={typeColor}
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.title}</Text>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <Text style={styles.transactionFrequency}>
                {getFrequencyText(item.frequency)}
                {item.isSubscription && ' • Subscription'}
              </Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: typeColor },
              ]}
            >
              {item.type === 'expense' ? '-' : '+'}
              {formatCurrency(item.amount)}
            </Text>
            <TouchableOpacity
              onPress={() => handleToggleTransaction(item)}
              style={[
                styles.toggleButton,
                { backgroundColor: item.isActive ? colors.success : colors.gray300 },
              ]}
            >
              <Ionicons
                name={item.isActive ? 'pause' : 'play'}
                size={16}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Due</Text>
            <Text
              style={[
                styles.detailValue,
                isOver && { color: colors.error },
                isDue && !isOver && { color: colors.warning },
              ]}
            >
              {formatDate(item.nextDueDate)}
              {isOver && ' (Overdue)'}
              {isDue && !isOver && ' (Due Soon)'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto Create</Text>
            <Text style={styles.detailValue}>
              {item.autoCreate ? 'Yes' : 'No'}
            </Text>
          </View>
          {item.endDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ends</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.endDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.transactionActions}>
          <Button
            title="Edit"
            onPress={() => {
              setSelectedTransaction(item);
              setShowEditModal(true);
            }}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Delete"
            onPress={() => handleDeleteTransaction(item)}
            variant="outline"
            style={[styles.actionButton, { borderColor: colors.error }] as any}
            textStyle={{ color: colors.error }}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="repeat-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No recurring transactions</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Add recurring bills and income to automate your finances'
          : `No ${filter.replace('_', ' ')} transactions found`}
      </Text>
      <Button
        title="Add Recurring Transaction"
        onPress={() => setShowAddModal(true)}
        style={styles.emptyStateButton}
        gradient="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Recurring Transactions"
        subtitle={`${recurringTransactions.length} recurring • ${recurringTransactions.filter(t => t.isActive).length} active`}
        rightComponent={
          <Button
            title="Add"
            onPress={() => setShowAddModal(true)}
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
            { key: 'inactive', label: 'Inactive', icon: 'pause-circle' },
            { key: 'due_today', label: 'Due Today', icon: 'today' },
            { key: 'due_this_week', label: 'This Week', icon: 'calendar' },
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
                  size={16}
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

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Add Recurring Transaction"
            rightComponent={
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Set up automatic recurring transactions
            </Text>
            
            {/* Transaction creation form would go here */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Netflix Subscription"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput
                style={styles.textInput}
                placeholder="15.99"
                placeholderTextColor={colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Expense"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Monthly"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <Button
              title="Create Recurring Transaction"
              onPress={() => {
                // Handle transaction creation
                setShowAddModal(false);
              }}
              gradient="primary"
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Edit Recurring Transaction"
            rightComponent={
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <Text style={styles.modalSubtitle}>
                  Edit "{selectedTransaction.title}"
                </Text>
                
                {/* Edit form would go here */}
                <Button
                  title="Save Changes"
                  onPress={() => {
                    // Handle update
                    setShowEditModal(false);
                  }}
                  gradient="primary"
                  style={styles.createButton}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Space for floating navigation
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
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['1'],
    gap: spacing['1'],
  },
  tabText: {
    ...typography.textStyles.caption,
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
  transactionCard: {
    marginBottom: spacing.md,
    padding: spacing['5'],
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  transactionCategory: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing['0.5'],
  },
  transactionFrequency: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.textStyles.headline6,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateText: {
    ...typography.textStyles.headline5,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.textStyles.bodyMedium,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalSubtitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: spacing.md,
  },
  formLabel: {
    ...typography.textStyles.labelLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  createButton: {
    marginTop: spacing.lg,
  },
});

export default RecurringTransactionsScreen;
