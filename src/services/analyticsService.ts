import { Transaction } from '../store/slices/transactionsSlice';
import { Budget } from '../store/slices/budgetsSlice';
import { SavingsGoal } from '../store/slices/savingsGoalsSlice';
import { Account } from '../store/slices/accountsSlice';

export interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
  changePercentage: number;
}

export interface CategoryInsight {
  category: string;
  totalSpent: number;
  averageSpent: number;
  transactionCount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageOfTotal: number;
  lastTransactionDate: string;
}

export interface FinancialHealthScore {
  overall: number;
  breakdown: {
    spending: number;
    saving: number;
    budgeting: number;
    debt: number;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SpendingPrediction {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  confidence: number;
  factors: string[];
}

export interface AnomalyDetection {
  type: 'unusual_spending' | 'budget_exceeded' | 'irregular_income' | 'suspicious_pattern';
  description: string;
  amount: number;
  date: string;
  severity: 'low' | 'medium' | 'high';
  category?: string;
}

export interface CashFlowAnalysis {
  monthly: {
    income: number;
    expenses: number;
    netFlow: number;
    trend: 'positive' | 'negative' | 'stable';
  };
  quarterly: {
    income: number;
    expenses: number;
    netFlow: number;
    trend: 'positive' | 'negative' | 'stable';
  };
  yearly: {
    income: number;
    expenses: number;
    netFlow: number;
    trend: 'positive' | 'negative' | 'stable';
  };
}

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get spending trends over time
  getSpendingTrends(
    transactions: Transaction[],
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): SpendingTrend[] {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const trends: SpendingTrend[] = [];

    // Group transactions by period
    const groupedData = this.groupTransactionsByPeriod(expenseTransactions, period);
    
    // Calculate trends
    const periods = Object.keys(groupedData).sort();
    
    for (let i = 0; i < periods.length; i++) {
      const currentPeriod = periods[i];
      const currentAmount = groupedData[currentPeriod];
      const previousAmount = i > 0 ? groupedData[periods[i - 1]] : 0;
      
      const change = currentAmount - previousAmount;
      const changePercentage = previousAmount > 0 ? (change / previousAmount) * 100 : 0;

      trends.push({
        period: currentPeriod,
        amount: currentAmount,
        change,
        changePercentage,
      });
    }

    return trends;
  }

  // Get category insights
  getCategoryInsights(transactions: Transaction[]): CategoryInsight[] {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryMap = new Map<string, { amount: number; count: number; dates: string[] }>();

    // Group by category
    expenseTransactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { amount: 0, count: 0, dates: [] });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.amount += transaction.amount;
      categoryData.count += 1;
      categoryData.dates.push(transaction.date);
    });

    const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const insights: CategoryInsight[] = [];

    categoryMap.forEach((data, category) => {
      const averageSpent = data.count > 0 ? data.amount / data.count : 0;
      const percentageOfTotal = totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0;
      
      // Calculate trend (simplified - compare last 30 days vs previous 30 days)
      const trend = this.calculateCategoryTrend(data.dates, data.amount);
      
      insights.push({
        category,
        totalSpent: data.amount,
        averageSpent,
        transactionCount: data.count,
        trend,
        percentageOfTotal,
        lastTransactionDate: data.dates.sort().pop() || '',
      });
    });

    return insights.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // Calculate financial health score
  calculateFinancialHealthScore(
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    accounts: Account[]
  ): FinancialHealthScore {
    const scores = {
      spending: 0,
      saving: 0,
      budgeting: 0,
      debt: 0,
    };

    const recommendations: string[] = [];

    // Spending Score (0-100)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalIncome > 0) {
      const expenseRatio = totalExpenses / totalIncome;
      if (expenseRatio <= 0.5) {
        scores.spending = 100;
      } else if (expenseRatio <= 0.7) {
        scores.spending = 80;
      } else if (expenseRatio <= 0.9) {
        scores.spending = 60;
      } else {
        scores.spending = 30;
        recommendations.push('Consider reducing your expenses to improve financial health');
      }
    }

    // Saving Score (0-100)
    const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    
    if (totalTarget > 0) {
      const savingRatio = totalSaved / totalTarget;
      scores.saving = Math.min(100, savingRatio * 100);
    } else {
      scores.saving = 50; // Neutral score if no goals set
    }

    if (scores.saving < 50) {
      recommendations.push('Set up savings goals to build your financial future');
    }

    // Budgeting Score (0-100)
    if (budgets.length > 0) {
      const budgetCompliance = this.calculateBudgetCompliance(transactions, budgets);
      scores.budgeting = budgetCompliance;
      
      if (budgetCompliance < 70) {
        recommendations.push('Improve budget adherence to better control your spending');
      }
    } else {
      scores.budgeting = 30;
      recommendations.push('Create budgets to track and control your spending');
    }

    // Debt Score (0-100)
    const creditCardDebt = accounts
      .filter(a => a.type === 'credit_card')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    
    const totalAssets = accounts
      .filter(a => a.type !== 'credit_card')
      .reduce((sum, a) => sum + a.balance, 0);

    if (creditCardDebt === 0) {
      scores.debt = 100;
    } else if (totalAssets > 0) {
      const debtToAssetRatio = creditCardDebt / totalAssets;
      if (debtToAssetRatio <= 0.1) {
        scores.debt = 90;
      } else if (debtToAssetRatio <= 0.3) {
        scores.debt = 70;
      } else if (debtToAssetRatio <= 0.5) {
        scores.debt = 50;
      } else {
        scores.debt = 20;
        recommendations.push('Focus on paying down high-interest debt');
      }
    } else {
      scores.debt = 30;
      recommendations.push('Build emergency savings before taking on more debt');
    }

    // Calculate overall score
    const overall = (scores.spending + scores.saving + scores.budgeting + scores.debt) / 4;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overall < 40) {
      riskLevel = 'high';
    } else if (overall < 70) {
      riskLevel = 'medium';
    }

    return {
      overall: Math.round(overall),
      breakdown: scores,
      recommendations,
      riskLevel,
    };
  }

  // Predict future spending
  predictSpending(transactions: Transaction[]): SpendingPrediction {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Simple linear regression for prediction
    const monthlyData = this.groupTransactionsByPeriod(expenseTransactions, 'month');
    const months = Object.keys(monthlyData).sort();
    const amounts = months.map(month => monthlyData[month]);

    if (amounts.length < 3) {
      return {
        nextMonth: 0,
        nextQuarter: 0,
        nextYear: 0,
        confidence: 0,
        factors: ['Insufficient data for prediction'],
      };
    }

    // Calculate trend
    const trend = this.calculateLinearTrend(amounts);
    const averageSpending = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    const nextMonth = Math.max(0, averageSpending + trend);
    const nextQuarter = Math.max(0, nextMonth * 3);
    const nextYear = Math.max(0, nextMonth * 12);

    // Calculate confidence based on data consistency
    const variance = this.calculateVariance(amounts);
    const confidence = Math.max(0, Math.min(100, 100 - (variance / averageSpending) * 100));

    const factors = [];
    if (trend > 0) {
      factors.push('Spending trend is increasing');
    } else if (trend < 0) {
      factors.push('Spending trend is decreasing');
    }
    if (confidence < 50) {
      factors.push('Spending patterns are inconsistent');
    }

    return {
      nextMonth: Math.round(nextMonth),
      nextQuarter: Math.round(nextQuarter),
      nextYear: Math.round(nextYear),
      confidence: Math.round(confidence),
      factors,
    };
  }

  // Detect spending anomalies
  detectAnomalies(transactions: Transaction[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Detect unusual spending amounts
    const amounts = expenseTransactions.map(t => t.amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const standardDeviation = Math.sqrt(
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
    );

    expenseTransactions.forEach(transaction => {
      const zScore = Math.abs(transaction.amount - mean) / standardDeviation;
      
      if (zScore > 2) {
        anomalies.push({
          type: 'unusual_spending',
          description: `Unusually high spending: $${transaction.amount.toFixed(2)}`,
          amount: transaction.amount,
          date: transaction.date,
          severity: zScore > 3 ? 'high' : 'medium',
          category: transaction.category,
        });
      }
    });

    // Detect irregular patterns (e.g., multiple large transactions in short period)
    const recentTransactions = expenseTransactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check for multiple high-value transactions in short time
    const highValueThreshold = mean + standardDeviation;
    let consecutiveHighValue = 0;
    
    recentTransactions.forEach(transaction => {
      if (transaction.amount > highValueThreshold) {
        consecutiveHighValue++;
      } else {
        consecutiveHighValue = 0;
      }
      
      if (consecutiveHighValue >= 3) {
        anomalies.push({
          type: 'suspicious_pattern',
          description: 'Multiple high-value transactions detected',
          amount: transaction.amount,
          date: transaction.date,
          severity: 'high',
        });
      }
    });

    return anomalies;
  }

  // Analyze cash flow
  analyzeCashFlow(transactions: Transaction[]): CashFlowAnalysis {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const monthlyData = this.analyzePeriodCashFlow(incomeTransactions, expenseTransactions, 'month');
    const quarterlyData = this.analyzePeriodCashFlow(incomeTransactions, expenseTransactions, 'quarter');
    const yearlyData = this.analyzePeriodCashFlow(incomeTransactions, expenseTransactions, 'year');

    return {
      monthly: monthlyData,
      quarterly: quarterlyData,
      yearly: yearlyData,
    };
  }

  // Private helper methods
  private groupTransactionsByPeriod(
    transactions: Transaction[],
    period: 'week' | 'month' | 'quarter' | 'year'
  ): { [key: string]: number } {
    const grouped: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;

      switch (period) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + transaction.amount;
    });

    return grouped;
  }

  private calculateCategoryTrend(dates: string[], amount: number): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    if (dates.length < 2) return 'stable';
    
    const sortedDates = dates.sort();
    const midPoint = Math.floor(sortedDates.length / 2);
    const firstHalf = sortedDates.slice(0, midPoint);
    const secondHalf = sortedDates.slice(midPoint);
    
    // This is a simplified calculation - in reality, you'd compare actual spending amounts
    if (secondHalf.length > firstHalf.length) {
      return 'increasing';
    } else if (firstHalf.length > secondHalf.length) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  private calculateBudgetCompliance(transactions: Transaction[], budgets: Budget[]): number {
    let totalCompliance = 0;
    let budgetCount = 0;

    budgets.forEach(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const compliance = Math.max(0, 100 - (spent / budget.amount) * 100);
      totalCompliance += compliance;
      budgetCount++;
    });

    return budgetCount > 0 ? totalCompliance / budgetCount : 0;
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private analyzePeriodCashFlow(
    incomeTransactions: Transaction[],
    expenseTransactions: Transaction[],
    period: 'month' | 'quarter' | 'year'
  ) {
    const incomeData = this.groupTransactionsByPeriod(incomeTransactions, period);
    const expenseData = this.groupTransactionsByPeriod(expenseTransactions, period);

    const periods = [...new Set([...Object.keys(incomeData), ...Object.keys(expenseData)])].sort();
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let positivePeriods = 0;
    let negativePeriods = 0;

    periods.forEach(periodKey => {
      const income = incomeData[periodKey] || 0;
      const expenses = expenseData[periodKey] || 0;
      const netFlow = income - expenses;
      
      totalIncome += income;
      totalExpenses += expenses;
      
      if (netFlow > 0) {
        positivePeriods++;
      } else if (netFlow < 0) {
        negativePeriods++;
      }
    });

    const netFlow = totalIncome - totalExpenses;
    let trend: 'positive' | 'negative' | 'stable' = 'stable';
    
    if (positivePeriods > negativePeriods) {
      trend = 'positive';
    } else if (negativePeriods > positivePeriods) {
      trend = 'negative';
    }

    return {
      income: totalIncome,
      expenses: totalExpenses,
      netFlow,
      trend,
    };
  }
}

export default AnalyticsService;
