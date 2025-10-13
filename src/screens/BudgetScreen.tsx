import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInUp,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, formatCurrencyAmount, getCurrencySymbol } from '../utils/theme';
import { Budget } from '../types';
import BudgetService from '../services/BudgetService';
import AlertService from '../services/AlertService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, addBudget, updateBudget, deleteBudget } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Safety check - don't render if data is not loaded
  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="refresh" size={64} color={colors.gray400} />
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Animation values
  const modalTranslateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  // Animation effects
  useEffect(() => {
    if (modalVisible) {
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [modalVisible]);

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

  const resetForm = () => {
    setBudgetAmount('');
    setBudgetCategory('');
    setBudgetPeriod('monthly');
    setEditingBudget(null);
    setShowCategoryPicker(false);
    setShowPeriodPicker(false);
  };

  const handleClose = () => {
    modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(() => {
        setModalVisible(false);
        resetForm();
      })();
    });
  };

  const handleAddBudget = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditBudget = (budget: Budget) => {
    try {
      // Validate budget data
      if (!budget || !budget.id || !budget.categoryId) {
        Alert.alert('Error', 'Invalid budget data. Cannot edit this budget.');
        return;
      }

      // Check if category still exists
      const category = data?.categories?.find(c => c.id === budget.categoryId);
      if (!category) {
        Alert.alert('Error', 'Category for this budget no longer exists. Cannot edit.');
        return;
      }

      setEditingBudget(budget);
      setBudgetAmount(budget.amount.toString());
      setBudgetCategory(budget.categoryId);
      setBudgetPeriod(budget.period);
      setModalVisible(true);
    } catch (error) {
      console.error('Error opening edit budget modal:', error);
      Alert.alert('Error', 'Failed to open edit budget. Please try again.');
    }
  };

  const handleSaveBudget = async () => {
    if (saving) return; // Prevent multiple rapid taps
    
    try {
      setSaving(true);
      
      // Validate form fields
      if (!budgetAmount || !budgetCategory) {
        Alert.alert('Error', 'Please fill in all fields');
        setSaving(false);
        return;
      }

      // Validate amount
      const amount = parseFloat(budgetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        setSaving(false);
        return;
      }

      // Validate data availability
      if (!data?.categories) {
        Alert.alert('Error', 'Categories not loaded. Please try again.');
        setSaving(false);
        return;
      }
      
      // Find category and validate
      const category = data.categories.find(c => c.id === budgetCategory);
      if (!category) {
        Alert.alert('Error', 'Selected category not found');
        setSaving(false);
        return;
      }

      // Validate category type (only expense categories should have budgets)
      if (category.type !== 'expense') {
        Alert.alert('Error', 'Budgets can only be created for expense categories');
        setSaving(false);
        return;
      }

      // Calculate end date based on period
      const startDate = new Date();
      let endDate = new Date();
      
      switch (budgetPeriod) {
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
        default:
          endDate.setDate(startDate.getDate() + 30);
      }

      const budgetData = {
        categoryId: budgetCategory,
        amount,
        spent: editingBudget?.spent || 0,
        period: budgetPeriod,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await addBudget(budgetData);
      }

      handleClose();
    } catch (error) {
      console.error('Budget save error:', error);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    try {
      const categoryName = data?.categories?.find(c => c.id === budget.categoryId)?.name || 'Unknown Category';
      Alert.alert(
        'Delete Budget',
        `Are you sure you want to delete the budget for ${categoryName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteBudget(budget.id);
              } catch (error) {
                console.error('Error deleting budget:', error);
                Alert.alert('Error', 'Failed to delete budget. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing delete confirmation:', error);
      Alert.alert('Error', 'Failed to show delete confirmation. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!data?.settings?.currency) return `$${amount.toFixed(2)}`;
    return formatCurrencyAmount(amount, data.settings.currency);
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const getProgressPercentage = (budget: Budget) => {
    return BudgetService.calculateProgressPercentage(budget);
  };

  const getProgressColor = (budget: Budget) => {
    return BudgetService.getBudgetStatusColor(budget);
  };

  const renderBudget = ({ item }: { item: Budget }) => {
    const category = data?.categories?.find(c => c.id === item.categoryId);
    const percentage = getProgressPercentage(item);
    const progressColor = getProgressColor(item);

    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetLeft}>
          <View style={[styles.budgetIcon, { backgroundColor: category?.color || colors.primary }]}>
            <Ionicons name={category?.icon as any || 'wallet'} size={20} color={colors.white} />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={styles.budgetCategory}>{category?.name || 'Unknown'}</Text>
            <Text style={styles.budgetPeriod}>{item.period.charAt(0).toUpperCase() + item.period.slice(1)}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${percentage}%`, 
                      backgroundColor: progressColor 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{percentage.toFixed(0)}%</Text>
            </View>
          </View>
        </View>
        <View style={styles.budgetRight}>
          <Text style={styles.budgetAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.budgetSpent}>Spent: {formatCurrency(item.spent)}</Text>
          <View style={styles.budgetActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditBudget(item)}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteBudget(item)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No Budgets</Text>
      <Text style={styles.emptyDescription}>
        Create budgets to track your spending and stay on track
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
          style={styles.headerGradient}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="pie-chart" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Budgets</Text>
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
                <Ionicons name="settings-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(500)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleAddBudget}
              >
                <Ionicons name="add-outline" size={24} color={colors.white} />
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
      >
        {data?.budgets && data.budgets.length > 0 ? (
          <View style={styles.budgetsContainer}>
            {data.budgets.map((item) => (
              <View key={item.id}>
                {renderBudget({ item })}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
          
          <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
            {/* Compact Header */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>
                  {editingBudget ? 'Edit Budget' : 'Add Budget'}
                </Text>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSaveBudget}
                  disabled={saving}
                >
                  {saving ? (
                    <Ionicons name="refresh" size={16} color={colors.white} />
                  ) : (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Budget Amount */}
              <Animated.View entering={SlideInUp.delay(100)} style={styles.section}>
                <View style={styles.amountContainer}>
                  <View style={styles.currencyContainer}>
                    <Text style={styles.currencySymbol}>
                      {getCurrencySymbol(data?.settings?.currency || 'USD')}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    value={budgetAmount}
                    onChangeText={(text) => {
                      setBudgetAmount(formatCurrencyInput(text));
                    }}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    selectionColor={colors.primary}
                  />
                </View>
              </Animated.View>

              {/* Category */}
              <Animated.View entering={SlideInUp.delay(200)} style={styles.section}>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                  <Text style={[styles.categoryText, !budgetCategory && styles.placeholderText]}>
                    {budgetCategory ? data?.categories?.find(c => c.id === budgetCategory)?.name || 'Select category' : 'Select category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                
                {showCategoryPicker && data?.categories?.filter(category => category.type === 'expense').length > 0 && (
                  <Animated.View entering={SlideInUp} style={styles.categoryPicker}>
                    {data.categories.filter(category => category.type === 'expense').map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.categoryOption, budgetCategory === category.id && styles.categoryOptionSelected]}
                        onPress={() => {
                          setBudgetCategory(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Ionicons 
                          name={category.icon as any || "pricetag"} 
                          size={14} 
                          color={budgetCategory === category.id ? colors.white : colors.primary} 
                        />
                        <Text style={[styles.categoryOptionText, budgetCategory === category.id && styles.categoryOptionTextSelected]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </Animated.View>

              {/* Period */}
              <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowPeriodPicker(!showPeriodPicker)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.categoryText, !budgetPeriod && styles.placeholderText]}>
                    {budgetPeriod ? budgetPeriod.charAt(0).toUpperCase() + budgetPeriod.slice(1) : 'Select period'}
                  </Text>
                  <Ionicons 
                    name={showPeriodPicker ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                
                {showPeriodPicker && (
                  <Animated.View entering={SlideInUp} style={styles.categoryPicker}>
                    {['weekly', 'monthly', 'yearly'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[styles.categoryOption, budgetPeriod === period && styles.categoryOptionSelected]}
                        onPress={() => {
                          setBudgetPeriod(period as 'weekly' | 'monthly' | 'yearly');
                          setShowPeriodPicker(false);
                        }}
                      >
                        <Ionicons 
                          name="time-outline" 
                          size={14} 
                          color={budgetPeriod === period ? colors.white : colors.primary} 
                        />
                        <Text style={[styles.categoryOptionText, budgetPeriod === period && styles.categoryOptionTextSelected]}>
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 44 + spacing.xs : 24 + spacing.xs,
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
  budgetsContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  budgetItem: {
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
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
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
  budgetDetails: {
    flex: 1,
  },
  budgetCategory: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
    marginBottom: 2,
  },
  budgetPeriod: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetSpent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
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
  // Modal Container
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.9,
    ...shadows.xl,
  },

  // Header
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.sm,
  },

  // Amount Input
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  currencyContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  currencySymbol: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'right',
  },

  // Input Container (shared for category, period)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  categoryText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.textTertiary,
  },

  // Category/Period Picker
  categoryPicker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    ...shadows.md,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  categoryOptionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default BudgetScreen;
