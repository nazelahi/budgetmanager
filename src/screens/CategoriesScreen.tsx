import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Platform,
  ScrollView,
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
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import { Category } from '../types';

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, addCategory, updateCategory, deleteCategory } = useApp();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [categoryColor, setCategoryColor] = useState(colors.primary);
  const [categoryIcon, setCategoryIcon] = useState('pricetag');

  // Animation values for header buttons
  const addButtonScale = useSharedValue(1);
  const addButtonRotation = useSharedValue(0);



  const colorOptions = [
    { id: 'primary', color: colors.primary },
    { id: 'secondary', color: colors.secondary },
    { id: 'accent', color: colors.accent },
    { id: 'error', color: colors.error },
    { id: 'warning', color: colors.warning },
    { id: 'info', color: colors.info },
    { id: 'purple', color: '#9C27B0' },
    { id: 'brown', color: '#795548' },
    { id: 'blue-gray', color: '#607D8B' },
    { id: 'pink', color: '#E91E63' },
  ];

  const iconOptions = [
    'pricetag',
    'briefcase',
    'restaurant',
    'car',
    'bag',
    'film',
    'receipt',
    'medical',
    'school',
    'home',
    'heart',
    'star',
    'gift',
    'card',
    'cash',
  ];

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('expense');
    setCategoryColor(colors.primary);
    setCategoryIcon('pricetag');
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryColor(category.color);
    setCategoryIcon(category.icon);
    setModalVisible(true);
  };


  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          type: categoryType,
          color: categoryColor,
          icon: categoryIcon,
        });
      } else {
        await addCategory({
          name: categoryName.trim(),
          type: categoryType,
          color: categoryColor,
          icon: categoryIcon,
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will also remove all transactions in this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(category.id),
        },
      ]
    );
  };

  // Animated styles for header buttons
  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: addButtonScale.value },
      { rotate: `${addButtonRotation.value}deg` },
    ],
  }));

  // Button press handlers with animations
  const handleAddPress = () => {
    addButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    addButtonRotation.value = withSequence(
      withTiming(360, { duration: 300 }),
      withTiming(0, { duration: 0 })
    );
    handleAddCategory();
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(500 + (index * 100))}
      style={styles.categoryItem}
    >
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={20} color={colors.white} />
        </View>
        <View>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryType}>
            {item.type === 'income' ? 'Income' : 'Expense'}
          </Text>
        </View>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditCategory(item)}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteCategory(item)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(600)} style={styles.emptyState}>
      <Ionicons name="grid-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No Categories</Text>
      <Text style={styles.emptyDescription}>
        Add categories to organize your transactions
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header with Animated Buttons */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="grid" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Categories</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(400)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={BounceIn.delay(500)} style={addButtonAnimatedStyle}>
              <TouchableOpacity
                style={[styles.headerButton, styles.addButton]}
                onPress={handleAddPress}
              >
                <Ionicons name="add-outline" size={18} color={colors.white} />
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
        {data.categories.length > 0 ? (
          <View style={styles.categoriesContainer}>
            {data.categories.map((item, index) => (
              <View key={item.id}>
                {renderCategory({ item, index })}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>


      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>
            <TouchableOpacity onPress={handleSaveCategory}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Category Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Category Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    categoryType === 'expense' && styles.typeButtonActive,
                    { borderColor: colors.error }
                  ]}
                  onPress={() => setCategoryType('expense')}
                >
                  <Ionicons
                    name="remove-circle"
                    size={20}
                    color={categoryType === 'expense' ? colors.white : colors.error}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    { color: categoryType === 'expense' ? colors.white : colors.error }
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    categoryType === 'income' && styles.typeButtonActive,
                    { borderColor: colors.success }
                  ]}
                  onPress={() => setCategoryType('income')}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={categoryType === 'income' ? colors.white : colors.success}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    { color: categoryType === 'income' ? colors.white : colors.success }
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {colorOptions.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption.id}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption.color },
                      categoryColor === colorOption.color && styles.colorOptionSelected
                    ]}
                    onPress={() => setCategoryColor(colorOption.color)}
                  />
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      categoryIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setCategoryIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={categoryIcon === icon ? colors.white : colors.textSecondary}
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
  addButton: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Account for tab bar
  },
  categoriesContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  categoryItem: {
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
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
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
  categoryName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryActions: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    ...typography.body,
    color: colors.white,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  saveButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
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
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.white,
    ...shadows.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    gap: spacing.sm,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
  typeButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
});

export default CategoriesScreen;
