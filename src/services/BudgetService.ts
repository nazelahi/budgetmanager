import {
  Budget,
  BudgetStats,
  BudgetAlert,
  Transaction,
  Category,
  AlertHistory,
  SmartSuggestion,
  AlertSettings,
} from "../types";
import StorageService from "./StorageService";

class BudgetService {
  /**
   * Calculate budget statistics for a given period
   */
  async getBudgetStats(
    period: "monthly" | "yearly" = "monthly",
  ): Promise<BudgetStats> {
    try {
      const data = await StorageService.getData();
      const budgets = (data.budgets || []).filter(
        (b) => b.isActive && b.period === period,
      );
      const transactions = data.transactions || [];
      const categories = data.categories || [];

      const now = new Date();
      const startDate =
        period === "monthly"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), 0, 1);
      const endDate =
        period === "monthly"
          ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
          : new Date(now.getFullYear(), 11, 31);

      // Filter transactions for the period
      const periodTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate >= startDate &&
          transactionDate <= endDate &&
          t.type === "expense"
        );
      });

      const totalBudgeted = budgets.reduce(
        (sum, budget) => sum + budget.amount,
        0,
      );
      const totalSpent = periodTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );
      const remaining = totalBudgeted - totalSpent;
      const percentageUsed =
        totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

      // Calculate stats for each budget category
      const categoryStats = budgets.map((budget) => {
        const categoryTransactions = periodTransactions.filter(
          (t) => t.category === budget.categoryName,
        );
        const spent = categoryTransactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const remaining = budget.amount - spent;
        const percentageUsed =
          budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          budgeted: budget.amount,
          spent,
          remaining,
          percentageUsed,
          isOverBudget: spent > budget.amount,
        };
      });

      return {
        totalBudgeted,
        totalSpent,
        remaining,
        percentageUsed,
        isOverBudget: totalSpent > totalBudgeted,
        categories: categoryStats,
      };
    } catch (error) {
      console.error("Error calculating budget stats:", error);
      return {
        totalBudgeted: 0,
        totalSpent: 0,
        remaining: 0,
        percentageUsed: 0,
        isOverBudget: false,
        categories: [],
      };
    }
  }

  /**
   * Check for budget alerts and create them if needed
   */
  async checkBudgetAlerts(): Promise<void> {
    try {
      const stats = await this.getBudgetStats();
      const data = await StorageService.getData();
      const existingAlerts = data.budgetAlerts || [];
      const budgets = data.budgets || [];
      const alertSettings =
        data.alertSettings || (await StorageService.getAlertSettings());

      // Check each category for alerts
      for (const category of stats.categories) {
        const budget = budgets.find(
          (b) => b.categoryId === category.categoryId,
        );
        if (!budget) continue;

        // Check for customizable warning thresholds
        for (const threshold of alertSettings.warningThresholds) {
          if (
            category.percentageUsed >= threshold &&
            category.percentageUsed < 100
          ) {
            const hasWarning = existingAlerts.some(
              (a) =>
                a.budgetId === budget.id &&
                a.type === "warning" &&
                a.threshold === threshold &&
                !a.isRead &&
                new Date(a.createdAt) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            );

            if (!hasWarning) {
              await StorageService.addBudgetAlert({
                budgetId: budget.id,
                type: "warning",
                threshold: threshold,
                isRead: false,
                categoryName: category.categoryName,
                amount: category.spent,
                budgetAmount: category.budgeted,
                message: `${category.categoryName} is at ${category.percentageUsed.toFixed(0)}% of budget (${threshold}% warning)`,
              });

              // Add to alert history
              await StorageService.addAlertHistory({
                budgetId: budget.id,
                categoryName: category.categoryName,
                type: "warning",
                threshold: threshold,
                amount: category.spent,
                budgetAmount: category.budgeted,
                percentageUsed: category.percentageUsed,
                isRead: false,
              });

              // Generate smart suggestions if enabled
              if (alertSettings.smartSuggestions) {
                await this.generateSmartSuggestions(
                  budget,
                  category,
                  "warning",
                );
              }
            }
          }
        }

        // Check for exceeded budget
        if (category.isOverBudget) {
          const hasExceeded = existingAlerts.some(
            (a) =>
              a.budgetId === budget.id &&
              a.type === "exceeded" &&
              !a.isRead &&
              new Date(a.createdAt) >
                new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
          );

          if (!hasExceeded) {
            await StorageService.addBudgetAlert({
              budgetId: budget.id,
              type: "exceeded",
              threshold: 100,
              isRead: false,
              categoryName: category.categoryName,
              amount: category.spent,
              budgetAmount: category.budgeted,
              message: `${category.categoryName} has exceeded its budget by ${(category.spent - category.budgeted).toFixed(2)}`,
            });

            // Add to alert history
            await StorageService.addAlertHistory({
              budgetId: budget.id,
              categoryName: category.categoryName,
              type: "exceeded",
              threshold: 100,
              amount: category.spent,
              budgetAmount: category.budgeted,
              percentageUsed: category.percentageUsed,
              isRead: false,
            });

            // Generate smart suggestions for exceeded budget
            if (alertSettings.smartSuggestions) {
              await this.generateSmartSuggestions(budget, category, "exceeded");
            }
          }
        }

        // Check for achieved budget (under budget with good progress)
        if (
          category.percentageUsed >= 50 &&
          category.percentageUsed < 80 &&
          category.remaining > 0
        ) {
          const hasAchieved = existingAlerts.some(
            (a) =>
              a.budgetId === budget.id &&
              a.type === "achieved" &&
              !a.isRead &&
              new Date(a.createdAt) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
          );

          if (!hasAchieved) {
            await StorageService.addBudgetAlert({
              budgetId: budget.id,
              type: "achieved",
              threshold: Math.round(category.percentageUsed),
              isRead: false,
              categoryName: category.categoryName,
              amount: category.spent,
              budgetAmount: category.budgeted,
              message: `Great job! ${category.categoryName} is at ${category.percentageUsed.toFixed(0)}% of budget`,
            });

            // Add to alert history
            await StorageService.addAlertHistory({
              budgetId: budget.id,
              categoryName: category.categoryName,
              type: "achieved",
              threshold: Math.round(category.percentageUsed),
              amount: category.spent,
              budgetAmount: category.budgeted,
              percentageUsed: category.percentageUsed,
              isRead: false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  }

  /**
   * Get budget recommendations based on spending history
   */
  async getBudgetRecommendations(): Promise<
    Array<{ categoryName: string; recommendedAmount: number; reason: string }>
  > {
    try {
      const data = await StorageService.getData();
      const transactions = data.transactions || [];
      const categories = (data.categories || []).filter(
        (c) => c.type === "expense",
      );
      const existingBudgets = (data.budgets || []).filter((b) => b.isActive);

      const now = new Date();
      const lastThreeMonths = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        1,
      );

      const recommendations = [];

      for (const category of categories) {
        // Skip if budget already exists
        if (existingBudgets.some((b) => b.categoryId === category.id)) continue;

        // Calculate average spending for this category over last 3 months
        const categoryTransactions = transactions.filter(
          (t) =>
            t.category === category.name &&
            t.type === "expense" &&
            new Date(t.date) >= lastThreeMonths,
        );

        if (categoryTransactions.length === 0) continue;

        const totalSpent = categoryTransactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const averageSpent = totalSpent / 3; // 3 months
        const recommendedAmount = Math.round(averageSpent * 1.1); // 10% buffer

        if (recommendedAmount > 0) {
          recommendations.push({
            categoryName: category.name,
            recommendedAmount,
            reason: `Based on average spending of ${Math.round(averageSpent)} over last 3 months`,
          });
        }
      }

      return recommendations.sort(
        (a, b) => b.recommendedAmount - a.recommendedAmount,
      );
    } catch (error) {
      console.error("Error getting budget recommendations:", error);
      return [];
    }
  }

  /**
   * Get budget performance over time
   */
  async getBudgetPerformance(months: number = 6): Promise<
    Array<{
      month: string;
      budgeted: number;
      spent: number;
      remaining: number;
      percentageUsed: number;
    }>
  > {
    try {
      const data = await StorageService.getData();
      const budgets = (data.budgets || []).filter(
        (b) => b.isActive && b.period === "monthly",
      );
      const transactions = data.transactions || [];

      const performance = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= startOfMonth &&
            transactionDate <= endOfMonth &&
            t.type === "expense"
          );
        });

        const budgeted = budgets.reduce(
          (sum, budget) => sum + budget.amount,
          0,
        );
        const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = budgeted - spent;
        const percentageUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

        performance.push({
          month: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          budgeted,
          spent,
          remaining,
          percentageUsed,
        });
      }

      return performance;
    } catch (error) {
      console.error("Error getting budget performance:", error);
      return [];
    }
  }

  /**
   * Get categories without budgets
   */
  async getCategoriesWithoutBudgets(): Promise<Category[]> {
    try {
      const data = await StorageService.getData();
      const expenseCategories = (data.categories || []).filter(
        (c) => c.type === "expense",
      );
      const budgetedCategoryIds = (data.budgets || [])
        .filter((b) => b.isActive)
        .map((b) => b.categoryId);

      return expenseCategories.filter(
        (category) => !budgetedCategoryIds.includes(category.id),
      );
    } catch (error) {
      console.error("Error getting categories without budgets:", error);
      return [];
    }
  }

  /**
   * Get budget utilization summary
   */
  async getBudgetUtilization(): Promise<{
    totalCategories: number;
    budgetedCategories: number;
    utilizationPercentage: number;
    overBudgetCategories: number;
  }> {
    try {
      const data = await StorageService.getData();
      const expenseCategories = (data.categories || []).filter(
        (c) => c.type === "expense",
      );
      const activeBudgets = (data.budgets || []).filter((b) => b.isActive);
      const stats = await this.getBudgetStats();

      return {
        totalCategories: expenseCategories.length,
        budgetedCategories: activeBudgets.length,
        utilizationPercentage:
          expenseCategories.length > 0
            ? (activeBudgets.length / expenseCategories.length) * 100
            : 0,
        overBudgetCategories: stats.categories.filter((c) => c.isOverBudget)
          .length,
      };
    } catch (error) {
      console.error("Error getting budget utilization:", error);
      return {
        totalCategories: 0,
        budgetedCategories: 0,
        utilizationPercentage: 0,
        overBudgetCategories: 0,
      };
    }
  }

  /**
   * Generate smart suggestions based on budget performance
   */
  async generateSmartSuggestions(
    budget: Budget,
    category: any,
    alertType: "warning" | "exceeded",
  ): Promise<void> {
    try {
      const data = await StorageService.getData();
      const transactions = data.transactions || [];
      const existingSuggestions = data.smartSuggestions || [];

      // Get recent transactions for this category
      const recentTransactions = transactions
        .filter(
          (t) => t.category === category.categoryName && t.type === "expense",
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      const suggestions: Omit<SmartSuggestion, "id" | "createdAt">[] = [];

      if (alertType === "exceeded") {
        // High priority suggestions for exceeded budgets
        suggestions.push({
          budgetId: budget.id,
          categoryName: category.categoryName,
          type: "reduce_spending",
          title: "Reduce Spending",
          message: `Consider reducing ${category.categoryName} spending by $${(category.spent - category.budgeted).toFixed(2)} to get back on track.`,
          priority: "high",
          actionable: true,
        });

        suggestions.push({
          budgetId: budget.id,
          categoryName: category.categoryName,
          type: "increase_budget",
          title: "Increase Budget",
          message: `Your ${category.categoryName} spending is consistently higher than budgeted. Consider increasing the budget by $${((category.spent - category.budgeted) * 1.2).toFixed(2)}.`,
          priority: "medium",
          actionable: true,
        });
      } else if (alertType === "warning") {
        // Medium priority suggestions for warning alerts
        suggestions.push({
          budgetId: budget.id,
          categoryName: category.categoryName,
          type: "spending_pattern",
          title: "Spending Pattern Analysis",
          message: `You're spending $${(category.spent / 30).toFixed(2)} daily on ${category.categoryName}. At this rate, you'll exceed your budget.`,
          priority: "medium",
          actionable: false,
        });

        if (recentTransactions.length > 0) {
          const avgTransaction =
            recentTransactions.reduce((sum, t) => sum + t.amount, 0) /
            recentTransactions.length;
          suggestions.push({
            budgetId: budget.id,
            categoryName: category.categoryName,
            type: "reduce_spending",
            title: "Small Changes, Big Impact",
            message: `Reducing your average ${category.categoryName} transaction by $${(avgTransaction * 0.1).toFixed(2)} could help you stay within budget.`,
            priority: "low",
            actionable: true,
          });
        }
      }

      // Add suggestions if they don't already exist
      for (const suggestion of suggestions) {
        const exists = existingSuggestions.some(
          (s) =>
            s.budgetId === suggestion.budgetId &&
            s.type === suggestion.type &&
            new Date(s.createdAt) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
        );

        if (!exists) {
          await StorageService.addSmartSuggestion(suggestion);
        }
      }
    } catch (error) {
      console.error("Error generating smart suggestions:", error);
    }
  }

  /**
   * Get alert history for a specific period
   */
  async getAlertHistory(days: number = 30): Promise<AlertHistory[]> {
    try {
      const history = await StorageService.getAlertHistory();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      return history.filter((alert) => new Date(alert.createdAt) >= cutoffDate);
    } catch (error) {
      console.error("Error getting alert history:", error);
      return [];
    }
  }

  /**
   * Get smart suggestions
   */
  async getSmartSuggestions(): Promise<SmartSuggestion[]> {
    try {
      return await StorageService.getSmartSuggestions();
    } catch (error) {
      console.error("Error getting smart suggestions:", error);
      return [];
    }
  }

  /**
   * Get alert settings
   */
  async getAlertSettings(): Promise<AlertSettings> {
    try {
      return await StorageService.getAlertSettings();
    } catch (error) {
      console.error("Error getting alert settings:", error);
      return {
        warningThresholds: [70, 80, 90],
        enablePushNotifications: true,
        enableEmailNotifications: false,
        quietHours: { enabled: true, start: "22:00", end: "08:00" },
        alertFrequency: "immediate",
        smartSuggestions: true,
      };
    }
  }

  /**
   * Update alert settings
   */
  async updateAlertSettings(settings: Partial<AlertSettings>): Promise<void> {
    try {
      await StorageService.updateAlertSettings(settings);
    } catch (error) {
      console.error("Error updating alert settings:", error);
    }
  }

  /**
   * Check if it's within quiet hours
   */
  isWithinQuietHours(alertSettings: AlertSettings): boolean {
    if (!alertSettings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(alertSettings.quietHours.start);
    const endTime = this.parseTime(alertSettings.quietHours.end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }
}

export default new BudgetService();
