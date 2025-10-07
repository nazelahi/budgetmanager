import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { SavingsGoal, addGoal, updateGoal, deleteGoal, addContribution } from '../store/slices/savingsGoalsSlice';

const SavingsGoalsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { goals, roundUpEnabled, roundUpAmount } = useSelector((state: RootState) => state.savingsGoals);
  const { user } = useSelector((state: RootState) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const getGoalProgress = (goal: SavingsGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getGoalStatus = (goal: SavingsGoal) => {
    const progress = getGoalProgress(goal);
    if (goal.isCompleted) return 'completed';
    if (progress >= 75) return 'almost_there';
    if (progress >= 50) return 'halfway';
    if (progress >= 25) return 'quarter';
    return 'just_started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'almost_there': return colors.warning;
      case 'halfway': return colors.primary;
      case 'quarter': return colors.info;
      default: return colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed!';
      case 'almost_there': return 'Almost there!';
      case 'halfway': return 'Halfway there!';
      case 'quarter': return 'Getting started';
      default: return 'Just started';
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'active') return !goal.isCompleted;
    if (filter === 'completed') return goal.isCompleted;
    return true;
  });

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteGoal(goal.id)),
        },
      ]
    );
  };

  const handleAddContribution = (goal: SavingsGoal, amount: number, description?: string) => {
    const contribution = {
      id: `contrib_${Date.now()}`,
      goalId: goal.id,
      amount,
      date: new Date().toISOString(),
      description,
      source: 'manual' as const,
      createdAt: new Date().toISOString(),
    };
    
    dispatch(addContribution(contribution));
    setShowContributeModal(false);
    setSelectedGoal(null);
  };

  const renderGoal = ({ item }: { item: SavingsGoal }) => {
    const progress = getGoalProgress(item);
    const status = getGoalStatus(item);
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);

    return (
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalLeft}>
            <View
              style={[
                styles.goalIcon,
                { backgroundColor: item.color + '20' },
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={item.color}
              />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalName}>{item.name}</Text>
              <Text style={styles.goalCategory}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
              <Text style={[styles.goalStatus, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteGoal(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalAmounts}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Current</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.currentAmount)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.targetAmount)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={[styles.amountValue, { color: colors.textSecondary }]}>
              {formatCurrency(item.targetAmount - item.currentAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.goalActions}>
          <Button
            title="Add Money"
            onPress={() => {
              setSelectedGoal(item);
              setShowContributeModal(true);
            }}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="View Details"
            onPress={() => {
              // Navigate to goal details
            }}
            variant="gradient"
            gradient="primary"
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="flag-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyStateText}>No savings goals yet</Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Create your first savings goal to start building wealth'
          : `No ${filter} goals found`}
      </Text>
      <Button
        title="Create Goal"
        onPress={() => setShowAddModal(true)}
        style={styles.emptyStateButton}
        gradient="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Savings Goals"
        subtitle={`${goals.length} goals • ${formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))} saved`}
        rightComponent={
          <Button
            title="Add Goal"
            onPress={() => setShowAddModal(true)}
            gradient="primary"
            style={styles.addButton}
          />
        }
        variant="gradient"
      />

      {/* Modern Tab Filters */}
      <View style={styles.filters}>
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: 'All', icon: 'list' },
            { key: 'active', label: 'Active', icon: 'play-circle' },
            { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
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

      {/* Goals List */}
      <FlatList
        data={filteredGoals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Create Savings Goal"
            rightComponent={
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Set a financial goal and start saving towards it
            </Text>
            
            {/* Goal creation form would go here */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Goal Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Target Amount</Text>
              <TextInput
                style={styles.textInput}
                placeholder="10000"
                placeholderTextColor={colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Emergency"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <Button
              title="Create Goal"
              onPress={() => {
                // Handle goal creation
                setShowAddModal(false);
              }}
              gradient="primary"
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        visible={showContributeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            title="Add Money to Goal"
            rightComponent={
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            }
          />
          <ScrollView style={styles.modalContent}>
            {selectedGoal && (
              <>
                <Text style={styles.modalSubtitle}>
                  Add money to "{selectedGoal.name}"
                </Text>
                
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="100"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Birthday money"
                    placeholderTextColor={colors.gray400}
                  />
                </View>

                <Button
                  title="Add Money"
                  onPress={() => {
                    // Handle contribution
                    setShowContributeModal(false);
                  }}
                  gradient="primary"
                  style={styles.createButton}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Space for floating navigation
  },
  addButton: {
    marginTop: spacing.xs,
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
  },
  goalCard: {
    marginBottom: spacing.md,
    padding: spacing['5'],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  goalCategory: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing['0.5'],
  },
  goalStatus: {
    ...typography.textStyles.caption,
    fontWeight: typography.fontWeight.medium,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  goalAmounts: {
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  amountLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  progressSection: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
  },
  progressPercentage: {
    ...typography.textStyles.caption,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateText: {
    ...typography.textStyles.headline5,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.textStyles.bodyMedium,
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
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalSubtitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: spacing.md,
  },
  formLabel: {
    ...typography.textStyles.labelLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  createButton: {
    marginTop: spacing.lg,
  },
});

export default SavingsGoalsScreen;
