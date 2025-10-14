import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import { SmartSuggestion } from '../types';
import BudgetService from '../services/BudgetService';

const SmartSuggestionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { refreshData } = useApp();
  
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const smartSuggestions = await BudgetService.getSmartSuggestions();
      setSuggestions(smartSuggestions);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      Alert.alert('Error', 'Failed to load smart suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await BudgetService.deleteSmartSuggestion(suggestionId);
      await loadSuggestions();
      await refreshData();
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      Alert.alert('Error', 'Failed to dismiss suggestion');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reduce_spending':
        return 'trending-down';
      case 'increase_budget':
        return 'trending-up';
      case 'reallocate_funds':
        return 'swap-horizontal';
      case 'spending_pattern':
        return 'analytics';
      default:
        return 'bulb';
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning || '#FFA500';
      case 'low':
        return colors.success || '#4CAF50';
      default:
        return colors.primary;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Suggestion';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSuggestionItem = (suggestion: SmartSuggestion, index: number) => {
    const suggestionColor = getSuggestionColor(suggestion.priority);
    const suggestionIcon = getSuggestionIcon(suggestion.type);
    const priorityLabel = getPriorityLabel(suggestion.priority);

    return (
      <Animated.View
        key={suggestion.id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.suggestionItem, { borderLeftColor: suggestionColor }]}
      >
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionLeft}>
            <View style={[styles.suggestionIcon, { backgroundColor: suggestionColor + '20' }]}>
              <Ionicons name={suggestionIcon as any} size={20} color={suggestionColor} />
            </View>
            <View style={styles.suggestionInfo}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: suggestionColor + '20' }]}>
                  <Text style={[styles.priorityText, { color: suggestionColor }]}>
                    {priorityLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
              <Text style={styles.suggestionCategory}>{suggestion.categoryName}</Text>
            </View>
          </View>
          <View style={styles.suggestionRight}>
            <Text style={styles.suggestionTime}>{formatDate(suggestion.createdAt)}</Text>
            <View style={styles.suggestionActions}>
              {suggestion.actionable && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: suggestionColor + '20' }]}
                  onPress={() => {
                    // Navigate to budget screen or implement action
                    Alert.alert('Action', 'This would take you to the budget management screen');
                  }}
                >
                  <Ionicons name="arrow-forward" size={16} color={suggestionColor} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismissSuggestion(suggestion.id)}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
      <Ionicons name="bulb-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Smart Suggestions</Text>
      <Text style={styles.emptyDescription}>
        Smart suggestions will appear here based on your budget performance and spending patterns
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B263B', '#0D1B2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
      >
        <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
          <Ionicons name="bulb" size={18} color={colors.white} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Smart Suggestions</Text>
        </Animated.View>
        <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Smart Suggestions...</Text>
          </View>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => renderSuggestionItem(suggestion, index))
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    flex: 1,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  suggestionItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  suggestionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '500',
  },
  suggestionMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  suggestionCategory: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  suggestionRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  suggestionTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default SmartSuggestionsScreen;
