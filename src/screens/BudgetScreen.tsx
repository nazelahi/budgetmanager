import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
  Switch,
  Dimensions,
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
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, formatCurrencyAmount, getCurrencySymbol } from '../utils/theme';
import { AnimatedCard } from '../components/AnimatedComponents';
import { Budget, BudgetStats, Category } from '../types';
import StorageService from '../services/StorageService';
import BudgetService from '../services/BudgetService';

const { height: screenHeight } = Dimensions.get('window');

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, refreshData } = useApp();
  const insets = useSafeAreaInsets();
  
  const [budgetStats, setBudgetStats] = useState<BudgetStats | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  // Form state for add/edit budget
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly',
    isActive: true,
  });

  // Animation values
  const modalTranslateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    loadBudgetData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (showAddModal || showEditModal) {
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(300, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [showAddModal, showEditModal]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [budgetsData, stats] = await Promise.all([
        StorageService.getBudgets(),
        BudgetService.getBudgetStats(selectedPeriod),
      ]);
      
      setBudgets(budgetsData.filter(b => b.period === selectedPeriod));
      setBudgetStats(stats);
      
      // Check for budget alerts
      await BudgetService.checkBudgetAlerts();
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    setFormData({
      categoryId: '',
      amount: '',
      period: selectedPeriod,
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
      period: budget.period,
      isActive: budget.isActive,
    });
    setShowEditModal(true);
  };

  const handleSaveBudget = async () => {
    if (!formData.categoryId || !formData.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const category = data.categories.find(c => c.id === formData.categoryId);
      if (!category) {
        Alert.alert('Error', 'Category not found');
        return;
      }

      const budgetData = {
        categoryId: formData.categoryId,
        categoryName: category.name,
        amount,
        period: formData.period,
        isActive: formData.isActive,
      };

      if (showEditModal && selectedBudget) {
        await StorageService.updateBudget(selectedBudget.id, budgetData);
      } else {
        await StorageService.addBudget(budgetData);
      }

      await refreshData();
      await loadBudgetData();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBudget(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${budget.categoryName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteBudget(budget.id);
              await refreshData();
              await loadBudgetData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowCategoryPicker(false);
    setSelectedBudget(null);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, data?.settings?.currency || 'USD');
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return colors.error;
    if (percentage >= 80) return colors.warning || '#FFA500';
    if (percentage >= 50) return colors.primary;
    return colors.success || '#4CAF50';
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const expenseCategories = data?.categories.filter(c => c.type === 'expense') || [];

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="wallet" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Budget Management</Text>
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

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Toggle */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.periodToggle}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'monthly' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'monthly' && styles.periodButtonTextActive
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'yearly' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'yearly' && styles.periodButtonTextActive
            ]}>
              Yearly
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Budget Summary */}
        {budgetStats && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.summaryContainer}>
            <AnimatedCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Budget Overview</Text>
                <View style={[
                  styles.summaryStatus,
                  { backgroundColor: budgetStats.isOverBudget ? colors.error + '20' : colors.primary + '20' }
                ]}>
                  <Ionicons 
                    name={budgetStats.isOverBudget ? 'warning' : 'checkmark-circle'} 
                    size={16} 
                    color={budgetStats.isOverBudget ? colors.error : colors.primary} 
                  />
                  <Text style={[
                    styles.summaryStatusText,
                    { color: budgetStats.isOverBudget ? colors.error : colors.primary }
                  ]}>
                    {budgetStats.isOverBudget ? 'Over Budget' : 'On Track'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{formatCurrency(budgetStats.totalBudgeted)}</Text>
                  <Text style={styles.summaryStatLabel}>Budgeted</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{formatCurrency(budgetStats.totalSpent)}</Text>
                  <Text style={styles.summaryStatLabel}>Spent</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={[
                    styles.summaryStatValue,
                    { color: budgetStats.remaining >= 0 ? colors.primary : colors.error }
                  ]}>
                    {formatCurrency(budgetStats.remaining)}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Remaining</Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(budgetStats.percentageUsed, 100)}%`,
                        backgroundColor: getProgressColor(budgetStats.percentageUsed, budgetStats.isOverBudget)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {budgetStats.percentageUsed.toFixed(1)}% used
                </Text>
              </View>
            </AnimatedCard>
          </Animated.View>
        )}

        {/* Budget List */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.budgetListContainer}>
          <View style={styles.budgetListHeader}>
            <Text style={styles.budgetListTitle}>Budget Categories</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddBudget}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {budgets.length === 0 ? (
            <Animated.View entering={FadeIn.delay(500)} style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No budgets set</Text>
              <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking spending</Text>
            </Animated.View>
          ) : (
            budgets.map((budget, index) => {
              const categoryStats = budgetStats?.categories.find(c => c.categoryId === budget.categoryId);
              const percentage = categoryStats?.percentageUsed || 0;
              const isOverBudget = categoryStats?.isOverBudget || false;

              return (
                <AnimatedCard 
                  key={budget.id} 
                  style={styles.budgetCard}
                  delay={500 + (index * 100)}
                >
                  <TouchableOpacity
                    style={styles.budgetCardContent}
                    onPress={() => handleEditBudget(budget)}
                    onLongPress={() => handleDeleteBudget(budget)}
                  >
                    <View style={styles.budgetCardLeft}>
                      <View style={styles.budgetIcon}>
                        <Ionicons 
                          name={data.categories.find(c => c.id === budget.categoryId)?.icon as any || 'pricetag'} 
                          size={20} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.budgetInfo}>
                        <Text style={styles.budgetCategoryName}>{budget.categoryName}</Text>
                        <Text style={styles.budgetAmount}>{formatCurrency(budget.amount)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.budgetCardRight}>
                      <View style={styles.budgetProgress}>
                        <View style={styles.budgetProgressBar}>
                          <View 
                            style={[
                              styles.budgetProgressFill,
                              {
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: getProgressColor(percentage, isOverBudget)
                              }
                            ]}
                          />
                        </View>
                        <Text style={[
                          styles.budgetPercentage,
                          { color: getProgressColor(percentage, isOverBudget) }
                        ]}>
                          {percentage.toFixed(0)}%
                        </Text>
                      </View>
                      <Text style={styles.budgetSpent}>
                        {formatCurrency(categoryStats?.spent || 0)} spent
                      </Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedCard>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* Add/Edit Budget Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <Animated.View style={[styles.modalBackdrop, animatedBackdropStyle]}>
          <Pressable style={styles.modalBackdropPressable} onPress={handleCloseModal} />
          
          <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
            {/* Header with handle */}
            <View style={styles.modalHeader}>
              <View style={styles.handle} />
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {showEditModal ? 'Edit Budget' : 'Add Budget'}
                </Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveBudget}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Category Selection */}
              <Animated.View entering={SlideInUp.delay(100)} style={[styles.section, styles.firstSection]}>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  {formData.categoryId ? (
                    <View style={[styles.selectedCategoryIcon, { backgroundColor: expenseCategories.find(cat => cat.id === formData.categoryId)?.color || colors.primary }]}>
                      <Ionicons 
                        name={expenseCategories.find(cat => cat.id === formData.categoryId)?.icon as any || 'pricetag'} 
                        size={16} 
                        color={colors.white} 
                      />
                    </View>
                  ) : (
                    <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                  )}
                  <View style={styles.selectedCategoryInfo}>
                    <Text style={[styles.categoryText, !formData.categoryId && styles.placeholderText]}>
                      {formData.categoryId ? 
                        expenseCategories.find(cat => cat.id === formData.categoryId)?.name || 'Select a category' 
                        : 'Select a category'
                      }
                    </Text>
                    {formData.categoryId && (
                      <Text style={styles.selectedCategoryType}>
                        {expenseCategories.find(cat => cat.id === formData.categoryId)?.type === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    )}
                  </View>
                  <Ionicons 
                    name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                
                {showCategoryPicker && (
                  <Animated.View entering={FadeIn} style={styles.categoryPicker}>
                    <ScrollView 
                      style={styles.categoryScrollView}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {expenseCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.categoryOption, formData.categoryId === category.id && styles.categoryOptionSelected]}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, categoryId: category.id }));
                            setShowCategoryPicker(false);
                          }}
                        >
                          <View style={[styles.categoryOptionIcon, { backgroundColor: category.color }]}>
                            <Ionicons 
                              name={category.icon as any} 
                              size={16} 
                              color={colors.white} 
                            />
                          </View>
                          <View style={styles.categoryOptionInfo}>
                            <Text style={[styles.categoryOptionName, formData.categoryId === category.id && styles.categoryOptionNameSelected]}>
                              {category.name}
                            </Text>
                            <Text style={[styles.categoryOptionType, formData.categoryId === category.id && styles.categoryOptionTypeSelected]}>
                              {category.type === 'income' ? 'Income' : 'Expense'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Amount Input */}
              <Animated.View entering={SlideInUp.delay(200)} style={styles.section}>
                <View style={styles.amountContainer}>
                  <View style={styles.currencyContainer}>
                  <Text style={styles.currencySymbol}>
                    {getCurrencySymbol(data.settings.currency)}
                  </Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    value={formData.amount}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    selectionColor={colors.primary}
                  />
                </View>
              </Animated.View>

              {/* Period Selection */}
              <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
                <View style={styles.periodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      formData.period === 'monthly' && styles.periodBtnActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, period: 'monthly' }))}
                  >
                    <Ionicons 
                      name="calendar-outline" 
                      size={16} 
                      color={formData.period === 'monthly' ? colors.white : colors.primary} 
                    />
                    <Text style={[
                      styles.periodBtnText,
                      formData.period === 'monthly' && styles.periodBtnTextActive
                    ]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.periodBtn,
                      formData.period === 'yearly' && styles.periodBtnActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, period: 'yearly' }))}
                  >
                    <Ionicons 
                      name="calendar" 
                      size={16} 
                      color={formData.period === 'yearly' ? colors.white : colors.primary} 
                    />
                    <Text style={[
                      styles.periodBtnText,
                      formData.period === 'yearly' && styles.periodBtnTextActive
                    ]}>
                      Yearly
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Active Toggle */}
              <Animated.View entering={SlideInUp.delay(400)} style={styles.section}>
                <View style={styles.inputContainer}>
                  <Ionicons name="toggle-outline" size={18} color={colors.primary} />
                  <Text style={styles.toggleLabel}>Active Budget</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={formData.isActive ? colors.white : colors.textSecondary}
                    style={styles.toggleSwitch}
                  />
                </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: 100,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: 4,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  summaryContainer: {
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  summaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  summaryStatusText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  summaryStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  budgetListContainer: {
    marginTop: spacing.sm,
  },
  budgetListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetListTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
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
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  budgetAmount: {
    ...typography.caption,
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
    ...typography.caption,
    fontWeight: '600',
  },
  budgetSpent: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Modal styles - consistent with AddTransactionModal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdropPressable: {
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
  modalHeader: {
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
    marginBottom: spacing.md,
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
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
  },
  firstSection: {
    marginTop: spacing.sm,
  },
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
  selectedCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryInfo: {
    flex: 1,
  },
  categoryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  selectedCategoryType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryPicker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    maxHeight: 200,
    ...shadows.md,
  },
  categoryScrollView: {
    maxHeight: 200,
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
  categoryOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionInfo: {
    flex: 1,
  },
  categoryOptionName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryOptionNameSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  categoryOptionType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryOptionTypeSelected: {
    color: colors.white,
  },
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
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 3,
    ...shadows.sm,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  periodBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: colors.white,
  },
  toggleLabel: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});

export default BudgetScreen;
