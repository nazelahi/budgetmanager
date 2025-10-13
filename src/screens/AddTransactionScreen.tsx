import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInUp,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, gradients, animations, getCurrencySymbol } from '../utils/theme';
import { AnimatedCard, AnimatedButton } from '../components/AnimatedComponents';
import { SimpleInput as AnimatedInput } from '../components/SimpleInput';
import { Transaction } from '../types';
import AlertService from '../services/AlertService';

const { width: screenWidth } = Dimensions.get('window');

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, addTransaction } = useApp();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const incomeCategories = data.categories.filter(c => c.type === 'income');
  const expenseCategories = data.categories.filter(c => c.type === 'expense');
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100, 250, 500];

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

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: amountNum,
        description: description.trim(),
        category,
        type,
        date,
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);

      Alert.alert('Success', 'Transaction added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  const handleQuickAmount = (amount: number) => {
    setAmount(amount.toString());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Fixed Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="add-circle" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Add Transaction</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).goBack()}
              >
                <Ionicons name="close" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >

        <View style={styles.form}>
          {/* Transaction Type - Compact Toggle */}
          <Animated.View entering={SlideInUp.delay(200)} style={styles.section}>
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={styles.typeToggle}
                onPress={() => {
                  setType('expense');
                  setCategory('');
                }}
              >
                <LinearGradient
                  colors={type === 'expense' ? gradients.error : [colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeToggleGradient}
                >
                  <Ionicons 
                    name="remove-circle" 
                    size={18} 
                    color={type === 'expense' ? colors.white : colors.error} 
                  />
                  <Text style={[
                    styles.typeToggleText,
                    type === 'expense' && styles.typeToggleTextActive
                  ]}>
                    Expense
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.typeToggle}
                onPress={() => {
                  setType('income');
                  setCategory('');
                }}
              >
                <LinearGradient
                  colors={type === 'income' ? gradients.success : [colors.surface, colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeToggleGradient}
                >
                  <Ionicons 
                    name="add-circle" 
                    size={18} 
                    color={type === 'income' ? colors.white : colors.success} 
                  />
                  <Text style={[
                    styles.typeToggleText,
                    type === 'income' && styles.typeToggleTextActive
                  ]}>
                    Income
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Amount Input - Colorful */}
          <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.amountContainer}
            >
              <View style={styles.currencySymbolContainer}>
                <LinearGradient
                  colors={gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.currencySymbolGradient}
                >
                  <Text style={styles.currencySymbol}>
                    {getCurrencySymbol(data.settings.currency)}
                  </Text>
                </LinearGradient>
              </View>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => setAmount(formatCurrency(text))}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.primary}
              />
            </LinearGradient>
            
            {/* Quick Amount Buttons - Colorful */}
            <View style={styles.quickAmountsContainer}>
              {quickAmounts.map((quickAmount, index) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(quickAmount)}
                >
                  <LinearGradient
                    colors={[
                      gradients.primary[0] + '20',
                      gradients.primary[1] + '20'
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickAmountGradient}
                  >
                    <Text style={styles.quickAmountText}>
                      {getCurrencySymbol(data.settings.currency)}{quickAmount}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Description - Colorful */}
          <Animated.View entering={SlideInUp.delay(400)} style={styles.section}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.descriptionContainer}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this for?"
                placeholderTextColor={colors.textTertiary}
                multiline={false}
                selectionColor={colors.primary}
              />
            </LinearGradient>
          </Animated.View>

          {/* Category - Colorful Picker */}
          <Animated.View entering={SlideInUp.delay(500)} style={styles.section}>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <LinearGradient
                colors={[colors.surface, colors.surfaceSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonGradient}
              >
                <View style={styles.categoryButtonContent}>
                  <Ionicons name="list-outline" size={20} color={colors.primary} />
                  <Text style={[
                    styles.categoryButtonText,
                    !category && styles.categoryButtonPlaceholder
                  ]}>
                    {category || 'Select category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.primary} 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <Animated.View entering={FadeIn} style={styles.categoryPicker}>
                {currentCategories.map((cat, index) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      category === cat.name && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setCategory(cat.name);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <LinearGradient
                      colors={category === cat.name ? gradients.primary : [colors.surface, colors.surface]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryOptionGradient}
                    >
                      <Ionicons 
                        name="pricetag" 
                        size={16} 
                        color={category === cat.name ? colors.white : colors.primary} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        category === cat.name && styles.categoryOptionTextSelected
                      ]}>
                        {cat.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          {/* Date - Colorful */}
          <Animated.View entering={SlideInUp.delay(600)} style={styles.section}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dateContainer}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.primary}
              />
            </LinearGradient>
          </Animated.View>

          {/* Submit Button - Colorful */}
          <Animated.View entering={SlideInUp.delay(700)} style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View style={styles.loadingSpinner}>
                      <Ionicons name="refresh" size={24} color={colors.white} />
                    </Animated.View>
                    <Text style={styles.submitButtonText}>Adding Transaction...</Text>
                  </View>
                ) : (
                  <View style={styles.submitContent}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                    <Text style={styles.submitButtonText}>Add Transaction</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10, // Reduced since header is now fixed
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  

  // Form
  form: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // Transaction Type Toggle
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: 3,
    marginHorizontal: spacing.xs,
    ...shadows.md,
  },
  typeToggle: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  typeToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  typeToggleText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    fontSize: 13,
  },
  typeToggleTextActive: {
    color: colors.white,
  },

  // Amount Input
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    ...shadows.md,
    marginBottom: spacing.sm,
  },
  currencySymbolContainer: {
    marginRight: spacing.md,
  },
  currencySymbolGradient: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  currencySymbol: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'right',
    paddingVertical: spacing.xs,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  quickAmountButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  quickAmountGradient: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  quickAmountText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },

  // Description Input
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    ...shadows.md,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  descriptionInput: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
    paddingVertical: spacing.xs,
    minHeight: 20,
  },

  // Category Picker
  categoryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
    ...shadows.md,
  },
  categoryButtonGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButtonText: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  categoryButtonPlaceholder: {
    color: colors.textTertiary,
  },
  categoryPicker: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
    ...shadows.lg,
    overflow: 'hidden',
  },
  categoryOption: {
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    overflow: 'hidden',
  },
  categoryOptionSelected: {
    ...shadows.sm,
  },
  categoryOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryOptionText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },

  // Date Input
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    ...shadows.md,
  },
  dateInput: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
    paddingVertical: spacing.xs,
    minHeight: 20,
  },

  // Submit Button
  submitContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingSpinner: {
    // Add rotation animation here if needed
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
});

export default AddTransactionScreen;
