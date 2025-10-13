import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  SlideInLeft, 
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, formatCurrencyAmount } from '../utils/theme';
import { Transaction } from '../types';
import { getCategoryDetails } from '../utils/categoryUtils';
import EditTransactionModal from './EditTransactionScreen';
import AlertService from '../services/AlertService';

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, deleteTransaction } = useApp();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Animation values for header buttons
  const filterButtonScale = useSharedValue(1);
  const refreshButtonScale = useSharedValue(1);

  useEffect(() => {
    loadUnreadAlertsCount();
  }, [data?.budgetAlerts]);

  const loadUnreadAlertsCount = async () => {
    try {
      const alertStats = await AlertService.getAlertStats();
      setUnreadAlertsCount(alertStats.unread);
    } catch (error) {
      console.error('Error loading unread alerts count:', error);
      setUnreadAlertsCount(0);
    }
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
      const isInSelectedMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                               transactionDate.getFullYear() === currentDate.getFullYear();
      
      if (!isInSelectedMonth) return false;
      
      if (filter === 'all') return true;
      return transaction.type === filter;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const onRefresh = async () => {
    setRefreshing(true);
    // Data will be refreshed automatically through context
    setRefreshing(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
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

  const handleLongPress = (transaction: Transaction) => {
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

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, data.settings.currency);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleEditTransaction(item)}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { 
            backgroundColor: getCategoryDetails(item.category, data.categories).color + '20',
            borderColor: getCategoryDetails(item.category, data.categories).color + '40'
          }
        ]}>
          <Ionicons
            name={getCategoryDetails(item.category, data.categories).icon as any}
            size={16}
            color={getCategoryDetails(item.category, data.categories).color}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'income' ? colors.primary : colors.error }
        ]}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptyDescription}>
        {filter === 'all' 
          ? 'Start by adding your first transaction'
          : `No ${filter} transactions found`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="receipt" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Transactions</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Alerts')}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.white} />
                {unreadAlertsCount > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(400)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
            onPress={() => setFilter('income')}
          >
            <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
            onPress={() => setFilter('expense')}
          >
            <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionsContainer}>
            {filteredTransactions.map((item) => (
              <View key={item.id}>
                {renderTransaction({ item })}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
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
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  alertBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Account for tab bar
  },
  transactionsContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Date Navigation
  dateNavigationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
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
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionCategory: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    minHeight: 300,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default TransactionsScreen;
