import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Header from '../components/Header';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { addTransaction, Transaction } from '../store/slices/transactionsSlice';

const AddTransactionScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.user);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
      category: formData.category,
      type: formData.type,
      date: formData.date,
      createdAt: new Date().toISOString(),
    };

    dispatch(addTransaction(transaction));
    Alert.alert('Success', 'Transaction added successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Add Transaction"
        showBackButton={true}
        variant="gradient"
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Transaction Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.typeButtonActive,
                { borderColor: colors.expense },
              ]}
              onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
            >
              <Ionicons
                name="trending-down"
                size={24}
                color={formData.type === 'expense' ? colors.white : colors.expense}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive,
                  { color: formData.type === 'expense' ? colors.white : colors.expense },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.typeButtonActive,
                { borderColor: colors.income },
              ]}
              onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
            >
              <Ionicons
                name="trending-up"
                size={24}
                color={formData.type === 'income' ? colors.white : colors.income}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive,
                  { color: formData.type === 'income' ? colors.white : colors.income },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Amount */}
        <Card style={styles.section}>
          <Input
            label="Amount"
            placeholder="0.00"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="numeric"
            leftIcon="cash"
            error={errors.amount}
          />
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Input
            label="Description"
            placeholder="Enter transaction description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            error={errors.description}
          />
        </Card>

        {/* Category */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  formData.category === category.name && styles.categoryButtonActive,
                  { borderColor: category.color },
                ]}
                onPress={() => setFormData({ ...formData, category: category.name })}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={category.color}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    formData.category === category.name && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </Card>

        {/* Date */}
        <Card style={styles.section}>
          <Input
            label="Date"
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            leftIcon="calendar"
          />
        </Card>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Add Transaction"
            onPress={handleSubmit}
            gradient="primary"
            style={styles.submitButton}
          />
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.textStyles.h6,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    gap: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    ...typography.textStyles.body1,
    fontWeight: typography.fontWeight.medium,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: '45%',
    marginBottom: spacing.xs,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  categoryText: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitSection: {
    paddingTop: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.xl,
  },
});

export default AddTransactionScreen;
