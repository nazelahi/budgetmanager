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
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { 
  Account, 
  addAccount, 
  updateAccount, 
  deleteAccount, 
  setDefaultAccount,
  toggleAccountActive,
  addTransfer,
  getTotalBalance,
  getCreditCardDebt,
  getAvailableCredit
} from '../store/slices/accountsSlice';

const AccountsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { accounts, transfers, defaultAccountId } = useSelector((state: RootState) => state.accounts);
  const { user } = useSelector((state: RootState) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'checking' | 'savings' | 'credit'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const getAccountTypeIcon = (type: Account['type']) => {
    switch (type) {
      case 'checking': return 'card';
      case 'savings': return 'wallet';
      case 'credit_card': return 'credit-card';
      case 'investment': return 'trending-up';
      case 'cash': return 'cash';
      default: return 'card';
    }
  };

  const getAccountTypeColor = (type: Account['type']) => {
    switch (type) {
      case 'checking': return colors.primary;
      case 'savings': return colors.success;
      case 'credit_card': return colors.error;
      case 'investment': return colors.warning;
      case 'cash': return colors.info;
      default: return colors.gray500;
    }
  };

  const getAccountTypeText = (type: Account['type']) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit_card': return 'Credit Card';
      case 'investment': return 'Investment';
      case 'cash': return 'Cash';
      default: return type;
    }
  };

  const filteredAccounts = accounts.filter(account => {
    switch (filter) {
      case 'all':
        return true;
      case 'active':
        return account.isActive;
      case 'checking':
        return account.type === 'checking';
      case 'savings':
        return account.type === 'savings';
      case 'credit':
        return account.type === 'credit_card';
      default:
        return true;
    }
  });

  const totalBalance = getTotalBalance(accounts);
  const creditCardDebt = getCreditCardDebt(accounts);
  const availableCredit = getAvailableCredit(accounts);

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account? All related data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteAccount(account.id)),
        },
      ]
    );
  };

  const handleSetDefault = (account: Account) => {
    dispatch(setDefaultAccount(account.id));
  };

  const handleToggleActive = (account: Account) => {
    dispatch(toggleAccountActive(account.id));
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const typeColor = getAccountTypeColor(item.type);
    const typeIcon = getAccountTypeIcon(item.type);
    const typeText = getAccountTypeText(item.type);

    return (
      <Card style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={styles.accountLeft}>
            <View
              style={[
                styles.accountIcon,
                { backgroundColor: typeColor + '20' },
              ]}
            >
              <Ionicons
                name={typeIcon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={typeColor}
              />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountType}>{typeText}</Text>
              {item.bankName && (
                <Text style={styles.accountBank}>{item.bankName}</Text>
              )}
              {item.accountNumber && (
                <Text style={styles.accountNumber}>{item.accountNumber}</Text>
              )}
            </View>
          </View>
          <View style={styles.accountRight}>
            <Text
              style={[
                styles.accountBalance,
                { color: item.balance < 0 ? colors.error : colors.textPrimary },
              ]}
            >
              {formatCurrency(item.balance)}
            </Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        </View>

        {item.type === 'credit_card' && item.creditLimit && (
          <View style={styles.creditInfo}>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Credit Limit</Text>
              <Text style={styles.creditValue}>
                {formatCurrency(item.creditLimit)}
              </Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Available Credit</Text>
              <Text style={styles.creditValue}>
                {formatCurrency(item.creditLimit + item.balance)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.accountActions}>
          <Button
            title="Transfer"
            onPress={() => {
              setSelectedAccount(item);
              setShowTransferModal(true);
            }}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Edit"
            onPress={() => {
              setSelectedAccount(item);
              setShowEditModal(true);
            }}
            variant="outline"
            style={styles.actionButton}
          />
          {!item.isDefault && (
            <Button
              title="Set Default"
              onPress={() => handleSetDefault(item)}
              variant="gradient"
              gradient="primary"
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No accounts found</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Add your first account to start tracking your finances'
          : `No ${filter} accounts found`}
      </Text>
      <Button
        title="Add Account"
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
        title="Accounts"
        subtitle={`${accounts.length} accounts • ${formatCurrency(totalBalance)} total`}
        rightComponent={
          <Button
            title="Add Account"
            onPress={() => setShowAddModal(true)}
            gradient="primary"
            style={styles.addButton}
          />
        }
        variant="gradient"
      />

      {/* Financial Overview */}
      <View style={styles.overviewSection}>
        <LinearGradient
          colors={gradients.primary as [string, string]}
          style={styles.overviewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewTitle}>Total Balance</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(totalBalance)}</Text>
            
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Credit Debt</Text>
                <Text style={styles.statValue}>{formatCurrency(creditCardDebt)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Available Credit</Text>
                <Text style={styles.statValue}>{formatCurrency(availableCredit)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Modern Tab Filters */}
      <View style={styles.filters}>
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: 'All', icon: 'list' },
            { key: 'active', label: 'Active', icon: 'play-circle' },
            { key: 'checking', label: 'Checking', icon: 'card' },
            { key: 'savings', label: 'Savings', icon: 'wallet' },
            { key: 'credit', label: 'Credit', icon: 'card' },
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

      {/* Accounts List */}
      <FlatList
        data={filteredAccounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Add Account"
            rightComponent={
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Add a new account to track your finances
            </Text>
            
            {/* Account creation form would go here */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Account Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Main Checking"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Account Type</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Checking"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Initial Balance</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <Button
              title="Add Account"
              onPress={() => {
                // Handle account creation
                setShowAddModal(false);
              }}
              gradient="primary"
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Transfer Money"
            rightComponent={
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Transfer money between your accounts
            </Text>
            
            {/* Transfer form would go here */}
            <Button
              title="Transfer"
              onPress={() => {
                // Handle transfer
                setShowTransferModal(false);
              }}
              gradient="primary"
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Edit Account"
            rightComponent={
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            {selectedAccount && (
              <>
                <Text style={styles.modalSubtitle}>
                  Edit "{selectedAccount.name}"
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
  overviewSection: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['4'],
  },
  overviewGradient: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['6'],
    ...shadows.lg,
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing['2'],
  },
  overviewAmount: {
    ...typography.textStyles.displaySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['6'],
  },
  overviewStats: {
    flexDirection: 'row',
    gap: spacing['6'],
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing['1'],
  },
  statValue: {
    ...typography.textStyles.headline6,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
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
  accountCard: {
    marginBottom: spacing.md,
    padding: spacing['5'],
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  accountType: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing['0.5'],
  },
  accountBank: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
    marginBottom: spacing['0.5'],
  },
  accountNumber: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    ...typography.textStyles.headline6,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    ...typography.textStyles.caption,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  creditInfo: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  creditLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  creditValue: {
    ...typography.textStyles.bodySmall,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  accountActions: {
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

export default AccountsScreen;
