import { BudgetAlert, Budget, AppData } from '../types';
import StorageService from './StorageService';
import BudgetService from './BudgetService';

class AlertService {
  /**
   * Check all budgets and generate alerts
   */
  async checkBudgetAlerts(): Promise<BudgetAlert[]> {
    try {
      const data = await StorageService.getData();
      const newAlerts: BudgetAlert[] = [];
      
      if (!data.budgets || !data.categories) {
        return newAlerts;
      }

      for (const budget of data.budgets) {
        const category = data.categories.find(c => c.id === budget.categoryId);
        if (!category) continue;

        // Calculate current spending
        const spent = BudgetService.calculateSpentAmount(budget, data.transactions, data.categories);
        const percentage = BudgetService.calculateProgressPercentage({ ...budget, spent });
        
        // Check for warning threshold (default 80%)
        const warningThreshold = data.settings?.alertThresholds?.warning || 80;
        if (percentage >= warningThreshold && percentage < 100) {
          const existingAlert = data.budgetAlerts?.find(
            alert => alert.budgetId === budget.id && 
            alert.type === 'warning' && 
            !alert.isRead
          );
          
          if (!existingAlert) {
            const alert = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              budgetId: budget.id,
              type: 'warning' as const,
              threshold: warningThreshold,
              message: `You've spent ${percentage.toFixed(0)}% of your ${category.name} budget (${this.formatCurrency(spent, data.settings?.currency)} of ${this.formatCurrency(budget.amount, data.settings?.currency)})`,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            newAlerts.push(alert);
          }
        }

        // Check for exceeded threshold (100%)
        if (percentage >= 100) {
          const existingAlert = data.budgetAlerts?.find(
            alert => alert.budgetId === budget.id && 
            alert.type === 'exceeded' && 
            !alert.isRead
          );
          
          if (!existingAlert) {
            const alert = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              budgetId: budget.id,
              type: 'exceeded' as const,
              threshold: 100,
              message: `You've exceeded your ${category.name} budget by ${this.formatCurrency(spent - budget.amount, data.settings?.currency)}!`,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            newAlerts.push(alert);
          }
        }
      }

      // Save new alerts
      if (newAlerts.length > 0) {
        const updatedData = { ...data };
        if (!updatedData.budgetAlerts) {
          updatedData.budgetAlerts = [];
        }
        updatedData.budgetAlerts = [...updatedData.budgetAlerts, ...newAlerts];
        await StorageService.saveData(updatedData);
      }

      return newAlerts;
    } catch (error) {
      console.error('Error checking budget alerts:', error);
      return [];
    }
  }

  /**
   * Get all unread alerts
   */
  async getUnreadAlerts(): Promise<BudgetAlert[]> {
    try {
      const data = await StorageService.getData();
      return (data.budgetAlerts || []).filter(alert => !alert.isRead);
    } catch (error) {
      console.error('Error getting unread alerts:', error);
      return [];
    }
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(): Promise<BudgetAlert[]> {
    try {
      const data = await StorageService.getData();
      return (data.budgetAlerts || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting all alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const data = await StorageService.getData();
      const alertIndex = data.budgetAlerts?.findIndex(alert => alert.id === alertId);
      
      if (alertIndex !== undefined && alertIndex >= 0) {
        data.budgetAlerts[alertIndex].isRead = true;
        await StorageService.saveData(data);
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Mark all alerts as read
   */
  async markAllAlertsAsRead(): Promise<void> {
    try {
      const data = await StorageService.getData();
      if (data.budgetAlerts) {
        data.budgetAlerts.forEach(alert => {
          alert.isRead = true;
        });
        await StorageService.saveData(data);
      }
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      throw error;
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      const data = await StorageService.getData();
      if (data.budgetAlerts) {
        data.budgetAlerts = data.budgetAlerts.filter(alert => alert.id !== alertId);
        await StorageService.saveData(data);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  /**
   * Clear old alerts (older than 30 days)
   */
  async clearOldAlerts(): Promise<void> {
    try {
      const data = await StorageService.getData();
      if (data.budgetAlerts) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        data.budgetAlerts = data.budgetAlerts.filter(alert => 
          new Date(alert.createdAt) > thirtyDaysAgo
        );
        await StorageService.saveData(data);
      }
    } catch (error) {
      console.error('Error clearing old alerts:', error);
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    total: number;
    unread: number;
    warnings: number;
    exceeded: number;
  }> {
    try {
      const alerts = await this.getAllAlerts();
      return {
        total: alerts.length,
        unread: alerts.filter(alert => !alert.isRead).length,
        warnings: alerts.filter(alert => alert.type === 'warning').length,
        exceeded: alerts.filter(alert => alert.type === 'exceeded').length,
      };
    } catch (error) {
      console.error('Error getting alert stats:', error);
      return { total: 0, unread: 0, warnings: 0, exceeded: 0 };
    }
  }

  /**
   * Create a custom alert
   */
  async createCustomAlert(
    budgetId: string, 
    type: 'warning' | 'exceeded' | 'reminder', 
    message: string
  ): Promise<void> {
    try {
      const data = await StorageService.getData();
      const newAlert: BudgetAlert = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        budgetId,
        type,
        threshold: type === 'exceeded' ? 100 : 80,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      if (!data.budgetAlerts) {
        data.budgetAlerts = [];
      }
      data.budgetAlerts.push(newAlert);
      await StorageService.saveData(data);
    } catch (error) {
      console.error('Error creating custom alert:', error);
      throw error;
    }
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Schedule periodic alert checks (to be called by the app)
   */
  async schedulePeriodicChecks(): Promise<void> {
    try {
      // Check for alerts every hour
      setInterval(async () => {
        await this.checkBudgetAlerts();
        await this.clearOldAlerts();
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      console.error('Error scheduling periodic checks:', error);
    }
  }
}

export default new AlertService();
