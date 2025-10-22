import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  FadeIn,
} from "react-native-reanimated";
import { useApp } from "../contexts/AppContext";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  formatCurrencyAmount,
} from "../utils/theme";
import { AlertHistory } from "../types";
import BudgetService from "../services/BudgetService";
import ToastService from "../services/ToastService";

const AlertHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data, refreshData } = useApp();

  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    loadAlertHistory();
  }, [selectedPeriod]);

  const loadAlertHistory = async () => {
    try {
      setLoading(true);
      const history = await BudgetService.getAlertHistory(
        parseInt(selectedPeriod),
      );
      setAlertHistory(history);
    } catch (error) {
      console.error("Error loading alert history:", error);
      ToastService.error("Error", "Failed to load alert history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlertHistory();
    setRefreshing(false);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "warning";
      case "exceeded":
        return "alert-circle";
      case "achieved":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return colors.warning || "#FFA500";
      case "exceeded":
        return colors.error;
      case "achieved":
        return colors.success || "#4CAF50";
      default:
        return colors.primary;
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case "warning":
        return "Budget Warning";
      case "exceeded":
        return "Budget Exceeded";
      case "achieved":
        return "Budget Achievement";
      default:
        return "Budget Alert";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const periodOptions = [
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
    { value: "90", label: "90 Days" },
  ];

  const renderAlertItem = (alert: AlertHistory, index: number) => {
    const alertColor = getAlertColor(alert.type);
    const alertIcon = getAlertIcon(alert.type);
    const alertTitle = getAlertTitle(alert.type);

    return (
      <Animated.View
        key={alert.id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.alertItem, { borderLeftColor: alertColor }]}
      >
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View
              style={[styles.alertIcon, { backgroundColor: alertColor + "20" }]}
            >
              <Ionicons name={alertIcon as any} size={20} color={alertColor} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{alertTitle}</Text>
              <Text style={styles.alertCategory}>{alert.categoryName}</Text>
              <Text style={styles.alertDetails}>
                {alert.type === "exceeded"
                  ? `Exceeded by ${formatCurrencyAmount(alert.amount - alert.budgetAmount, data.settings.currency)}`
                  : `At ${alert.percentageUsed.toFixed(0)}% of budget`}
              </Text>
            </View>
          </View>
          <View style={styles.alertRight}>
            <Text style={styles.alertTime}>{formatDate(alert.createdAt)}</Text>
            <Text style={styles.alertAmount}>
              {formatCurrencyAmount(alert.amount, data.settings.currency)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Alert History</Text>
      <Text style={styles.emptyDescription}>
        Your budget alert history for the selected period will appear here
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1B263B", "#0D1B2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
      >
        <Animated.View
          entering={SlideInLeft.delay(200)}
          style={styles.headerTitleContainer}
        >
          <Ionicons
            name="time"
            size={18}
            color={colors.white}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Alert History</Text>
        </Animated.View>
        <Animated.View
          entering={SlideInRight.delay(300)}
          style={styles.headerActionContainer}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Period Selector */}
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.periodSelector}
      >
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodButton,
              selectedPeriod === option.value && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(option.value as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === option.value &&
                  styles.periodButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Alert History...</Text>
          </View>
        ) : alertHistory.length > 0 ? (
          alertHistory.map((alert, index) => renderAlertItem(alert, index))
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: "700",
  },
  headerActionContainer: {
    position: "relative",
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  alertItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  alertCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertDetails: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  alertRight: {
    alignItems: "flex-end",
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertAmount: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});

export default AlertHistoryScreen;
