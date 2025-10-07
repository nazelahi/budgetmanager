import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  budgetAlerts: boolean;
  billReminders: boolean;
  spendingAlerts: boolean;
  goalMilestones: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  budgetThreshold: number; // Percentage (e.g., 80 for 80%)
  spendingThreshold: number; // Amount threshold for unusual spending
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  type: 'warning' | 'exceeded';
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface SpendingAlert {
  id: string;
  type: 'unusual' | 'high' | 'category_exceeded';
  message: string;
  amount: number;
  category?: string;
  date: string;
}

export interface GoalMilestone {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  type: 'quarter' | 'half' | 'three_quarters' | 'completed';
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    budgetAlerts: true,
    billReminders: true,
    spendingAlerts: true,
    goalMilestones: true,
    weeklyReports: true,
    monthlyReports: true,
    budgetThreshold: 80,
    spendingThreshold: 500,
  };

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification permissions
  async initialize(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notifications to receive budget alerts and reminders.');
          return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('budget-alerts', {
            name: 'Budget Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });

          await Notifications.setNotificationChannelAsync('bill-reminders', {
            name: 'Bill Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });

          await Notifications.setNotificationChannelAsync('spending-alerts', {
            name: 'Spending Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });

          await Notifications.setNotificationChannelAsync('goal-milestones', {
            name: 'Goal Milestones',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        return true;
      } else {
        console.log('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Update notification settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Send budget alert
  async sendBudgetAlert(alert: BudgetAlert): Promise<void> {
    if (!this.settings.budgetAlerts) return;

    const isExceeded = alert.type === 'exceeded';
    const title = isExceeded ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning';
    const message = isExceeded 
      ? `You've exceeded your ${alert.budgetName} budget by ${alert.percentage.toFixed(0)}%`
      : `You've used ${alert.percentage.toFixed(0)}% of your ${alert.budgetName} budget`;

    await this.scheduleNotification({
      title,
      body: message,
      data: { type: 'budget_alert', budgetId: alert.budgetId },
      channelId: 'budget-alerts',
    });
  }

  // Send bill reminder
  async sendBillReminder(reminder: BillReminder): Promise<void> {
    if (!this.settings.billReminders) return;

    const dueDate = new Date(reminder.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let title = '';
    let message = '';

    if (daysUntilDue === 0) {
      title = '📅 Bill Due Today!';
      message = `${reminder.title} is due today ($${reminder.amount})`;
    } else if (daysUntilDue === 1) {
      title = '📅 Bill Due Tomorrow';
      message = `${reminder.title} is due tomorrow ($${reminder.amount})`;
    } else if (daysUntilDue <= 3) {
      title = '📅 Bill Due Soon';
      message = `${reminder.title} is due in ${daysUntilDue} days ($${reminder.amount})`;
    } else {
      return; // Don't send reminder if more than 3 days away
    }

    await this.scheduleNotification({
      title,
      body: message,
      data: { type: 'bill_reminder', reminderId: reminder.id },
      channelId: 'bill-reminders',
    });
  }

  // Send spending alert
  async sendSpendingAlert(alert: SpendingAlert): Promise<void> {
    if (!this.settings.spendingAlerts) return;

    let title = '';
    let message = '';

    switch (alert.type) {
      case 'unusual':
        title = '🔍 Unusual Spending Detected';
        message = `Unusual spending pattern detected: $${alert.amount} in ${alert.category}`;
        break;
      case 'high':
        title = '💰 High Spending Alert';
        message = `High spending detected: $${alert.amount} in ${alert.category}`;
        break;
      case 'category_exceeded':
        title = '⚠️ Category Budget Exceeded';
        message = `You've exceeded your ${alert.category} budget by $${alert.amount}`;
        break;
    }

    await this.scheduleNotification({
      title,
      body: message,
      data: { type: 'spending_alert', alertId: alert.id },
      channelId: 'spending-alerts',
    });
  }

  // Send goal milestone
  async sendGoalMilestone(milestone: GoalMilestone): Promise<void> {
    if (!this.settings.goalMilestones) return;

    let title = '';
    let message = '';

    switch (milestone.type) {
      case 'quarter':
        title = '🎯 25% Goal Milestone!';
        message = `You've reached 25% of your ${milestone.goalName} goal!`;
        break;
      case 'half':
        title = '🎯 50% Goal Milestone!';
        message = `You're halfway to your ${milestone.goalName} goal!`;
        break;
      case 'three_quarters':
        title = '🎯 75% Goal Milestone!';
        message = `You're 75% of the way to your ${milestone.goalName} goal!`;
        break;
      case 'completed':
        title = '🎉 Goal Achieved!';
        message = `Congratulations! You've achieved your ${milestone.goalName} goal!`;
        break;
    }

    await this.scheduleNotification({
      title,
      body: message,
      data: { type: 'goal_milestone', goalId: milestone.goalId },
      channelId: 'goal-milestones',
    });
  }

  // Schedule weekly report
  async scheduleWeeklyReport(): Promise<void> {
    if (!this.settings.weeklyReports) return;

    // Schedule for every Sunday at 9 AM
    const trigger = {
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
      repeats: true,
    };

    await this.scheduleNotification({
      title: '📊 Weekly Financial Report',
      body: 'Your weekly financial summary is ready!',
      data: { type: 'weekly_report' },
      channelId: 'budget-alerts',
      trigger,
    });
  }

  // Schedule monthly report
  async scheduleMonthlyReport(): Promise<void> {
    if (!this.settings.monthlyReports) return;

    // Schedule for the 1st of every month at 9 AM
    const trigger = {
      day: 1,
      hour: 9,
      minute: 0,
      repeats: true,
    };

    await this.scheduleNotification({
      title: '📈 Monthly Financial Report',
      body: 'Your monthly financial summary is ready!',
      data: { type: 'monthly_report' },
      channelId: 'budget-alerts',
      trigger,
    });
  }

  // Private method to schedule notification
  private async scheduleNotification({
    title,
    body,
    data,
    channelId,
    trigger,
  }: {
    title: string;
    body: string;
    data?: any;
    channelId?: string;
    trigger?: any;
  }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null,
        ...(channelId && { channelId }),
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Cancel specific notification by identifier
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

export default NotificationService;
