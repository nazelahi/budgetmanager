import { AppData, Transaction, DashboardStats } from '../types';
import StorageService from './StorageService';

class DataService {
  async getTransactions(): Promise<Transaction[]> {
    const data = await StorageService.getData();
    return data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
    });
  }

  async getTransactionsByCategory(categoryName: string): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    return transactions.filter(t => t.category === categoryName);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const transactions = await this.getTransactions();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Calculate top categories
    const categoryTotals = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      balance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      topCategories,
    };
  }

  async getMonthlyData(months: number = 6): Promise<Array<{ month: string; income: number; expenses: number; balance: number }>> {
    const transactions = await this.getTransactions();
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        balance: income - expenses,
      });
    }

    return monthlyData;
  }

  async getCategoryStats(): Promise<Array<{ category: string; amount: number; count: number; type: 'income' | 'expense' }>> {
    const transactions = await this.getTransactions();
    const categoryStats = transactions.reduce((acc, t) => {
      const key = `${t.category}-${t.type}`;
      if (!acc[key]) {
        acc[key] = { category: t.category, amount: 0, count: 0, type: t.type };
      }
      acc[key].amount += t.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { category: string; amount: number; count: number; type: 'income' | 'expense' }>);

    return Object.values(categoryStats).sort((a, b) => b.amount - a.amount);
  }
}

export default new DataService();
