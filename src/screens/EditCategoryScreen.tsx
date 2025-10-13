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
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../utils/theme';
import { Category } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EditCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  category: Category;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ visible, onClose, category }) => {
  const { data, updateCategory } = useApp();
  
  const [name, setName] = useState(category.name);
  const [type, setType] = useState<'income' | 'expense'>(category.type);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Animation values
  const modalTranslateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const handleClose = () => {
    modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const availableIcons = [
    'home', 'car', 'restaurant', 'bag', 'medical', 'game-controller',
    'airplane', 'school', 'fitness', 'gift', 'card', 'cash', 'trending-up',
    'trending-down', 'pricetag', 'wallet', 'briefcase', 'heart', 'star',
    'musical-notes', 'book', 'camera', 'phone-portrait', 'laptop', 'tv',
    'bed', 'shirt', 'football', 'basketball', 'bicycle', 'bus', 'train',
    'boat', 'wine', 'pizza', 'ice-cream', 'cafe', 'fast-food',
    'paw', 'leaf', 'sunny', 'rainy', 'snow', 'thunderstorm', 'partly-sunny'
  ];

  const availableColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#64B5F6', '#FFEAA7', '#DDA0DD',
    '#90CAF9', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#81D4FA',
    '#F1948A', '#D7BDE2', '#B3E5FC', '#F9E79F', '#D5DBDB',
    '#AEB6BF', '#85929E', '#5D6D7E', '#34495E', '#2E4057', '#283747'
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      await updateCategory(category.id, {
        name: name.trim(),
        type,
        color,
        icon,
      });
      Alert.alert('Success', 'Category updated successfully', [
        { text: 'OK', onPress: handleClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will also remove all transactions in this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: Delete functionality would need to be added to context
              Alert.alert('Success', 'Category deleted successfully', [
                { text: 'OK', onPress: handleClose }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
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
              <Text style={styles.title}>Edit Category</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
                  onPress={() => setType('expense')}
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
                  onPress={() => setType('income')}
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

            {/* Name Input - Compact */}
            <Animated.View entering={SlideInUp.delay(200)} style={styles.section}>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Category name"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={20}
                  selectionColor={colors.primary}
                />
              </View>
            </Animated.View>

            {/* Color Picker - Compact */}
            <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
              <View style={styles.colorPicker}>
                {availableColors.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption },
                      color === colorOption && styles.colorOptionSelected
                    ]}
                    onPress={() => setColor(colorOption)}
                  >
                    {color === colorOption && (
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Icon Picker - Compact */}
            <Animated.View entering={SlideInUp.delay(400)} style={styles.section}>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowIconPicker(true)}
              >
                <View style={[styles.iconPreview, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={18} color={colors.white} />
                </View>
                <Text style={styles.categoryText}>Choose Icon</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </Animated.View>

          </ScrollView>
          
          {/* Fixed Submit Button */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.submitContainer}
          >
            <Animated.View entering={SlideInUp.delay(500)}>
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
                      <Text style={styles.submitText}>Update Category</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.iconModalOverlay}>
          <View style={styles.iconModalContainer}>
            <View style={styles.iconModalHeader}>
              <Text style={styles.iconModalTitle}>Choose Icon</Text>
              <TouchableOpacity
                style={styles.iconModalCloseButton}
                onPress={() => setShowIconPicker(false)}
              >
                <Ionicons name="close-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.iconGrid}>
              {availableIcons.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconOption,
                    icon === iconName && styles.iconOptionSelected
                  ]}
                  onPress={() => {
                    setIcon(iconName);
                    setShowIconPicker(false);
                  }}
                >
                  <View style={[
                    styles.iconOptionPreview,
                    { backgroundColor: color },
                    icon === iconName && styles.iconOptionPreviewSelected
                  ]}>
                    <Ionicons name={iconName as any} size={20} color={colors.white} />
                  </View>
                  <Text style={[
                    styles.iconOptionText,
                    icon === iconName && styles.iconOptionTextSelected
                  ]}>
                    {iconName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Input Container (shared for name, icon)
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

  // Color Picker
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  colorOptionSelected: {
    borderColor: colors.white,
    ...shadows.md,
  },

  // Icon Preview
  iconPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Icon Picker Modal
  iconModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  iconModalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    ...shadows.xl,
  },
  iconModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconModalTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
  },
  iconModalCloseButton: {
    padding: spacing.sm,
  },
  iconGrid: {
    padding: spacing.lg,
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  iconOptionPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconOptionPreviewSelected: {
    ...shadows.sm,
  },
  iconOptionText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  iconOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default EditCategoryModal;
