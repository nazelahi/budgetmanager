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
import { addBudget, Budget } from '../store/slices/budgetsSlice';

const AddBudgetScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a budget name';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    
    let endDate: string;
    switch (formData.period) {
      case 'weekly':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'monthly':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];
        break;
      case 'yearly':
        endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        break;
      default:
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];
    }

    const budget: Budget = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      spent: 0,
      period: formData.period,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
    };

    dispatch(addBudget(budget));
    Alert.alert('Success', 'Budget created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Add Budget"
        showBackButton={true}
        variant="gradient"
      />
      
      <ScrollView style={styles.scrollView}>
      <View style={styles.content}>
        {/* Budget Name */}
        <Card style={styles.section}>
          <Input
            label="Budget Name"
            placeholder="Enter budget name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            error={errors.name}
          />
        </Card>

        {/* Amount */}
        <Card style={styles.section}>
          <Input
            label="Budget Amount"
            placeholder="0.00"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="numeric"
            leftIcon="cash"
            error={errors.amount}
          />
        </Card>

        {/* Period */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Period</Text>
          <View style={styles.periodButtons}>
            {[
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
              { key: 'yearly', label: 'Yearly' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.periodButton,
                  formData.period === key && styles.periodButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, period: key as any })}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    formData.period === key && styles.periodButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Category */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesGrid}>
            {expenseCategories.map((category) => (
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

        {/* Budget Preview */}
        {formData.amount && formData.category && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Preview</Text>
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Budget Name:</Text>
                <Text style={styles.previewValue}>{formData.name || 'Untitled Budget'}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Amount:</Text>
                <Text style={styles.previewValue}>
                  {formatCurrency(parseFloat(formData.amount) || 0)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Category:</Text>
                <Text style={styles.previewValue}>{formData.category}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Period:</Text>
                <Text style={styles.previewValue}>
                  {formData.period.charAt(0).toUpperCase() + formData.period.slice(1)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Create Budget"
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
  periodButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  periodButtonTextActive: {
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
  previewContent: {
    backgroundColor: colors.gray50,
    padding: spacing.sm,
    borderRadius: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  previewLabel: {
    ...typography.textStyles.body2,
    color: colors.textSecondary,
  },
  previewValue: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  submitSection: {
    paddingTop: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.xl,
  },
});

export default AddBudgetScreen;
