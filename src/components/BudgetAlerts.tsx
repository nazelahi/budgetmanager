import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { BudgetAlert } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface BudgetAlertsProps {
  onDismiss?: () => void;
}

const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ onDismiss }) => {
  const { getUnreadAlerts, markAlertAsRead } = useApp();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [alerts]);

  const loadAlerts = async () => {
    try {
      const unreadAlerts = await getUnreadAlerts();
      setAlerts(unreadAlerts);
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    }
  };

  const handleDismiss = async () => {
    if (alerts.length === 0) return;

    const currentAlert = alerts[currentAlertIndex];
    try {
      await markAlertAsRead(currentAlert.id);
      
      if (currentAlertIndex < alerts.length - 1) {
        setCurrentAlertIndex(currentAlertIndex + 1);
      } else {
        setAlerts([]);
        onDismiss?.();
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleDismissAll = async () => {
    try {
      for (const alert of alerts) {
        await markAlertAsRead(alert.id);
      }
      setAlerts([]);
      onDismiss?.();
    } catch (error) {
      console.error('Error dismissing all alerts:', error);
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentAlertIndex];
  const isLastAlert = currentAlertIndex === alerts.length - 1;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'exceeded':
        return 'alert-circle';
      case 'achieved':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return colors.warning || '#FFA500';
      case 'exceeded':
        return colors.error;
      case 'achieved':
        return colors.success || '#4CAF50';
      default:
        return colors.primary;
    }
  };

  const getAlertMessage = (alert: BudgetAlert) => {
    switch (alert.type) {
      case 'warning':
        return `You've used ${alert.threshold}% of your budget. Consider slowing down your spending.`;
      case 'exceeded':
        return `You've exceeded your budget by ${alert.threshold}%. Time to review your spending.`;
      case 'achieved':
        return `Great job! You've used ${alert.threshold}% of your budget and still have money left.`;
      default:
        return 'Budget alert';
    }
  };

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth, 0],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: slideTransform }] }
      ]}
    >
      <View style={[
        styles.alertCard,
        { borderLeftColor: getAlertColor(currentAlert.type) }
      ]}>
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View style={[
              styles.alertIcon,
              { backgroundColor: getAlertColor(currentAlert.type) + '20' }
            ]}>
              <Ionicons 
                name={getAlertIcon(currentAlert.type) as any} 
                size={20} 
                color={getAlertColor(currentAlert.type)} 
              />
            </View>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {currentAlert.type === 'warning' ? 'Budget Warning' :
                 currentAlert.type === 'exceeded' ? 'Budget Exceeded' :
                 'Budget Achievement'}
              </Text>
              <Text style={styles.alertMessage}>
                {getAlertMessage(currentAlert)}
              </Text>
            </View>
          </View>
          
          <View style={styles.alertActions}>
            {alerts.length > 1 && (
              <Text style={styles.alertCounter}>
                {currentAlertIndex + 1} of {alerts.length}
              </Text>
            )}
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {alerts.length > 1 && (
          <View style={styles.alertFooter}>
            <TouchableOpacity
              style={styles.dismissAllButton}
              onPress={handleDismissAll}
            >
              <Text style={styles.dismissAllText}>Dismiss All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 1000,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    ...shadows.lg,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  alertText: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  alertMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  alertActions: {
    alignItems: 'center',
  },
  alertCounter: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  dismissAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dismissAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default BudgetAlerts;
