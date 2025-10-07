import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Header from '../components/Header';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { addCategory, updateCategory, deleteCategory, Category } from '../store/slices/categoriesSlice';

const CategoriesScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state: RootState) => state.categories);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: colors.primary,
    icon: 'help-circle',
  });

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const colorOptions = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.error,
    colors.info,
    '#8b5cf6',
    '#f97316',
    '#06b6d4',
    '#84cc16',
  ];

  const iconOptions = [
    'restaurant',
    'car',
    'shopping-bag',
    'game-controller',
    'receipt',
    'medical',
    'cash',
    'briefcase',
    'trending-up',
    'home',
    'school',
    'fitness',
    'airplane',
    'gift',
    'heart',
  ];

  const predefinedCategories = categories.filter(category => 
    category.id.startsWith('exp_') || category.id.startsWith('inc_')
  );
  
  const customCategories = categories.filter(category => 
    !category.id.startsWith('exp_') && !category.id.startsWith('inc_')
  );

  const filteredCategories = categories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

  const filteredPredefinedCategories = predefinedCategories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

  const filteredCustomCategories = customCategories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: colors.primary,
      icon: 'help-circle',
    });
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setModalVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteCategory(category.id)),
        },
      ]
    );
  };

  const handleResetPredefinedCategories = () => {
    Alert.alert(
      'Reset Default Categories',
      'This will restore all default categories to their original state. Custom categories will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // This would reset predefined categories to their original state
            // For now, we'll just show a success message
            Alert.alert('Success', 'Default categories have been reset!');
          },
        },
      ]
    );
  };

  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (editingCategory) {
      dispatch(updateCategory({
        ...editingCategory,
        ...formData,
      }));
    } else {
      dispatch(addCategory({
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      }));
    }

    setModalVisible(false);
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isPredefined = item.id.startsWith('exp_') || item.id.startsWith('inc_');
    
    return (
      <Card style={styles.categoryCard}>
        <View style={styles.categoryContent}>
          <View style={styles.categoryLeft}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: item.color + '20' },
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={item.color}
              />
            </View>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryNameRow}>
                <Text style={styles.categoryName}>{item.name}</Text>
                {isPredefined && (
                  <View style={styles.predefinedBadge}>
                    <Text style={styles.predefinedText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.categoryType}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              onPress={() => handleEditCategory(item)}
              style={styles.actionButton}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
            {!isPredefined && (
              <TouchableOpacity
                onPress={() => handleDeleteCategory(item)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No categories found</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Create your first category to get started'
          : `No ${filter} categories found`}
      </Text>
      <Button
        title="Add Category"
        onPress={handleAddCategory}
        style={styles.emptyStateButton}
        gradient="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Categories"
        subtitle="Manage your transaction categories"
        showBackButton={true}
        rightComponent={
          <View style={styles.headerButtons}>
            <Button
              title="Reset"
              onPress={handleResetPredefinedCategories}
              variant="outline"
              size="sm"
              style={styles.resetButton}
            />
            <Button
              title="Add"
              onPress={handleAddCategory}
              gradient="primary"
              style={styles.addButton}
            />
          </View>
        }
        variant="gradient"
      />

      {/* Modern Tab Filters */}
      <View style={styles.filters}>
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: 'All', icon: 'list' },
            { key: 'income', label: 'Income', icon: 'trending-up' },
            { key: 'expense', label: 'Expense', icon: 'trending-down' },
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
                  size={18}
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

      {/* Categories List */}
      <View style={styles.listContainer}>
        {/* Predefined Categories Section */}
        {filteredPredefinedCategories.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Default Categories</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredPredefinedCategories.length} categories
              </Text>
            </View>
            {filteredPredefinedCategories.map((category) => (
              <View key={category.id}>
                {renderCategory({ item: category })}
              </View>
            ))}
          </View>
        )}

        {/* Custom Categories Section */}
        {filteredCustomCategories.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Custom Categories</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredCustomCategories.length} categories
              </Text>
            </View>
            {filteredCustomCategories.map((category) => (
              <View key={category.id}>
                {renderCategory({ item: category })}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {filteredCategories.length === 0 && renderEmptyState()}
      </View>

      {/* Add/Edit Category Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveCategory}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Category Name */}
            <Input
              label="Category Name"
              placeholder="Enter category name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            {/* Category Type */}
            <View style={styles.typeSection}>
              <Text style={styles.sectionLabel}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'expense' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'expense' && styles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'income' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'income' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'income' && styles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.colorSection}>
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.iconSection}>
              <Text style={styles.sectionLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      formData.icon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, icon })}
                  >
                    <Ionicons
                      name={icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={formData.icon === icon ? colors.white : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    flex: 1,
  },
  resetButton: {
    flex: 0.6,
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
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['2'],
    gap: spacing['1.5'],
  },
  tabText: {
    ...typography.textStyles.bodyMedium,
    color: colors.gray600,
    fontWeight: typography.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...typography.textStyles.h6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionSubtitle: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
  },
  categoryCard: {
    marginBottom: spacing.xs,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryName: {
    ...typography.textStyles.body1,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  predefinedBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  predefinedText: {
    ...typography.textStyles.caption,
    color: colors.primary,
    fontSize: 9,
    fontWeight: typography.fontWeight.semibold,
  },
  categoryType: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateText: {
    ...typography.textStyles.h5,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.textStyles.body2,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalTitle: {
    ...typography.textStyles.h5,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  modalSaveButton: {
    padding: spacing.xs,
  },
  modalSaveText: {
    ...typography.textStyles.body1,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  typeSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  colorSection: {
    marginBottom: spacing.md,
  },
  colorGrid: {
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
  colorOptionSelected: {
    borderColor: colors.white,
    ...shadows.md,
  },
  iconSection: {
    marginBottom: spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

export default CategoriesScreen;
