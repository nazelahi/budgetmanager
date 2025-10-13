import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  SlideInUp, 
  FadeIn, 
  SlideInLeft, 
  SlideInRight,
  BounceIn,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, formatCurrencyAmount } from '../utils/theme';
import { AnimatedCard } from '../components/AnimatedComponents';
import ModernBackground from '../components/ModernBackground';
import { Transaction } from '../types';

const { width: screenWidth } = Dimensions.get('window');

const ReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data } = useApp();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<any>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Get transactions for selected year
  const getYearlyTransactions = () => {
    if (!data?.transactions) return [];
    
    return data.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === selectedYear;
    });
  };

  // Calculate yearly statistics
  const calculateYearlyStats = () => {
    const yearlyTransactions = getYearlyTransactions();
    
    const income = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Calculate monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = yearlyTransactions.filter(t => 
        new Date(t.date).getMonth() === month
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: new Date(2024, month).toLocaleDateString('en-US', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
        transactionCount: monthTransactions.length
      };
    });
    
    // Calculate category breakdown
    const categoryBreakdown = yearlyTransactions.reduce((acc, transaction) => {
      const categoryName = transaction.category || 'Unknown';
      
      if (!acc[categoryName]) {
        acc[categoryName] = { income: 0, expenses: 0, count: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[categoryName].income += transaction.amount;
      } else {
        acc[categoryName].expenses += transaction.amount;
      }
      acc[categoryName].count += 1;
      
      return acc;
    }, {} as any);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalBalance: balance,
      transactionCount: yearlyTransactions.length,
      monthlyData,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]: [string, any]) => ({
        name,
        ...data,
        total: data.income + data.expenses
      })).sort((a, b) => b.total - a.total)
    };
  };

  useEffect(() => {
    setReportData(calculateYearlyStats());
  }, [selectedYear, data?.transactions]);

  useEffect(() => {
    loadUnreadAlertsCount();
  }, [data?.budgetAlerts]);

  const loadUnreadAlertsCount = async () => {
    try {
      const alertStats = await AlertService.getAlertStats();
      setUnreadAlertsCount(alertStats.unread);
    } catch (error) {
      console.error('Error loading unread alerts count:', error);
      setUnreadAlertsCount(0);
    }
  };

  const changeYear = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
    setSelectedYear(newYear);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, data?.settings?.currency || 'USD');
  };

  const generateReportText = () => {
    if (!reportData) return '';
    
    let report = `📊 BUDGET REPORT ${selectedYear}\n\n`;
    report += `💰 TOTAL INCOME: ${formatCurrency(reportData.totalIncome)}\n`;
    report += `💸 TOTAL EXPENSES: ${formatCurrency(reportData.totalExpenses)}\n`;
    report += `💵 BALANCE: ${formatCurrency(reportData.totalBalance)}\n`;
    report += `📝 TRANSACTIONS: ${reportData.transactionCount}\n\n`;
    
    report += `📅 MONTHLY BREAKDOWN:\n`;
    reportData.monthlyData.forEach((month: any) => {
      if (month.transactionCount > 0) {
        report += `${month.month}: ${formatCurrency(month.balance)} (${month.transactionCount} transactions)\n`;
      }
    });
    
    report += `\n🏷️ TOP CATEGORIES:\n`;
    reportData.categoryBreakdown.slice(0, 5).forEach((category: any, index: number) => {
      report += `${index + 1}. ${category.name}: ${formatCurrency(category.total)}\n`;
    });
    
    return report;
  };

  const generateCSV = () => {
    if (!reportData) return 'Month,Income,Expenses,Balance,Transaction Count\nNo data available';
    
    let csv = 'Month,Income,Expenses,Balance,Transaction Count\n';
    reportData.monthlyData.forEach((month: any) => {
      csv += `${month.month},${month.income || 0},${month.expenses || 0},${month.balance || 0},${month.transactionCount || 0}\n`;
    });
    
    csv += '\nCategory,Income,Expenses,Total,Count\n';
    if (reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0) {
      reportData.categoryBreakdown.forEach((category: any) => {
        const categoryName = (category.name || 'Unknown').replace(/"/g, '""');
        csv += `"${categoryName}",${category.income || 0},${category.expenses || 0},${category.total || 0},${category.count || 0}\n`;
      });
    } else {
      csv += '"No categories",0,0,0,0\n';
    }
    
    return csv;
  };

  const generatePDFContent = () => {
    if (!reportData) return '';
    
    let pdfContent = `BUDGET MANAGER ANNUAL REPORT\n`;
    pdfContent += `Year: ${selectedYear}\n`;
    pdfContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    pdfContent += `SUMMARY\n`;
    pdfContent += `-------\n`;
    pdfContent += `Total Income: ${formatCurrency(reportData.totalIncome)}\n`;
    pdfContent += `Total Expenses: ${formatCurrency(reportData.totalExpenses)}\n`;
    pdfContent += `Net Balance: ${formatCurrency(reportData.totalBalance)}\n`;
    pdfContent += `Total Transactions: ${reportData.transactionCount}\n\n`;
    
    pdfContent += `MONTHLY BREAKDOWN\n`;
    pdfContent += `----------------\n`;
    pdfContent += `Month\t\tIncome\t\tExpenses\t\tBalance\t\tTransactions\n`;
    pdfContent += `-----\t\t------\t\t--------\t\t-------\t\t-----------\n`;
    
    reportData.monthlyData.forEach((month: any) => {
      pdfContent += `${month.month}\t\t${formatCurrency(month.income)}\t\t${formatCurrency(month.expenses)}\t\t${formatCurrency(month.balance)}\t\t${month.transactionCount}\n`;
    });
    
    pdfContent += `\nTOP CATEGORIES\n`;
    pdfContent += `--------------\n`;
    pdfContent += `Rank\tCategory\t\tTotal Amount\n`;
    pdfContent += `----\t--------\t\t------------\n`;
    
    reportData.categoryBreakdown.slice(0, 5).forEach((category: any, index: number) => {
      pdfContent += `${index + 1}\t${category.name}\t\t${formatCurrency(category.total)}\n`;
    });
    
    return pdfContent;
  };

  const handleShare = async () => {
    try {
      Alert.alert(
        'Export Options',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Text Report',
            onPress: async () => {
              const reportText = generateReportText();
              await Share.share({
                message: reportText,
                title: `Budget Report ${selectedYear}`,
              });
            }
          },
          {
            text: 'CSV (Excel)',
            onPress: async () => {
              const csvContent = generateCSV();
              await Share.share({
                message: csvContent,
                title: `Budget Data ${selectedYear} - Excel Format`,
              });
            }
          },
          {
            text: 'PDF Format',
            onPress: async () => {
              const pdfContent = generatePDFContent();
              await Share.share({
                message: pdfContent,
                title: `Budget Report ${selectedYear} - PDF Format`,
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleExport = () => {
    handleShare();
  };

  if (!reportData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating Report...</Text>
        </View>
      </View>
    );
  }

  return (
    <ModernBackground variant="gradient">
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Custom Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="analytics" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Annual Report</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Alerts')}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.white} />
                {unreadAlertsCount > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(400)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(500)} style={styles.headerActionContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleExport}
              >
                <Ionicons name="share-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Year Navigation */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.yearNavigation}>
          <TouchableOpacity 
            style={styles.yearButton}
            onPress={() => changeYear('prev')}
          >
            <Ionicons name="chevron-back" size={16} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity 
            style={styles.yearButton}
            onPress={() => changeYear('next')}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <AnimatedCard style={styles.summaryCard} delay={250}>
              <View style={styles.summaryIcon}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.totalIncome)}</Text>
                <Text style={styles.summaryLabel}>Total Income</Text>
              </View>
            </AnimatedCard>
            
            <AnimatedCard style={styles.summaryCard} delay={300}>
              <View style={styles.summaryIcon}>
                <Ionicons name="trending-down" size={20} color={colors.error} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.totalExpenses)}</Text>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
              </View>
            </AnimatedCard>
          </View>
          
          <View style={styles.summaryRow}>
            <AnimatedCard style={styles.summaryCard} delay={350}>
              <View style={styles.summaryIcon}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.totalBalance)}</Text>
                <Text style={styles.summaryLabel}>Net Balance</Text>
              </View>
            </AnimatedCard>
            
            <AnimatedCard style={styles.summaryCard} delay={400}>
              <View style={styles.summaryIcon}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryValue}>{reportData.transactionCount}</Text>
                <Text style={styles.summaryLabel}>Transactions</Text>
              </View>
            </AnimatedCard>
          </View>
        </Animated.View>

        {/* Monthly Breakdown */}
        <Animated.View entering={SlideInUp.delay(300)} style={styles.section}>
          <AnimatedCard style={styles.monthlyContainer} delay={450}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerMonth}>Month</Text>
              <Text style={styles.headerIncome}>Income</Text>
              <Text style={styles.headerExpenses}>Expenses</Text>
              <Text style={styles.headerBalance}>Balance</Text>
            </View>
            {reportData.monthlyData.map((month: any, index: number) => (
              <Animated.View 
                key={index} 
                entering={FadeIn.delay(500 + (index * 50))}
                style={styles.monthItem}
              >
                <Text style={styles.monthName}>{month.month}</Text>
                <View style={styles.monthStats}>
                  <Text style={styles.monthIncome}>+{formatCurrency(month.income)}</Text>
                  <Text style={styles.monthExpenses}>-{formatCurrency(month.expenses)}</Text>
                  <Text style={[
                    styles.monthBalance,
                    { color: month.balance >= 0 ? colors.primary : colors.error }
                  ]}>
                    {formatCurrency(month.balance)}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </AnimatedCard>
        </Animated.View>

        {/* Top Categories */}
        <Animated.View entering={SlideInUp.delay(400)} style={styles.section}>
          <View style={styles.categoriesContainer}>
            <AnimatedCard style={styles.categoriesCardInner} delay={550}>
              {reportData.categoryBreakdown.slice(0, 5).map((category: any, index: number) => (
                <Animated.View 
                  key={index} 
                  entering={FadeIn.delay(600 + (index * 50))}
                  style={styles.categoryItem}
                >
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryRank}>#{index + 1}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(category.total)}</Text>
                </Animated.View>
              ))}
            </AnimatedCard>
          </View>
        </Animated.View>
      </ScrollView>
    </ModernBackground>
  );
};

const styles = StyleSheet.create({
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
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  alertBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10, // Account for fixed header
    paddingHorizontal: spacing.sm, // Reduced for wider layout
    paddingBottom: 100, // Account for bottom navigation
  },
  
  // Year Navigation
  yearNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginHorizontal: 0, // Remove horizontal margins for full width
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  yearButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  yearText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
    marginHorizontal: spacing.lg,
  },
  
  // Summary Cards
  summaryContainer: {
    marginBottom: spacing.sm,
    marginHorizontal: 0, // Remove horizontal margins for full width
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.md, // Smaller border radius
    padding: spacing.sm, // Increased padding for horizontal layout
    marginHorizontal: 2, // Minimal margin for full width
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row', // Horizontal layout
    alignItems: 'center', // Center vertically
    ...shadows.sm,
  },
  summaryIcon: {
    width: 40, // Slightly larger for better visibility
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // Right margin instead of bottom
  },
  summaryInfo: {
    flex: 1, // Take remaining space
    alignItems: 'flex-start', // Left align text
  },
  summaryValue: {
    ...typography.h4, // Smaller text size
    color: colors.white,
    fontWeight: '700',
    marginBottom: 2, // Minimal margin
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'left', // Left align instead of center
    fontSize: 10, // Smaller label text
  },
  
  // Sections
  section: {
    marginBottom: spacing.xs, // Further reduced gap between sections
    marginHorizontal: spacing.xs, // Reduced margins for wider layout
  },
  
  // Monthly Breakdown
  monthlyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm, // Reduced padding for wider layout
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: spacing.xs,
  },
  headerMonth: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 60,
  },
  headerIncome: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerExpenses: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerBalance: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    minWidth: 60,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  monthIncome: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  monthExpenses: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  monthBalance: {
    ...typography.body,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
  
  // Categories
  categoriesContainer: {
    // Container for layout animation wrapper
  },
  categoriesCardInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm, // Reduced padding for wider layout
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRank: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginRight: spacing.sm,
    minWidth: 30,
  },
  categoryName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  categoryAmount: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ReportScreen;
