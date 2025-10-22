import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../contexts/AppContext";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  formatCurrencyAmount,
} from "../utils/theme";
import { getCategoryDetails } from "../utils/categoryUtils";
import DataService from "../services/DataService";
import { DashboardStats } from "../types";

const DashboardScreenSimple: React.FC = () => {
  const { data } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const statsData = await DataService.getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Set default stats to prevent crash
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBalance: 0,
        topCategories: [],
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [data?.transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, data?.settings?.currency || "USD");
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={["#667eea", "#764ba2", "#f093fb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            {/* Subtle overlay for enhanced glassmorphism */}
            <View style={styles.glassOverlay} />
            <View style={styles.balanceContent}>
              <View style={styles.balanceHeader}></View>

              <Text style={styles.balanceAmount}>
                {formatCurrency(stats.balance)}
              </Text>

              {/* Monthly Change Indicator */}
              <View style={styles.monthlyChangeContainer}>
                <View style={styles.monthlyChangeItem}>
                  <Text style={styles.monthlyChangeLabel}>This Month</Text>
                  <Text
                    style={[
                      styles.monthlyChangeValue,
                      {
                        color:
                          stats.monthlyBalance >= 0
                            ? colors.success
                            : colors.error,
                      },
                    ]}
                  >
                    {stats.monthlyBalance >= 0 ? "+" : ""}
                    {formatCurrency(stats.monthlyBalance)}
                  </Text>
                </View>

                <View style={styles.monthlyChangeDivider} />

                <View style={styles.monthlyChangeItem}>
                  <Text style={styles.monthlyChangeLabel}>Change</Text>
                  <View style={styles.changeIndicator}>
                    <Ionicons
                      name={
                        stats.monthlyBalance >= 0
                          ? "trending-up"
                          : "trending-down"
                      }
                      size={14}
                      color={
                        stats.monthlyBalance >= 0
                          ? colors.success
                          : colors.error
                      }
                    />
                    <Text
                      style={[
                        styles.changePercentage,
                        {
                          color:
                            stats.monthlyBalance >= 0
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      {Math.abs(stats.monthlyBalance) > 0
                        ? `${((stats.monthlyBalance / Math.max(stats.balance - stats.monthlyBalance, 1)) * 100).toFixed(1)}%`
                        : "0%"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* Simple Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(stats.monthlyIncome)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {formatCurrency(stats.monthlyExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>

          {(data?.transactions || []).slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        getCategoryDetails(
                          transaction.category,
                          data.categories,
                        ).color + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      getCategoryDetails(transaction.category, data.categories)
                        .icon as any
                    }
                    size={16}
                    color={
                      getCategoryDetails(transaction.category, data.categories)
                        .color
                    }
                  />
                </View>
                <View style={styles.transactionTextContainer}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === "income"
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 100,
    paddingHorizontal: spacing.lg,
  },

  // Balance Card Styles
  balanceCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.lg,
    elevation: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  balanceGradient: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    position: "relative",
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.lg,
  },
  balanceContent: {
    alignItems: "center",
    zIndex: 1,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: Platform.OS === "ios" ? 36 : 32,
    color: colors.white,
    fontWeight: "800",
    marginBottom: spacing.sm,
    letterSpacing: -1.5,
    textAlign: "center",
    maxWidth: "100%",
  },

  // Monthly Change Styles
  monthlyChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexWrap: "wrap",
  },
  monthlyChangeItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 100,
  },
  monthlyChangeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 2,
  },
  monthlyChangeValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  monthlyChangeDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: spacing.sm,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  changePercentage: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },

  // Stats Container
  statsContainer: {
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    ...shadows.md,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Transactions Styles
  transactionsContainer: {
    marginBottom: spacing.sm,
  },
  transactionsTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  transactionTextContainer: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.textTertiary,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default DashboardScreenSimple;
