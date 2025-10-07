import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { RootState } from '../store/store';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen: React.FC = () => {
  const { transactions } = useSelector((state: RootState) => state.transactions);
  const { budgets } = useSelector((state: RootState) => state.budgets);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.user);

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions, timeRange]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Category breakdown for expenses
  const categoryBreakdown = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const amount = expenseTransactions
        .filter(t => t.category === category.name)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        amount,
        color: category.color,
      };
    })
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Monthly data for line chart
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
      });
    }
    
    return months;
  }, [transactions]);

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const pieChartData = categoryBreakdown.slice(0, 5).map((item, index) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const lineChartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        data: monthlyData.map(m => m.income),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: monthlyData.map(m => m.expenses),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: categoryBreakdown.slice(0, 6).map(item => item.name),
    datasets: [
      {
        data: categoryBreakdown.slice(0, 6).map(item => item.amount),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Reports"
        subtitle="Financial analytics & insights"
        variant="gradient"
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Modern Time Range Tabs */}
        <View style={styles.timeRangeSelector}>
          <View style={styles.tabContainer}>
            {[
              { key: 'week', label: 'Week', icon: 'calendar' },
              { key: 'month', label: 'Month', icon: 'calendar-outline' },
              { key: 'year', label: 'Year', icon: 'calendar-sharp' },
            ].map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tabButton,
                  timeRange === key && styles.tabButtonActive,
                ]}
                onPress={() => setTimeRange(key as any)}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={timeRange === key ? colors.white : colors.gray600}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      timeRange === key && styles.tabTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      {/* Modern Summary Section with Gradients */}
      <View style={styles.summarySection}>
        {/* Main Financial Overview Card with Gradient */}
        <View style={styles.overviewCard}>
          <LinearGradient
            colors={gradients.primary as [string, string]}
            style={styles.overviewGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Financial Overview</Text>
              <Text style={styles.overviewSubtitle}>
                {timeRange === 'week' ? 'Last 7 days' : 
                 timeRange === 'month' ? 'Last 30 days' : 'Last 12 months'}
              </Text>
            </View>
            
            <View style={styles.overviewContent}>
              {/* Net Income - Primary Focus with Gradient */}
              <LinearGradient
                colors={netIncome >= 0 ? gradients.success : gradients.error}
                style={styles.netIncomeSection}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.netIncomeLabel}>Net Income</Text>
                <Text style={styles.netIncomeAmount}>
                  {formatCurrency(netIncome)}
                </Text>
                <View style={styles.netIncomeIndicator}>
                  <Ionicons
                    name={netIncome >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.netIncomeChange}>
                    {netIncome >= 0 ? '+' : ''}{formatCurrency(Math.abs(netIncome))}
                  </Text>
                </View>
              </LinearGradient>

              {/* Income & Expense Breakdown with Gradients */}
              <View style={styles.breakdownSection}>
                <LinearGradient
                  colors={gradients.success as [string, string]}
                  style={styles.breakdownItemGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownIcon}>
                      <Ionicons name="trending-up" size={20} color={colors.success} />
                    </View>
                    <View style={styles.breakdownContent}>
                      <Text style={styles.breakdownLabel}>Income</Text>
                      <Text style={styles.breakdownAmount}>{formatCurrency(totalIncome)}</Text>
                    </View>
                  </View>
                </LinearGradient>
                
                <View style={styles.breakdownDivider} />
                
                <LinearGradient
                  colors={gradients.error as [string, string]}
                  style={styles.breakdownItemGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownIcon}>
                      <Ionicons name="trending-down" size={20} color={colors.error} />
                    </View>
                    <View style={styles.breakdownContent}>
                      <Text style={styles.breakdownLabel}>Expenses</Text>
                      <Text style={styles.breakdownAmount}>{formatCurrency(totalExpenses)}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Monthly Trend Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Income vs Expenses</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expense Categories</Text>
          <PieChart
            data={pieChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card>
      )}

      {/* Category Bar Chart */}
      {categoryBreakdown.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Categories</Text>
          <BarChart
            data={barChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars
          />
        </Card>
      )}

      {/* Category List */}
      <Card style={styles.categoryListCard}>
        <Text style={styles.chartTitle}>Category Breakdown</Text>
        {categoryBreakdown.map((category, index) => (
          <View key={category.name} style={styles.categoryItem}>
            <View style={styles.categoryItemLeft}>
              <View
                style={[
                  styles.categoryColor,
                  { backgroundColor: category.color },
                ]}
              />
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <View style={styles.categoryItemRight}>
              <Text style={styles.categoryAmount}>
                {formatCurrency(category.amount)}
              </Text>
              <Text style={styles.categoryPercentage}>
                {((category.amount / totalExpenses) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for floating navigation
  },
  timeRangeSelector: {
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
  summarySection: {
    paddingHorizontal: spacing['2'],
    paddingBottom: spacing['6'],
  },
  overviewCard: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  overviewGradient: {
    padding: spacing['6'],
  },
  overviewHeader: {
    marginBottom: spacing['6'],
    alignItems: 'center',
  },
  overviewTitle: {
    ...typography.textStyles.headline4,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['1'],
  },
  overviewSubtitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.white,
    opacity: 0.8,
  },
  overviewContent: {
    gap: spacing['6'],
  },
  netIncomeSection: {
    alignItems: 'center',
    paddingVertical: spacing['5'],
    paddingHorizontal: spacing['5'],
    borderRadius: borderRadius['2xl'],
    ...shadows.md,
  },
  netIncomeLabel: {
    ...typography.textStyles.bodyLarge,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing['2'],
  },
  netIncomeAmount: {
    ...typography.textStyles.displaySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing['3'],
  },
  netIncomeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  netIncomeChange: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  breakdownSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.md,
  },
  breakdownItemGradient: {
    flex: 1,
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['4'],
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing['0.5'],
  },
  breakdownAmount: {
    ...typography.textStyles.headline6,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  breakdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing['2'],
  },
  chartCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  chartTitle: {
    ...typography.textStyles.h6,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryListCard: {
    margin: spacing.md,
    marginTop: 0,
    marginBottom: spacing.xl,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
  },
  categoryItemRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.textStyles.body2,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  categoryPercentage: {
    ...typography.textStyles.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default ReportsScreen;
