import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Modal,
  Pressable,
  Switch,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  SlideInLeft, 
  SlideInRight,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import { FinancialAccount } from '../types';

const ACCOUNT_TYPES = [
  { type: 'cash', label: 'Cash', icon: 'cash-outline', color: '#10B981' },
  { type: 'bank', label: 'Bank Account', icon: 'card-outline', color: '#3B82F6' },
  { type: 'credit_card', label: 'Credit Card', icon: 'card', color: '#EF4444' },
  { type: 'savings', label: 'Savings', icon: 'trending-up-outline', color: '#8B5CF6' },
  { type: 'investment', label: 'Investment', icon: 'bar-chart-outline', color: '#F59E0B' },
  { type: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

const ACCOUNT_ICONS = [
  'cash-outline', 'card-outline', 'card', 'trending-up-outline', 'bar-chart-outline',
  'wallet-outline', 'bank-outline', 'home-outline', 'business-outline', 'school-outline',
  'car-outline', 'airplane-outline', 'gift-outline', 'star-outline', 'heart-outline'
];

const ACCOUNT_COLORS = [
  '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
];

const AccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, addAccount, updateAccount, deleteAccount } = useApp();
  const insets = useSafeAreaInsets();
  
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as FinancialAccount['type'],
    balance: '',
    currency: 'USD',
    color: ACCOUNT_COLORS[0],
    icon: ACCOUNT_ICONS[0],
    description: '',
    accountNumber: '',
    bankName: '',
  });

  // Animation values
  const addButtonScale = useSharedValue(1);
  const modalScale = useSharedValue(0);

  useEffect(() => {
    loadAccounts();
  }, [data]);

  const loadAccounts = () => {
    if (data?.accounts) {
      setAccounts(data.accounts.filter(account => account.isActive));
    }
  };

  const handleAddPress = () => {
    addButtonScale.value = withSpring(0.95, {}, () => {
      addButtonScale.value = withSpring(1);
    });
    setFormData({
      name: '',
      type: 'cash',
      balance: '',
      currency: 'USD',
      color: ACCOUNT_COLORS[0],
      icon: ACCOUNT_ICONS[0],
      description: '',
      accountNumber: '',
      bankName: '',
    });
    setValidationErrors({});
    setShowAddModal(true);
    modalScale.value = withSpring(1);
  };

  const handleEditPress = (account: FinancialAccount) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      currency: account.currency,
      color: account.color,
      icon: account.icon,
      description: account.description || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
    });
    setValidationErrors({});
    setShowEditModal(true);
    modalScale.value = withSpring(1);
  };

  const handleCloseModal = () => {
    modalScale.value = withTiming(0, {}, () => {
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedAccount(null);
      setFormData({
        name: '',
        type: 'cash',
        balance: '',
        currency: 'USD',
        color: ACCOUNT_COLORS[0],
        icon: ACCOUNT_ICONS[0],
        description: '',
        accountNumber: '',
        bankName: '',
      });
      setValidationErrors({});
    });
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Account name is required';
    }
    
    if (!formData.balance.trim()) {
      errors.balance = 'Initial balance is required';
    } else if (isNaN(Number(formData.balance))) {
      errors.balance = 'Balance must be a valid number';
    }
    
    if (formData.type === 'bank' && !formData.bankName.trim()) {
      errors.bankName = 'Bank name is required for bank accounts';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const accountData = {
        ...formData,
        balance: Number(formData.balance),
        isActive: true,
        createdAt: selectedAccount?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (selectedAccount) {
        await updateAccount(selectedAccount.id, accountData);
      } else {
        await addAccount(accountData);
      }
      
      handleCloseModal();
      Alert.alert('Success', `Account ${selectedAccount ? 'updated' : 'created'} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${selectedAccount ? 'update' : 'create'} account`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (account: FinancialAccount) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const getAccountTypeInfo = (type: FinancialAccount['type']) => {
    return ACCOUNT_TYPES.find(t => t.type === type) || ACCOUNT_TYPES[0];
  };

  const animatedAddStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const renderAccountCard = ({ item: account }: { item: FinancialAccount }) => {
    const typeInfo = getAccountTypeInfo(account.type);
    
    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
            <Ionicons name={account.icon as any} size={24} color={colors.white} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountType}>{typeInfo.label}</Text>
            {account.bankName && (
              <Text style={styles.accountBank}>{account.bankName}</Text>
            )}
          </View>
          <View style={styles.accountActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPress(account)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(account)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.accountBalance}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balanceAmount, { color: account.balance >= 0 ? colors.success : colors.error }]}>
            {account.currency} {account.balance.toLocaleString()}
          </Text>
        </View>
        
        {account.description && (
          <Text style={styles.accountDescription}>{account.description}</Text>
        )}
      </Animated.View>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      transparent
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
        <Animated.View style={[styles.modal, animatedModalStyle]}>
          <Text style={styles.modalTitle}>
            {selectedAccount ? 'Edit Account' : 'Add New Account'}
          </Text>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Account Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Name *</Text>
              <TextInput
                style={[styles.input, validationErrors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., My Checking Account"
                placeholderTextColor={colors.textSecondary}
              />
              {validationErrors.name && (
                <Text style={styles.errorText}>{validationErrors.name}</Text>
              )}
            </View>

            {/* Account Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Type *</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.typeOption,
                      formData.type === type.type && styles.selectedTypeOption,
                      { borderColor: type.color }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type.type as FinancialAccount['type'] }))}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={formData.type === type.type ? colors.white : type.color} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      formData.type === type.type && styles.selectedTypeOptionText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Initial Balance */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Initial Balance *</Text>
              <TextInput
                style={[styles.input, validationErrors.balance && styles.inputError]}
                value={formData.balance}
                onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              {validationErrors.balance && (
                <Text style={styles.errorText}>{validationErrors.balance}</Text>
              )}
            </View>

            {/* Currency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Currency</Text>
              <View style={styles.currencyRow}>
                <TextInput
                  style={styles.currencyInput}
                  value={formData.currency}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currency: text }))}
                  placeholder="USD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Bank Name (for bank accounts) */}
            {formData.type === 'bank' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={[styles.input, validationErrors.bankName && styles.inputError]}
                  value={formData.bankName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, bankName: text }))}
                  placeholder="e.g., Chase Bank"
                  placeholderTextColor={colors.textSecondary}
                />
                {validationErrors.bankName && (
                  <Text style={styles.errorText}>{validationErrors.bankName}</Text>
                )}
              </View>
            )}

            {/* Account Number (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.accountNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
                placeholder="Last 4 digits"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Add a description..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Color and Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color & Icon</Text>
              <View style={styles.colorIconRow}>
                <View style={styles.colorPicker}>
                  {ACCOUNT_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        formData.color === color && styles.selectedColorOption
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </View>
                <View style={styles.iconPicker}>
                  {ACCOUNT_ICONS.slice(0, 6).map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        formData.icon === icon && styles.selectedIconOption
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, icon }))}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={20} 
                        color={formData.icon === icon ? colors.white : colors.primary} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : selectedAccount ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B263B', '#0D1B2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
      >
        <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
          <Ionicons name="wallet-outline" size={18} color={colors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Financial Accounts</Text>
        </Animated.View>
        <View style={styles.headerActions}>
          <Animated.View entering={SlideInRight.delay(300)} style={animatedAddStyle}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPress}
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Total Balance Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.totalBalanceCard}>
          <View style={styles.totalBalanceHeader}>
            <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
            <Text style={styles.totalBalanceTitle}>Total Balance</Text>
          </View>
          <Text style={styles.totalBalanceAmount}>
            ${getTotalBalance().toLocaleString()}
          </Text>
          <Text style={styles.totalBalanceSubtext}>
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {/* Accounts List */}
        <View style={styles.accountsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Accounts</Text>
            <Text style={styles.sectionSubtitle}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {accounts.length > 0 ? (
            <FlatList
              data={accounts}
              renderItem={renderAccountCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No accounts yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first financial account to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddPress}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.emptyStateButtonText}>Add Account</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {renderAddModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  totalBalanceCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalBalanceTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  totalBalanceAmount: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  totalBalanceSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  accountsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  accountType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountBank: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  accountActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  accountBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  balanceAmount: {
    ...typography.h4,
    fontWeight: '700',
  },
  accountDescription: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
    ...shadows.xl,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalContent: {
    maxHeight: 400,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.backgroundSecondary,
  },
  selectedTypeOption: {
    backgroundColor: colors.primary,
  },
  typeOptionText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  selectedTypeOptionText: {
    color: colors.white,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    width: 80,
  },
  colorIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: colors.white,
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconOption: {
    backgroundColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AccountScreen;