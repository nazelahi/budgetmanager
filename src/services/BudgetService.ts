import { Budget, Transaction, Category } from '../types';
import StorageService from './StorageService';

class BudgetService {
  /**
   * Calculate spent amount for a budget based on transactions
   */
  calculateSpentAmount(budget: Budget, transactions: Transaction[], categories: Category[]): number {
    try {
      if (!budget || !transactions || !categories) {
        console.warn('Invalid parameters for calculateSpentAmount');
        return 0;
      }

      // Find the category name for this budget
      const category = categories.find(c => c.id === budget.categoryId);
      if (!category) {
        console.warn('Category not found for budget:', budget.categoryId);
        return 0;
      }

      // Filter transactions based on budget period and category
      const periodTransactions = this.getTransactionsForPeriod(
        transactions,
        budget.period,
        budget.startDate,
        budget.endDate
      );

      // Sum up expenses for this category
      return periodTransactions
        .filter(t => t.category === category.name && t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    } catch (error) {
      console.error('Error calculating spent amount:', error);
      return 0;
    }
  }

  /**
   * Get transactions within a budget period
   */
  private getTransactionsForPeriod(
    transactions: Transaction[],
    period: 'monthly' | 'weekly' | 'yearly',
    startDate: string,
    endDate: string
  ): Transaction[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }

  /**
   * Update all budgets with current spent amounts
   */
  async updateAllBudgetsSpentAmounts(): Promise<void> {
    try {
      const data = await StorageService.getData();
      
      if (!data.budgets || !Array.isArray(data.budgets)) {
        console.warn('No budgets found or invalid budget data');
        return;
      }
      
      if (!data.transactions || !Array.isArray(data.transactions)) {
        console.warn('No transactions found or invalid transaction data');
        return;
      }
      
      if (!data.categories || !Array.isArray(data.categories)) {
        console.warn('No categories found or invalid category data');
        return;
      }
      
      // Calculate spent amounts for all budgets
      const updatedBudgets = data.budgets.map(budget => ({
        ...budget,
        spent: this.calculateSpentAmount(budget, data.transactions, data.categories)
      }));

      // Update the data
      data.budgets = updatedBudgets;
      await StorageService.saveData(data);
    } catch (error) {
      console.error('Error updating budget spent amounts:', error);
    }
  }

  /**
   * Get budget with updated spent amount
   */
  async getBudgetWithSpentAmount(budgetId: string): Promise<Budget | null> {
    const data = await StorageService.getData();
    const budget = data.budgets.find(b => b.id === budgetId);
    
    if (!budget) return null;

    return {
      ...budget,
      spent: this.calculateSpentAmount(budget, data.transactions, data.categories)
    };
  }

  /**
   * Get all budgets with updated spent amounts
   */
  async getAllBudgetsWithSpentAmounts(): Promise<Budget[]> {
    const data = await StorageService.getData();
    
    return data.budgets.map(budget => ({
      ...budget,
      spent: this.calculateSpentAmount(budget, data.transactions, data.categories)
    }));
  }

  /**
   * Calculate budget progress percentage
   */
  calculateProgressPercentage(budget: Budget): number {
    if (budget.amount <= 0) return 0;
    return Math.min((budget.spent / budget.amount) * 100, 100);
  }

  /**
   * Get budget status color based on spending
   */
  getBudgetStatusColor(budget: Budget): string {
    const percentage = this.calculateProgressPercentage(budget);
    if (percentage >= 100) return '#F44336'; // Red - over budget
    if (percentage >= 80) return '#FF9800';  // Orange - warning
    return '#2196F3'; // Blue - good
  }

  /**
   * Check if budget is over limit
   */
  isOverBudget(budget: Budget): boolean {
    return budget.spent > budget.amount;
  }

  /**
   * Get remaining budget amount
   */
  getRemainingAmount(budget: Budget): number {
    return Math.max(budget.amount - budget.spent, 0);
  }

  /**
   * Get budget statistics
   */
  getBudgetStatistics(budgets: Budget[]) {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + this.getRemainingAmount(b), 0);
    const overBudgetCount = budgets.filter(b => this.isOverBudget(b)).length;
    const warningCount = budgets.filter(b => {
      const percentage = this.calculateProgressPercentage(b);
      return percentage >= 80 && percentage < 100;
    }).length;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      warningCount,
      onTrackCount: budgets.length - overBudgetCount - warningCount,
      averageProgress: budgets.length > 0 ? 
        budgets.reduce((sum, b) => sum + this.calculateProgressPercentage(b), 0) / budgets.length : 0
    };
  }
}

export default new BudgetService();
