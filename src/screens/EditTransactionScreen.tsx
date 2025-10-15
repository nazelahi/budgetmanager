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
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, gradients, getCurrencySymbol } from '../utils/theme';
import { Transaction } from '../types';
import BottomModal from '../components/BottomModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ visible, onClose, transaction }) => {
  const { data, updateTransaction } = useApp();
  
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(transaction.category);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [date, setDate] = useState(transaction.date);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const incomeCategories = data.categories.filter(c => c.type === 'income');
  const expenseCategories = data.categories.filter(c => c.type === 'expense');
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  // Quick amount buttons - more compact
  const quickAmounts = [10, 25, 50, 100, 200, 500];

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
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
      await updateTransaction(transaction.id, {
        amount: amountNum,
        description: description.trim(),
        category,
        type,
        date,
      });

      Alert.alert('Success', 'Transaction updated successfully', [
        { text: 'OK', onPress: handleClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  const handleQuickAmount = (amount: number) => {
    setAmount(amount.toString());
  };


  return (
    <BottomModal
      visible={visible}
      onClose={handleClose}
      title="Edit Transaction"
      showSaveButton={true}
      onSave={handleSave}
      saveButtonDisabled={!amount || !description || !category || loading}
      isLoading={loading}
    >

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type Toggle - Compact */}
            <Animated.View entering={SlideInUp.delay(100)} style={styles.section}>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                  onPress={() => {
                    setType('expense');
                    setCategory('');
                  }}
                >
                  <Ionicons 
                    name="remove-circle-outline" 
                    size={16} 
                    color={type === 'expense' ? colors.white : colors.error} 
                  />
                  <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
                  onPress={() => {
                    setType('income');
                    setCategory('');
                  }}
                >
                  <Ionicons 
                    name="add-circle-outline" 
                    size={16} 
                    color={type === 'income' ? colors.white : colors.success} 
                  />
                  <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Amount Input - Compact */}
            <Animated.View entering={SlideInUp.delay(200)} style={styles.section}>
              <View style={styles.amountContainer}>
                <View style={styles.currencyContainer}>
                  <Text style={styles.currencySymbol}>
                    {getCurrencySymbol(data.settings.currency)}
                  </Text>
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
              </View>
              
              {/* Quick Amounts - Compact Grid */}
              <View style={styles.quickAmounts}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountBtn}
                    onPress={() => handleQuickAmount(quickAmount)}
                  >
                    <Text style={styles.quickAmountText}>
                      {getCurrencySymbol(data.settings.currency)}{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Description - Compact */}
            <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                  placeholderTextColor={colors.textTertiary}
                  selectionColor={colors.primary}
                />
              </View>
            </Animated.View>

            {/* Category - Compact */}
            <Animated.View entering={SlideInUp.delay(400)} style={styles.section}>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                <Text style={[styles.categoryText, !category && styles.placeholderText]}>
                  {category || 'Select category'}
                </Text>
                <Ionicons 
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
              
              {showCategoryPicker && (
                <Animated.View entering={FadeIn} style={styles.categoryPicker}>
                  {currentCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, category === cat.name && styles.categoryOptionSelected]}
                      onPress={() => {
                        setCategory(cat.name);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Ionicons 
                        name="pricetag" 
                        size={14} 
                        color={category === cat.name ? colors.white : colors.primary} 
                      />
                      <Text style={[styles.categoryOptionText, category === cat.name && styles.categoryOptionTextSelected]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </Animated.View>

            {/* Date - Compact */}
            <Animated.View entering={SlideInUp.delay(500)} style={styles.section}>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  selectionColor={colors.primary}
                />
              </View>
            </Animated.View>
          </ScrollView>
          
          {/* Fixed Submit Button */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.submitContainer}
          >
            <Animated.View entering={SlideInUp.delay(600)}>
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <View style={styles.loadingContent}>
                      <Ionicons name="refresh" size={18} color={colors.white} />
                      <Text style={styles.submitText}>Updating...</Text>
                    </View>
                  ) : (
                    <View style={styles.submitContent}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                      <Text style={styles.submitText}>Update Transaction</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
    </BottomModal>
  );
};

const styles = StyleSheet.create({
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
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Type Toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 3,
    ...shadows.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  typeBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.white,
  },

  // Amount Input
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
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
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickAmountBtn: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  quickAmountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Input Container (shared for description, category, date)
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
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
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

  // Category Picker
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

  // Submit Button
  submitContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  submitBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  submitGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default EditTransactionModal;
