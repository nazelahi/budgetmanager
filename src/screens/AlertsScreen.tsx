import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  FadeIn,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import { BudgetAlert } from '../types';

const AlertsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, getAlerts, markAlertAsRead, markAllAlertsAsRead, deleteAlert } = useApp();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await getAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      await loadAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAlertsAsRead();
      await loadAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all alerts as read');
    }
  };

  const handleDeleteAlert = (alert: BudgetAlert) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlert(alert.id);
              await loadAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning-outline';
      case 'exceeded':
        return 'alert-circle-outline';
      case 'reminder':
        return 'notifications-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return colors.warning;
      case 'exceeded':
        return colors.error;
      case 'reminder':
        return colors.info;
      default:
        return colors.primary;
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
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderAlert = (alert: BudgetAlert, index: number) => (
    <Animated.View
      key={alert.id}
      entering={FadeIn.delay(index * 100)}
      style={styles.alertItem}
    >
      <TouchableOpacity
        style={[
          styles.alertCard,
          !alert.isRead && styles.alertCardUnread
        ]}
        onPress={() => !alert.isRead && handleMarkAsRead(alert.id)}
      >
        <View style={styles.alertLeft}>
          <View style={[
            styles.alertIcon,
            { backgroundColor: getAlertColor(alert.type) + '20' }
          ]}>
            <Ionicons 
              name={getAlertIcon(alert.type) as any} 
              size={20} 
              color={getAlertColor(alert.type)} 
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={[
              styles.alertMessage,
              !alert.isRead && styles.alertMessageUnread
            ]}>
              {alert.message}
            </Text>
            <Text style={styles.alertDate}>
              {formatDate(alert.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.alertRight}>
          {!alert.isRead && (
            <View style={styles.unreadDot} />
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(alert)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>No Alerts</Text>
      <Text style={styles.emptyDescription}>
        You'll receive alerts when you're approaching or exceeding your budget limits
      </Text>
    </View>
  );

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="notifications" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Animated.View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Animated.View entering={SlideInRight.delay(300)}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Ionicons name="checkmark-done-outline" size={18} color={colors.white} />
                </TouchableOpacity>
              </Animated.View>
            )}
            <Animated.View entering={SlideInRight.delay(400)}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close-outline" size={18} color={colors.white} />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length > 0 ? (
          <View style={styles.alertsContainer}>
            {alerts.map((alert, index) => renderAlert(alert, index))}
          </View>
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
    marginRight: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    ...typography.h3,
    color: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  alertsContainer: {
    padding: spacing.sm,
  },
  alertItem: {
    marginBottom: spacing.sm,
  },
  alertCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  alertCardUnread: {
    borderColor: colors.primary + '40',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  alertMessageUnread: {
    color: colors.white,
    fontWeight: '500',
  },
  alertDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  alertRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    padding: spacing.xs,
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
});

export default AlertsScreen;
